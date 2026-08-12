import "dotenv/config";
import { fileURLToPath } from "node:url";
import path from "node:path";
import express from "express";
import cookieParser from "cookie-parser";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { assertCryptoEnv } from "./server/crypto.mjs";
import { createAuth } from "./server/auth.mjs";
import { createBank } from "./server/bank.mjs";
import { registerGemini } from "./server/gemini.mjs";
import { createRateLimiter } from "./server/rate-limit.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Copy .env.example to .env and start Postgres (npm run db:up).");
  process.exit(1);
}

// Fail fast if the auth/encryption secrets are missing or malformed.
try {
  assertCryptoEnv();
} catch (error) {
  console.error(error.message);
  process.exit(1);
}

// Prisma 7 connects through a driver adapter; swap DATABASE_URL to scale to managed Postgres.
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });
const app = express();
const PORT = Number(process.env.PORT) || 4173;

// Behind a reverse proxy, req.ip (used by rate limiting and the login throttle)
// only reflects the real client when Express is told to trust the proxy. Opt in
// explicitly via env so forwarded headers aren't trusted by default (they are
// spoofable when directly exposed). TRUST_PROXY=true, or a hop count / subnet.
if (process.env.TRUST_PROXY) {
  const value = process.env.TRUST_PROXY;
  app.set("trust proxy", value === "true" ? 1 : /^\d+$/.test(value) ? Number(value) : value);
}

// Don't advertise the framework.
app.disable("x-powered-by");

// Baseline security headers (conservative — no CSP, to avoid breaking the
// Plaid Link script and Google Fonts the frontend loads).
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  next();
});

// Broad limit across the whole API, plus a much stricter limit on the auth
// endpoints to slow credential stuffing and mass account creation.
//
// These run BEFORE any body parser. Mounted after, they could not help: the
// 16mb parser below would have already buffered and JSON.parsed the entire
// body of an unauthenticated request before the limiter or the 401 was
// reached, so a handful of concurrent posts to the Gemini route could exhaust
// memory without so much as a cookie.
app.use("/api", createRateLimiter({ windowMs: 15 * 60 * 1000, max: 300 }));
const authLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: "Too many authentication attempts. Try again later."
});
app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);

const auth = createAuth(prisma);
const { requireAuth } = auth;

// Cookies are parsed here rather than inside auth.register() because
// requireAuth reads them, and it now gates a middleware that runs before the
// route table.
app.use(cookieParser());

// Receipt photos arrive as base64 JSON on the Gemini proxy route, so it needs
// a larger body cap than the rest of the API (body-parser skips re-parsing, so
// mounting the bigger limit first scopes it to this path only). requireAuth
// gates the big parser, so only a logged-in user can make the server hold
// 16mb of request body.
app.use("/api/gemini/parse", requireAuth, express.json({ limit: "16mb" }));
app.use(express.json({ limit: "2mb" }));

// Routes last, so every request reaching one has been limited and parsed.
auth.register(app);

const bank = createBank(prisma);
bank.register(app, requireAuth);

// Gemini config + image-parsing proxy. Keys (shared or per-user) stay
// server-side and are never returned to the browser (see server/gemini.mjs).
registerGemini(app, requireAuth, prisma);

// --- API -------------------------------------------------------------------

const toNumber = (value) => (value === null || value === undefined ? null : Number(value));

function serializeReceipt(receipt) {
  return {
    id: receipt.id,
    storeName: receipt.storeName,
    category: receipt.category,
    subtotal: toNumber(receipt.subtotal),
    tax: toNumber(receipt.tax),
    total: toNumber(receipt.total),
    createdAt: receipt.createdAt,
    people: receipt.people.map((person) => ({ id: person.id, name: person.name })),
    lines: receipt.lines.map((line) => ({
      label: line.label,
      amount: toNumber(line.amount),
      assignments: line.assignments.map((assignment) => ({
        personName: assignment.person?.name ?? "",
        mode: assignment.mode,
        value: toNumber(assignment.value)
      }))
    }))
  };
}

const receiptInclude = {
  people: true,
  lines: {
    orderBy: { sortOrder: "asc" },
    include: { assignments: { include: { person: true } } }
  }
};

// Upper bounds so a single request can't spawn an unbounded number of rows.
const MAX_LINES = 500;
const MAX_PEOPLE = 100;
const MAX_ASSIGNMENTS = 5000;
const MAX_TEXT_LENGTH = 200;
// DECIMAL(10,2) tops out at 99,999,999.99; stay well inside it.
const MAX_AMOUNT = 1e8;
const ASSIGNMENT_MODES = new Set(["equal", "percent", "amount"]);

// Thrown from inside the save transaction to roll it back and answer 400.
class BadRequestError extends Error {}

// Only accept values the Decimal columns can actually hold. Infinity (which
// JSON.parse happily produces from 1e999) used to reach Postgres as a numeric
// infinity and come back out of serializeReceipt as null, silently corrupting
// the stored total; anything over the column's range threw a 500 instead.
function isStorableAmount(value) {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) < MAX_AMOUNT;
}

function isShortString(value) {
  return typeof value === "string" && value.length > 0 && value.length <= MAX_TEXT_LENGTH;
}

// Returns an error message, or null when the payload is safe to persist.
// Everything here previously went straight into Prisma, where a wrong type or
// a missing field surfaced as a 500 rather than a 400.
function validateReceiptPayload(body) {
  if (!Array.isArray(body.lines) || body.lines.length === 0) {
    return "At least one receipt line is required.";
  }
  if (body.people !== undefined && !Array.isArray(body.people)) {
    return "people must be an array.";
  }
  if (body.assignments !== undefined && !Array.isArray(body.assignments)) {
    return "assignments must be an array.";
  }
  if (body.storeName !== null && body.storeName !== undefined && !isShortString(body.storeName)) {
    return "storeName must be a short string.";
  }
  if (body.category !== undefined && body.category !== null && !isShortString(body.category)) {
    return "category must be a short string.";
  }
  for (const field of ["subtotal", "tax", "total"]) {
    const value = body[field];
    if (value !== null && value !== undefined && !isStorableAmount(value)) {
      return `${field} must be a number within range.`;
    }
  }
  for (const line of body.lines) {
    if (!line || typeof line !== "object") return "Each line must be an object.";
    if (!isShortString(line.label)) return "Each line needs a label of 1-200 characters.";
    if (line.amount !== undefined && !isStorableAmount(line.amount)) {
      return "Each line amount must be a number within range.";
    }
  }
  for (const person of body.people ?? []) {
    if (!person || typeof person !== "object") return "Each person must be an object.";
    if (!isShortString(person.name)) return "Each person needs a name of 1-200 characters.";
  }
  for (const assignment of body.assignments ?? []) {
    if (!assignment || typeof assignment !== "object") return "Each assignment must be an object.";
    if (assignment.mode !== undefined && !ASSIGNMENT_MODES.has(assignment.mode)) {
      return "Unknown assignment mode.";
    }
    if (assignment.value !== undefined && !isStorableAmount(assignment.value)) {
      return "Each assignment value must be a number within range.";
    }
  }
  return null;
}

app.post("/api/receipts", requireAuth, async (req, res) => {
  const body = req.body ?? {};
  const invalid = validateReceiptPayload(body);
  if (invalid) {
    return res.status(400).json({ error: invalid });
  }
  if (
    body.lines.length > MAX_LINES ||
    (body.people ?? []).length > MAX_PEOPLE ||
    (body.assignments ?? []).length > MAX_ASSIGNMENTS
  ) {
    return res.status(413).json({ error: "Receipt is too large." });
  }

  try {
    const result = await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.create({
        data: {
          userId: req.userId,
          storeName: body.storeName ?? null,
          category: body.category ?? "Other",
          subtotal: body.subtotal ?? null,
          tax: body.tax ?? null,
          total: body.total ?? null
        }
      });

      const personByClient = new Map();
      for (const person of body.people ?? []) {
        const created = await tx.person.create({
          data: { receiptId: receipt.id, name: person.name }
        });
        personByClient.set(person.clientId, created.id);
      }

      const lineByClient = new Map();
      let sortOrder = 0;
      for (const line of body.lines) {
        const created = await tx.receiptLine.create({
          data: {
            receiptId: receipt.id,
            label: line.label,
            amount: line.amount ?? 0,
            ignored: Boolean(line.ignored),
            sortOrder: sortOrder++
          }
        });
        lineByClient.set(line.clientId, created.id);
      }

      const assignmentData = (body.assignments ?? []).map((assignment) => ({
        lineId: lineByClient.get(assignment.lineClientId),
        personId: personByClient.get(assignment.personClientId),
        mode: assignment.mode ?? "equal",
        value: assignment.value ?? 0
      }));
      // An assignment pointing at a line or person that isn't in this payload
      // used to be dropped here, so the caller got a 201 for a receipt that had
      // quietly lost some of its splits. Fail the whole save instead; the
      // transaction rolls back and the client can say something went wrong.
      if (assignmentData.some((assignment) => !assignment.lineId || !assignment.personId)) {
        throw new BadRequestError("An assignment referenced an unknown line or person.");
      }

      if (assignmentData.length > 0) {
        await tx.lineAssignment.createMany({ data: assignmentData });
      }

      return tx.receipt.findUnique({ where: { id: receipt.id }, include: receiptInclude });
    });

    res.status(201).json(serializeReceipt(result));
  } catch (error) {
    if (error instanceof BadRequestError) {
      return res.status(400).json({ error: error.message });
    }
    console.error("Failed to save receipt:", error);
    res.status(500).json({ error: "Failed to save receipt." });
  }
});

app.delete("/api/receipts/:id", requireAuth, async (req, res) => {
  try {
    // Scope the delete to the caller so one user can't remove another's
    // receipt. Cascades to lines, people, and assignments (see schema).
    const result = await prisma.receipt.deleteMany({
      where: { id: req.params.id, userId: req.userId }
    });
    if (result.count === 0) {
      return res.status(404).json({ error: "Receipt not found." });
    }
    res.status(204).end();
  } catch (error) {
    console.error("Failed to delete receipt:", error);
    res.status(500).json({ error: "Failed to delete receipt." });
  }
});

app.get("/api/receipts", requireAuth, async (req, res) => {
  try {
    const receipts = await prisma.receipt.findMany({
      where: { userId: req.userId },
      orderBy: { createdAt: "desc" },
      include: receiptInclude
    });
    res.json(receipts.map(serializeReceipt));
  } catch (error) {
    console.error("Failed to list receipts:", error);
    res.status(500).json({ error: "Failed to load receipts." });
  }
});

// --- Static frontend -------------------------------------------------------

// Never expose source, config, or dependency files over HTTP.
const BLOCKED = [
  /^\/src\//,
  /^\/server\//,
  /^\/server\.mjs$/,
  /^\/package(-lock)?\.json$/,
  /^\/tsconfig\.json$/,
  /^\/prisma(\/|\.config\.ts$)/,
  /^\/node_modules\//,
  /^\/docker-compose\.yml$/,
  // Never serve TLS material or private keys, even though Plaid needs none.
  /^\/certs\//,
  /\.(pem|key|crt|p12|pfx)$/i
];

// req.path is NOT url-decoded, but the static handler decodes before it touches
// the disk. Matching the raw path therefore let a single percent-encoded
// character walk straight past every rule here — /%73erver/crypto.mjs served
// the file that /server/crypto.mjs refused. Match on the decoded path (and
// reject anything that won't decode, or that smuggles a NUL) so the patterns
// see the same string the filesystem will.
app.use((req, res, next) => {
  let decoded;
  try {
    decoded = decodeURIComponent(req.path);
  } catch {
    return res.status(400).end();
  }
  if (decoded.includes("\0") || BLOCKED.some((pattern) => pattern.test(decoded))) {
    return res.status(404).end();
  }
  next();
});

// dotfiles: "ignore" makes .env (and other dotfiles) return 404.
app.use(express.static(__dirname, { dotfiles: "ignore", index: "index.html" }));

// Terminal error handler. Without one, Express's default handler renders the
// stack trace into the response whenever NODE_ENV isn't "production" — so
// malformed JSON, an oversized body, or any unhandled rejection in a route
// handed the caller absolute file paths and internal error text. Log the
// detail, return a flat message.
app.use((error, _req, res, _next) => {
  console.error("Unhandled request error:", error);
  if (res.headersSent) return;
  const status = Number(error?.status || error?.statusCode) || 500;
  // Body-parser's own 4xx (bad JSON, payload too large) are the caller's
  // fault and safe to name; everything else stays opaque.
  const message = status >= 400 && status < 500 ? "Invalid request." : "Internal server error.";
  res.status(status).json({ error: message });
});

app.listen(PORT, () => {
  console.log(`Receipt Ring running at http://localhost:${PORT}`);
});
