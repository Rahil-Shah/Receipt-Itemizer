import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing } from "./helpers/load-bundle.mjs";

function makeServices() {
  const { ReceiptRing, localStorage } = loadReceiptRing();
  const ruleStorage = new ReceiptRing.Services.CategoryRuleStorageService("test-rules");
  const categorization = new ReceiptRing.Services.CategorizationService(
    ReceiptRing.Config.CATEGORIES,
    ruleStorage
  );
  return { ReceiptRing, ruleStorage, categorization, localStorage };
}

test("keyword match lands groceries with keyword-match source", () => {
  const { categorization } = makeServices();
  const result = categorization.categorize("Organic banana");
  assert.equal(result.category, "Groceries");
  assert.equal(result.source, "keyword-match");
  assert.equal(result.shouldPrompt, false);
  assert.ok(result.confidence > 0.66);
});

test("unknown labels fall back to Other and ask for review", () => {
  const { categorization } = makeServices();
  const result = categorization.categorize("Zzyzx flux capacitor");
  assert.equal(result.category, "Other");
  assert.equal(result.source, "uncertain");
  assert.equal(result.shouldPrompt, true);
});

test("a saved rule overrides keyword matching with full confidence", () => {
  const { categorization, ruleStorage } = makeServices();
  ruleStorage.saveRule("Protein bar", "Groceries");
  const result = categorization.categorize("Protein bar");
  assert.equal(result.category, "Groceries");
  assert.equal(result.source, "saved-rule");
  assert.equal(result.confidence, 1);
});

test("saved rules survive via localStorage and normalize their label", () => {
  const { ruleStorage } = makeServices();
  ruleStorage.saveRule("MILK 2% 1 Gal!!", "Groceries");
  assert.equal(ruleStorage.getCategoryFor("milk 2% 1 gal"), "Groceries");
});

test("normalizeLabel strips punctuation, sizes, and counts", () => {
  const { ruleStorage } = makeServices();
  assert.equal(ruleStorage.normalizeLabel("Chips & Salsa 12 oz"), "chips and salsa");
  assert.equal(ruleStorage.normalizeLabel("EGGS-LARGE 12 ct"), "eggs");
});

test("corrupt stored rules don't break categorization", () => {
  const { ReceiptRing, localStorage } = loadReceiptRing();
  localStorage.setItem("test-rules", "{ not json");
  const ruleStorage = new ReceiptRing.Services.CategoryRuleStorageService("test-rules");
  assert.equal(ruleStorage.getCategoryFor("banana"), null);
});
