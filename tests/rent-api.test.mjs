import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing } from "./helpers/load-bundle.mjs";

// Loads the bundle with a recording fetch fake so the service's URLs, methods,
// and payloads can be asserted without a server.
function makeService(response = { ok: true, json: {} }) {
  const calls = [];
  const fetchFake = async (url, init) => {
    calls.push({ url, init });
    return {
      ok: response.ok,
      status: response.status ?? (response.ok ? 200 : 500),
      json: async () => response.json,
      text: async () => JSON.stringify(response.json)
    };
  };
  const { ReceiptRing } = loadReceiptRing({ fetch: fetchFake });
  return { service: new ReceiptRing.Services.RentEntryApiService(), calls };
}

test("create posts the rent entry as JSON", async () => {
  const { service, calls } = makeService({ ok: true, json: { id: "r1" } });
  await service.create({ year: 2026, month: 8, amount: 1500, date: "2026-08-01" });

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/rent-entries");
  assert.equal(calls[0].init.method, "POST");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.year, 2026);
  assert.equal(body.month, 8);
  assert.equal(body.amount, 1500);
  assert.equal(body.date, "2026-08-01");
});

test("update sends photoDataUrl — the field the server actually reads", async () => {
  // Regression: the edit path used to send `photoUrl`, which the PATCH
  // endpoint ignores, silently dropping a replaced proof-of-payment photo.
  const { service, calls } = makeService({ ok: true, json: { id: "r1" } });
  await service.update("r1", { amount: 1600, date: "2026-08-02", photoDataUrl: "data:image/png;base64,x" });

  assert.equal(calls[0].url, "/api/rent-entries/r1");
  assert.equal(calls[0].init.method, "PATCH");
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.photoDataUrl, "data:image/png;base64,x");
  assert.equal("photoUrl" in body, false);
});

test("list scopes to a month via the query string", async () => {
  const { service, calls } = makeService({ ok: true, json: [] });
  await service.list("2026-08");
  assert.equal(calls[0].url, "/api/rent-entries?month=2026-08");
});

test("getSummary hits the summary endpoint", async () => {
  const { service, calls } = makeService({ ok: true, json: { rentTotal: 0, entries: [] } });
  await service.getSummary("2026-08");
  assert.equal(calls[0].url, "/api/rent-entries/summary?month=2026-08");
});

test("create forwards the originating bank transaction", async () => {
  const { service, calls } = makeService({ ok: true, json: { id: "r1" } });
  await service.create({
    year: 2026,
    month: 8,
    amount: 1500,
    date: "2026-08-01",
    bankTransactionId: "txn_1"
  });

  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.bankTransactionId, "txn_1");
});

test("failed requests raise with the server's own sentence, not the raw body", async () => {
  // The message goes straight into a toast, so "Create failed (400):
  // {"error":"..."}" was unreadable where it mattered most: telling the user a
  // rent entry already exists for that month.
  const { service } = makeService({
    ok: false,
    status: 400,
    json: { error: "A rent entry already exists for this month." }
  });
  await assert.rejects(
    () => service.create({ year: 2026, month: 8, amount: 1500, date: "2026-08-01" }),
    { message: "A rent entry already exists for this month." }
  );
});

test("an error body without a message falls back to the status", async () => {
  const { service } = makeService({ ok: false, status: 500, json: {} });
  await assert.rejects(() => service.delete("r1"), { message: "Request failed (500)." });
});
