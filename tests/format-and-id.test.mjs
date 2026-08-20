import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing } from "./helpers/load-bundle.mjs";

const { ReceiptRing } = loadReceiptRing();

test("CurrencyFormatService formats USD", () => {
  const service = new ReceiptRing.Services.CurrencyFormatService();
  assert.equal(service.format(3.5), "$3.50");
  assert.equal(service.format(0), "$0.00");
  assert.equal(service.format(1299.99), "$1,299.99");
  assert.equal(service.format(-5), "-$5.00");
});

test("CurrencyFormatService treats non-numbers as zero", () => {
  const service = new ReceiptRing.Services.CurrencyFormatService();
  assert.equal(service.format(NaN), "$0.00");
  assert.equal(service.format(undefined), "$0.00");
});

test("IdService produces unique ids", () => {
  const service = new ReceiptRing.Services.IdService();
  const ids = new Set(Array.from({ length: 1000 }, () => service.create()));
  assert.equal(ids.size, 1000);
});
