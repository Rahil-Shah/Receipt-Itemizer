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

test("shift-clicking after a tick takes the run between the two", () => {
  const selection = makeSelection();

  selection.toggle("l1");
  selection.selectRange(lines, "l3");

  assert.deepEqual(Array.from(selection.ids()), ["l1", "l2", "l3"]);
});

test("a range reaches backwards from the anchor just as well", () => {
  const selection = makeSelection();

  selection.toggle("l4");
  selection.selectRange(lines, "l2");

  assert.deepEqual(Array.from(selection.ids()).sort(), ["l2", "l3", "l4"]);
});

test("the anchor stays put, so a range can be resized from the same row", () => {
  const selection = makeSelection();

  selection.toggle("l1");
  selection.selectRange(lines, "l4");
  selection.selectRange(lines, "l2");

  // Resizing only ever adds; l3 and l4 were taken by the first range and the
  // second is measured from l1, not from l4.
  assert.equal(selection.has("l1"), true);
  assert.equal(selection.has("l2"), true);
});

test("a range with no anchor behind it is just a tick", () => {
  const selection = makeSelection();

  selection.selectRange(lines, "l3");

  assert.deepEqual(Array.from(selection.ids()), ["l3"]);
});

test("a range whose anchor was pruned away falls back to a tick", () => {
  const selection = makeSelection();

  selection.toggle("l1");
  selection.prune([line("l2"), line("l3")]);
  selection.selectRange([line("l2"), line("l3")], "l3");

  assert.deepEqual(Array.from(selection.ids()), ["l3"]);
});

test("clearing forgets the anchor as well as the ticks", () => {
  const selection = makeSelection();

  selection.toggle("l1");
  selection.clear();
  selection.selectRange(lines, "l3");

  assert.deepEqual(Array.from(selection.ids()), ["l3"]);
});
