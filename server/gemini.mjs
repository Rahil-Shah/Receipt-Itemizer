// Server-side Gemini proxy.
//
// Gemini API keys are secrets and must NEVER be sent to the browser. The client
// uploads the receipt image here and the server calls Gemini with a key it
// holds. A user may supply their own key (stored encrypted at rest, keyed to
// their account); when they haven't, the shared key from process env is used.
// Either way the key stays server-side.

import { encryptSecret, decryptSecret } from "./crypto.mjs";

const GEMINI_HOST = "https://generativelanguage.googleapis.com";
// Gemini model ids are interpolated into the request URL, so constrain them to
// a safe character set to avoid path traversal / URL injection.
const MODEL_RE = /^[A-Za-z0-9._-]+$/;
// Google API keys are ASCII alphanumerics plus - and _ (typically ~39 chars).
// Constrain user input to that set: the key is placed in the request URL, so a
// strict allowlist blocks URL/query injection and stray control characters,
// and caps length to bound abuse.
const API_KEY_RE = /^[A-Za-z0-9_-]{20,200}$/;
const DEFAULT_MODEL = "gemini-2.5-flash";
// Formats Gemini accepts for inline image data. An open /^image\// test let
// "image/" plus arbitrary trailing text through to Google verbatim.
const ALLOWED_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);
// Roughly 8 MB of base64, comfortably inside the route's 16 MB body cap. The
// body limit alone let a caller park a 16 MB buffer per in-flight request.
const MAX_IMAGE_BASE64_LENGTH = 8 * 1024 * 1024;
// Without a deadline, a hung upstream connection pinned a socket and its
// buffer indefinitely.
const UPSTREAM_TIMEOUT_MS = 90_000;

const PROMPT_TEXT = `You are an expert receipt parser. Transcribe exactly what is printed on the receipt. Do NOT do any arithmetic - a separate program validates and reconciles the numbers.

For each purchasable item:
- "price": the amount printed in the price column next to that item, exactly as shown. Never adjust it, never subtract anything from it.
- "discount": any discount, coupon, or savings amount printed on the receipt FOR that item, as a positive number. 0 if none is printed.

How discounts appear on receipts:
- A separate discount line near an item, with a negative amount or trailing minus. Examples: "TPD/1234567 3.00-", "/331066 2.00-", "MEMBER SAVINGS -2.50", "COUPON -1.00". Attach that amount to the item it belongs to (the line directly above it, or the item whose number it references). Do NOT include the discount line as its own item in the items array.
- Both a regular and a reduced price printed for one item, e.g. "Item $20 (reg $25)": price: 20, discount: 5.
- If no discount is printed anywhere for an item, discount is 0. Never invent or estimate a discount.

Do not decide whether a discount is already included in the item's price - just report the printed price and the printed discount separately. The validation program figures out the rest.

Rules:

1. Preserve item order exactly as it appears on the receipt.
2. Every discount line must be attached to an item's "discount" field, never listed as an item.
3. Ignore store addresses, phone numbers, loyalty info, payment methods, card numbers, barcodes, receipt IDs.
4. Do not invent items.
5. If text is unclear, make the best reasonable interpretation.
6. All prices and discounts must be positive numeric values.
7. Extract subtotal, tax, and total exactly as printed on the receipt. Use 0 if not printed.
8. If confidence is low for an item name, still include the item but set the lowConfidence flag.

Return JSON in exactly this format, with no backticks or markdown:
{
  "storeName": "Store Name or null",
  "subtotal": 0.00,
  "tax": 0.00,
  "total": 0.00,
  "items": [
    {
      "name": "Item Name",
      "price": 0.00,
      "discount": 0.00,
      "lowConfidence": false
    }
  ]
}

Return ONLY valid JSON. No other text.`;

// Decide deterministically whether the extracted discounts are already baked
// into the printed item prices (many grocery receipts) or must be subtracted
// from them (Costco-style separate discount lines). The model is told to
// transcribe both numbers without doing arithmetic; here we compare each
// interpretation against the amount actually charged and keep the one that
// adds up.
function validateAndReconcileReceipt(data) {
  if (!Array.isArray(data?.items) || data.items.length === 0) {
    return data;
  }

  const round2 = (n) => Math.round(n * 100) / 100;
  const tax = Number(data.tax) || 0;
  const total = Number(data.total) || 0;
  const statedSubtotal = Number(data.subtotal) || 0;

  // Normalize discounts to positive numbers regardless of how the model
  // reported them.
  data.items = data.items.map((item) => ({
    ...item,
    price: Number(item.price) || 0,
    discount: Math.abs(Number(item.discount) || 0)
  }));

  let priceSum = 0;
  let discountSum = 0;
  for (const item of data.items) {
    priceSum += item.price;
    discountSum += item.discount;
  }
  priceSum = round2(priceSum);
  discountSum = round2(discountSum);

  if (discountSum === 0) {
    return data;
  }

  // Reference the item lines must add up to. Prefer total - tax (the total is
  // the amount actually charged); fall back to the printed subtotal.
  const target = total > 0 ? round2(total - tax) : statedSubtotal;
  if (target <= 0) {
    // No usable reference amount - keep the printed discounts as-is.
    return data;
  }

  const diffAsPrinted = Math.abs(priceSum - target);
  const diffDiscounted = Math.abs(round2(priceSum - discountSum) - target);

  // Prices as printed already explain the charged amount at least as well as
  // subtracting the discounts would: the discounts are informational (already
  // baked into the prices), so drop them to avoid double-discounting.
  if (diffAsPrinted <= diffDiscounted) {
    data.items = data.items.map((item) => ({ ...item, discount: 0 }));
    console.log(
      `Discount reconciliation: baked-in (items=${priceSum}, target=${target}, discounts dropped=${discountSum})`
    );
  } else {
    console.log(
      `Discount reconciliation: separate (items=${priceSum} - discounts=${discountSum} vs target=${target})`
    );
  }
  return data;
}

// Raised when a user has a stored key that can no longer be decrypted — most
// likely because TOKEN_ENCRYPTION_KEY was rotated.
class UndecryptableKeyError extends Error {}

export function hasServerGeminiKey() {
  return Boolean(process.env.GEMINI_API_KEY);
}

export function serverGeminiModel() {
  return process.env.GEMINI_MODEL || DEFAULT_MODEL;
}

export function registerGemini(app, requireAuth, prisma) {
  // Resolve the key to call Gemini with: the user's own key when they've saved
  // one, otherwise the shared server key. Returns "" when neither exists.
  // Read a user's stored key. Returns the key, or null when they have none.
  // Throws UndecryptableKeyError when a key is stored but cannot be read.
  async function readUserKey(userId) {
    if (!prisma || !userId) return null;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { geminiKeyCiphertext: true, geminiKeyIv: true, geminiKeyAuthTag: true }
    });
    if (!user?.geminiKeyCiphertext || !user.geminiKeyIv || !user.geminiKeyAuthTag) {
      return null;
    }
    try {
      return decryptSecret({
        ciphertext: user.geminiKeyCiphertext,
        iv: user.geminiKeyIv,
        authTag: user.geminiKeyAuthTag
      });
    } catch (error) {
      console.error("Failed to decrypt stored Gemini key:", error);
      throw new UndecryptableKeyError();
    }
  }

  // Resolve the key to call Gemini with: the user's own key when they've saved
  // one, otherwise the shared server key. Returns "" when neither exists.
  //
  // An undecryptable personal key used to fall through to the shared key while
  // the config endpoint kept reporting hasUserKey: true. After an encryption
  // key rotation that quietly moved every user onto the operator's key and
  // quota, with nothing but a log line to say so. Surface it instead.
  async function resolveApiKey(userId) {
    const userKey = await readUserKey(userId);
    return userKey ?? process.env.GEMINI_API_KEY ?? "";
  }

  // Reports whether a usable personal key exists, so the UI cannot claim a key
  // is in use when it can no longer be read.
  async function userHasKey(userId) {
    try {
      return (await readUserKey(userId)) !== null;
    } catch {
      return false;
    }
  }

  // Non-secret config for the browser: model, whether a shared server key
  // exists, and whether this user has saved a personal key. The key values
  // themselves are deliberately never returned.
  app.get("/api/gemini-config", requireAuth, async (req, res) => {
    res.json({
      GEMINI_MODEL: serverGeminiModel(),
      hasServerKey: hasServerGeminiKey(),
      hasUserKey: await userHasKey(req.userId)
    });
  });

  // Save (or replace) this user's personal Gemini key. The plaintext key is
  // validated, encrypted, and stored; it is never echoed back.
  app.put("/api/gemini-key", requireAuth, async (req, res) => {
    if (!prisma) {
      return res.status(503).json({ error: "Key storage is unavailable." });
    }
    const apiKey = typeof req.body?.apiKey === "string" ? req.body.apiKey.trim() : "";
    if (!API_KEY_RE.test(apiKey)) {
      return res.status(400).json({ error: "That doesn't look like a valid Gemini API key." });
    }
    try {
      const encrypted = encryptSecret(apiKey);
      await prisma.user.update({
        where: { id: req.userId },
        data: {
          geminiKeyCiphertext: encrypted.ciphertext,
          geminiKeyIv: encrypted.iv,
          geminiKeyAuthTag: encrypted.authTag
        }
      });
      res.json({ hasUserKey: true });
    } catch (error) {
      console.error("Failed to store Gemini key:", error);
      res.status(500).json({ error: "Could not save the key." });
    }
  });

  // Remove this user's personal key, reverting to the shared server key.
  app.delete("/api/gemini-key", requireAuth, async (req, res) => {
    if (!prisma) {
      return res.status(503).json({ error: "Key storage is unavailable." });
    }
    try {
      await prisma.user.update({
        where: { id: req.userId },
        data: { geminiKeyCiphertext: null, geminiKeyIv: null, geminiKeyAuthTag: null }
      });
      res.json({ hasUserKey: false, hasServerKey: hasServerGeminiKey() });
    } catch (error) {
      console.error("Failed to clear Gemini key:", error);
      res.status(500).json({ error: "Could not clear the key." });
    }
  });

  // Proxy a single receipt image to Gemini using the resolved server-held key.
  app.post("/api/gemini/parse", requireAuth, async (req, res) => {
    let apiKey;
    try {
      apiKey = await resolveApiKey(req.userId);
    } catch (error) {
      if (error instanceof UndecryptableKeyError) {
        return res.status(400).json({
          error: "Your saved Gemini key can no longer be read. Please re-enter it in Settings."
        });
      }
      throw error;
    }
    if (!apiKey) {
      return res.status(503).json({ error: "No Gemini key is configured." });
    }

    const imageBase64 = typeof req.body?.imageBase64 === "string" ? req.body.imageBase64 : "";
    const mimeType = typeof req.body?.mimeType === "string" ? req.body.mimeType : "";
    const model = String(req.body?.model || serverGeminiModel());

    if (!imageBase64 || !mimeType) {
      return res.status(400).json({ error: "imageBase64 and mimeType are required." });
    }
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return res.status(400).json({ error: "Unsupported image type." });
    }
    if (imageBase64.length > MAX_IMAGE_BASE64_LENGTH) {
      return res.status(413).json({ error: "That image is too large. Try a smaller photo." });
    }
    if (!MODEL_RE.test(model)) {
      return res.status(400).json({ error: "Invalid model name." });
    }

    try {
      const url = `${GEMINI_HOST}/v1/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
      console.log("Sending request to Gemini...");
      const startTime = Date.now();

      const upstream = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: PROMPT_TEXT },
                { inlineData: { mimeType, data: imageBase64 } }
              ]
            }
          ]
        }),
        signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS)
      });

      const elapsedMs = Date.now() - startTime;
      console.log(`Gemini response received in ${elapsedMs}ms`);

      const text = await upstream.text();
      if (!upstream.ok) {
        console.error("Gemini upstream error:", upstream.status, text.slice(0, 300));
        try {
          const errorBody = JSON.parse(text);
          const errorMessage = errorBody?.error?.message || errorBody?.message || "Unknown error";
          return res.status(502).json({
            error: `Receipt parsing failed: ${upstream.status} - ${errorMessage.slice(0, 100)}`
          });
        } catch {
          return res.status(502).json({
            error: `Receipt parsing failed with status ${upstream.status}`
          });
        }
      }

      console.log("Parsing and validating receipt data...");
      // The upstream body is the Gemini API envelope; the receipt JSON is the
      // model's text inside it. Unwrap first — validating the envelope itself
      // silently skips reconciliation (no .items on it).
      const envelope = JSON.parse(text);
      const modelText = envelope?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!modelText) {
        console.error("Gemini returned no text. Envelope:", text.slice(0, 500));
        return res.status(502).json({ error: "The receipt parser returned no readable result. Try again." });
      }
      let parsed;
      try {
        const cleanedText = modelText.trim().replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
        parsed = JSON.parse(cleanedText);
      } catch (parseError) {
        console.error("Failed to parse receipt JSON from Gemini:", parseError, "Text:", modelText.slice(0, 500));
        return res.status(502).json({ error: "The receipt parser returned malformed data. Try again." });
      }
      const validated = validateAndReconcileReceipt(parsed);
      console.log("Receipt validation complete");
      res.type("application/json").json(validated);
    } catch (error) {
      console.error("Gemini proxy failed:", error);
      if (error?.name === "TimeoutError" || error?.name === "AbortError") {
        return res.status(504).json({ error: "The receipt parser took too long. Try again." });
      }
      res.status(502).json({ error: `Could not reach the receipt parser: ${error?.message}` });
    }
  });
}
