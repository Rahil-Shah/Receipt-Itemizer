import test from "node:test";
import assert from "node:assert/strict";
import { parseMonthParam, getMonthRange, getUtcMonthRange } from "../server/month.mjs";

test("parseMonthParam parses valid YYYY-MM values", () => {
  assert.deepEqual(parseMonthParam("2026-08"), { year: 2026, month: 8 });
  assert.deepEqual(parseMonthParam("2026-01"), { year: 2026, month: 1 });
  assert.deepEqual(parseMonthParam("2026-12"), { year: 2026, month: 12 });
});

test("parseMonthParam rejects malformed or out-of-range values", () => {
  assert.equal(parseMonthParam(undefined), null);
  assert.equal(parseMonthParam(""), null);
  assert.equal(parseMonthParam("2026"), null);
  assert.equal(parseMonthParam("2026-8"), null);
  assert.equal(parseMonthParam("2026-00"), null);
  assert.equal(parseMonthParam("2026-13"), null);
  assert.equal(parseMonthParam("2026-08-01"), null);
});

test("getMonthRange spans exactly one local-time month, half open", () => {
  const { start, end } = getMonthRange(2026, 8);
  assert.equal(start.getFullYear(), 2026);
  assert.equal(start.getMonth(), 7);
  assert.equal(start.getDate(), 1);
  assert.equal(end.getMonth(), 8);
  assert.equal(end.getDate(), 1);
  assert.ok(start < end);
});

test("getMonthRange rolls December into January", () => {
  const { end } = getMonthRange(2026, 12);
  assert.equal(end.getFullYear(), 2027);
  assert.equal(end.getMonth(), 0);
});

test("getUtcMonthRange pins boundaries to UTC midnight", () => {
  // Bank transaction dates are calendar dates stored as UTC midnight; a
  // local-time window would clip the first or last day of the month.
  const { start, end } = getUtcMonthRange(2026, 8);
  assert.equal(start.toISOString(), "2026-08-01T00:00:00.000Z");
  assert.equal(end.toISOString(), "2026-09-01T00:00:00.000Z");

  const firstOfMonth = new Date("2026-08-01T00:00:00.000Z");
  const lastOfMonth = new Date("2026-08-31T00:00:00.000Z");
  assert.ok(firstOfMonth >= start && firstOfMonth < end);
  assert.ok(lastOfMonth >= start && lastOfMonth < end);
});

test("getUtcMonthRange rolls December into January", () => {
  const { end } = getUtcMonthRange(2026, 12);
  assert.equal(end.toISOString(), "2027-01-01T00:00:00.000Z");
});
