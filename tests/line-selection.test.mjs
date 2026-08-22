import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing } from "./helpers/load-bundle.mjs";

const { ReceiptRing } = loadReceiptRing();

function line(id, ignored = false) {
  return { id, label: id, amount: 1, confidence: 1, ignored };
}

const lines = [line("l1"), line("l2"), line("l3"), line("l4")];

function makeSelection() {
  return new ReceiptRing.Services.LineSelectionService();
}

test("a fresh selection holds nothing", () => {
  const selection = makeSelection();

  assert.equal(selection.count, 0);
  assert.equal(selection.has("l1"), false);
  assert.deepEqual(Array.from(selection.ids()), []);
});

test("toggling a line ticks it, and toggling again unticks it", () => {
  const selection = makeSelection();

  selection.toggle("l2");
  assert.equal(selection.has("l2"), true);
  assert.equal(selection.count, 1);

  selection.toggle("l2");
  assert.equal(selection.has("l2"), false);
  assert.equal(selection.count, 0);
});

test("selecting all ticks every line that was handed over", () => {
  const selection = makeSelection();

  selection.selectAll(lines);

  assert.equal(selection.count, 4);
  assert.equal(selection.isAllSelected(lines), true);
});

test("selecting all twice does not double count a line", () => {
  const selection = makeSelection();

  selection.selectAll(lines);
  selection.selectAll(lines);

  assert.equal(selection.count, 4);
});

test("an empty receipt is not 'all selected'", () => {
  const selection = makeSelection();

  assert.equal(selection.isAllSelected([]), false);
  assert.equal(selection.isAnySelected([]), false);
});

test("one ticked line counts as a partial selection", () => {
  const selection = makeSelection();

  selection.toggle("l3");

  assert.equal(selection.isAnySelected(lines), true);
  assert.equal(selection.isAllSelected(lines), false);
});

test("clearing drops everything", () => {
  const selection = makeSelection();

  selection.selectAll(lines);
  selection.clear();

  assert.equal(selection.count, 0);
  assert.equal(selection.isAnySelected(lines), false);
});

test("pruning forgets lines a re-parse removed", () => {
  const selection = makeSelection();

  selection.selectAll(lines);
  selection.prune([line("l1"), line("l3")]);

  assert.deepEqual(Array.from(selection.ids()), ["l1", "l3"]);
});

test("pruning keeps a selection that is still entirely on screen", () => {
  const selection = makeSelection();

  selection.toggle("l2");
  selection.prune(lines);

  assert.deepEqual(Array.from(selection.ids()), ["l2"]);
});
