import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing, plain } from "./helpers/load-bundle.mjs";

const { ReceiptRing } = loadReceiptRing();
const { parseRentDateParts, rentMonthKey } = ReceiptRing.Services;

test("parseRentDateParts reads the calendar month from the string itself", () => {
  // Regression: deriving these via new Date("2026-08-01").getMonth() filed an
  // Aug 1 payment under July for anyone west of UTC. The parts must come from
  // the string, independent of the machine's timezone.
  assert.deepEqual(plain(parseRentDateParts("2026-08-01")), { year: 2026, month: 8 });
  assert.deepEqual(plain(parseRentDateParts("2026-01-31")), { year: 2026, month: 1 });
  assert.deepEqual(plain(parseRentDateParts("2026-12-01")), { year: 2026, month: 12 });
});

test("parseRentDateParts tolerates surrounding whitespace", () => {
  assert.deepEqual(plain(parseRentDateParts(" 2026-08-01 ")), { year: 2026, month: 8 });
});

test("parseRentDateParts rejects malformed input", () => {
  assert.equal(parseRentDateParts(""), null);
  assert.equal(parseRentDateParts("not-a-date"), null);
  assert.equal(parseRentDateParts("2026-8-1"), null);
  assert.equal(parseRentDateParts("2026-13-01"), null);
  assert.equal(parseRentDateParts("2026-00-10"), null);
  assert.equal(parseRentDateParts("2026-05-32"), null);
  assert.equal(parseRentDateParts("2026-05-00"), null);
  assert.equal(parseRentDateParts("2026-05"), null);
});

test("rentMonthKey builds zero-padded YYYY-MM keys", () => {
  assert.equal(rentMonthKey(2026, 8), "2026-08");
  assert.equal(rentMonthKey(2026, 12), "2026-12");
  assert.equal(rentMonthKey(2027, 1), "2027-01");
});

test("rentMonthKey matches SpendingAggregatorService.monthKey bucketing", () => {
  const aggregator = new ReceiptRing.Services.SpendingAggregatorService(ReceiptRing.Config.CATEGORIES);
  assert.equal(rentMonthKey(2026, 8), aggregator.monthKey("2026-08-15"));
});
