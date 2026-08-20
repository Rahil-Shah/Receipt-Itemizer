import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing } from "./helpers/load-bundle.mjs";

function makeParser() {
  const { ReceiptRing } = loadReceiptRing();
  const ruleStorage = new ReceiptRing.Services.CategoryRuleStorageService("test-rules");
  const categorization = new ReceiptRing.Services.CategorizationService(
    ReceiptRing.Config.CATEGORIES,
    ruleStorage
  );
  const idService = new ReceiptRing.Services.IdService();
  return new ReceiptRing.Services.ReceiptParserService(categorization, idService);
}

test("parses labeled amounts into items", () => {
  const parser = makeParser();
  const items = parser.parse("Banana 1.25\nCoffee $3.50");
  assert.equal(items.length, 2);
  assert.equal(items[0].label, "Banana");
  assert.equal(items[0].amount, 1.25);
  assert.equal(items[1].label, "Coffee");
  assert.equal(items[1].amount, 3.5);
});

test("skips totals, tax, and payment lines", () => {
  const parser = makeParser();
  const items = parser.parse("Milk 4.00\nSubtotal 4.00\nTax 0.34\nTotal 4.34\nVISA 4.34");
  assert.equal(items.length, 1);
  assert.equal(items[0].label, "Milk");
});

test("does not truncate long amounts (the $10,999 TV regression)", () => {
  const parser = makeParser();
  const items = parser.parse("Tv 10999.00");
  assert.equal(items.length, 1);
  assert.equal(items[0].amount, 10999);
  assert.equal(items[0].label, "Tv");
});

test("handles thousands separators and negative amounts", () => {
  const parser = makeParser();
  const items = parser.parse("Sofa 1,299.99\nDiscount -5.00");
  assert.equal(items[0].amount, 1299.99);
  assert.equal(items[1].amount, -5);
});

test("drops lines without an amount or with a zero amount", () => {
  const parser = makeParser();
  const items = parser.parse("Store 123 Main St\nFreebie 0.00\nBread 2.50");
  assert.equal(items.length, 1);
  assert.equal(items[0].label, "Bread");
});

test("title-cases labels and strips receipt noise", () => {
  const parser = makeParser();
  const [item] = parser.parse("ORGANIC AVOCADO* 2.50");
  assert.equal(item.label, "Organic Avocado");
});
