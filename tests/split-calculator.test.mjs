import test from "node:test";
import assert from "node:assert/strict";
import { loadReceiptRing } from "./helpers/load-bundle.mjs";

const { ReceiptRing } = loadReceiptRing();

const people = [
  { id: "p1", name: "Ana" },
  { id: "p2", name: "Ben" },
  { id: "p3", name: "Cam" }
];

function line(id, amount, ignored = false) {
  return { id, label: id, amount, confidence: 1, ignored };
}

function foodLine(id, amount, ignored = false) {
  return { ...line(id, amount, ignored), isFood: true };
}

function cents(amount) {
  return Math.round(amount * 100);
}

function equalAssignment(lineId, personId) {
  return { id: `${lineId}-${personId}`, lineId, personId, mode: "equal", value: 0 };
}

function makeCalculator() {
  return new ReceiptRing.Services.SplitCalculatorService();
}

test("splitting $10.00 three ways sums back to exactly $10.00", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 10)];
  const assignments = people.map((p) => equalAssignment("l1", p.id));

  const summary = calculator.calculate(people, lines, assignments, 0);

  const total = summary.totals.reduce((sum, t) => sum + t.finalTotal, 0);
  assert.equal(Number(total.toFixed(2)), 10);
  assert.equal(summary.unallocated, 0);
  // Leftover cent lands on someone; nobody strays more than a cent from even.
  for (const t of summary.totals) {
    assert.ok(Math.abs(t.finalTotal - 10 / 3) < 0.011);
  }
});

test("tax is distributed proportionally and sums exactly", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 30), line("l2", 10)];
  const assignments = [
    equalAssignment("l1", "p1"),
    equalAssignment("l2", "p2")
  ];

  const summary = calculator.calculate(people, lines, assignments, 4);

  const byId = new Map(summary.totals.map((t) => [t.personId, t]));
  assert.equal(byId.get("p1").allocatedTax, 3);
  assert.equal(byId.get("p2").allocatedTax, 1);
  assert.equal(byId.get("p3").allocatedTax, 0);
  assert.equal(byId.get("p1").finalTotal, 33);
  assert.equal(byId.get("p2").finalTotal, 11);
});

test("custom amounts that undershoot a line surface as unallocated", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 20)];
  const assignments = [
    { id: "a1", lineId: "l1", personId: "p1", mode: "amount", value: 12 }
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);

  const p1 = summary.totals.find((t) => t.personId === "p1");
  assert.equal(p1.itemTotal, 12);
  assert.equal(summary.unallocated, 8);
});

test("percentage mode charges the given share of the line", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 40)];
  const assignments = [
    { id: "a1", lineId: "l1", personId: "p1", mode: "percentage", value: 25 },
    { id: "a2", lineId: "l1", personId: "p2", mode: "percentage", value: 75 }
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);

  const byId = new Map(summary.totals.map((t) => [t.personId, t]));
  assert.equal(byId.get("p1").itemTotal, 10);
  assert.equal(byId.get("p2").itemTotal, 30);
  assert.equal(summary.unallocated, 0);
});

test("ignored lines are excluded from the split", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 10), line("l2", 99, true)];
  const assignments = [
    equalAssignment("l1", "p1"),
    equalAssignment("l2", "p1")
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);
  const p1 = summary.totals.find((t) => t.personId === "p1");
  assert.equal(p1.finalTotal, 10);
});

test("food total is each person's share of the food lines only", () => {
  const calculator = makeCalculator();
  const lines = [foodLine("l1", 30), line("l2", 15)];
  const assignments = [
    ...people.map((p) => equalAssignment("l1", p.id)),
    equalAssignment("l2", "p1")
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);

  const byId = new Map(summary.totals.map((t) => [t.personId, t]));
  assert.equal(byId.get("p1").itemTotal, 25);
  assert.equal(byId.get("p1").foodTotal, 10);
  assert.equal(byId.get("p2").foodTotal, 10);
  assert.equal(byId.get("p3").foodTotal, 10);
});

test("food total carries no tax", () => {
  const calculator = makeCalculator();
  const lines = [foodLine("l1", 30)];
  const assignments = [equalAssignment("l1", "p1")];

  const summary = calculator.calculate(people, lines, assignments, 6);

  const p1 = summary.totals.find((t) => t.personId === "p1");
  assert.equal(p1.allocatedTax, 6);
  assert.equal(p1.finalTotal, 36);
  assert.equal(p1.foodTotal, 30);
});

test("food total follows percentage shares", () => {
  const calculator = makeCalculator();
  const lines = [foodLine("l1", 40)];
  const assignments = [
    { id: "a1", lineId: "l1", personId: "p1", mode: "percentage", value: 25 },
    { id: "a2", lineId: "l1", personId: "p2", mode: "percentage", value: 75 }
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);

  const byId = new Map(summary.totals.map((t) => [t.personId, t]));
  assert.equal(byId.get("p1").foodTotal, 10);
  assert.equal(byId.get("p2").foodTotal, 30);
  assert.equal(byId.get("p3").foodTotal, 0);
});

test("food total follows custom amounts, undershoot included", () => {
  const calculator = makeCalculator();
  const lines = [foodLine("l1", 20)];
  const assignments = [
    { id: "a1", lineId: "l1", personId: "p1", mode: "amount", value: 12 }
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);

  const p1 = summary.totals.find((t) => t.personId === "p1");
  // The $8 nobody covered is unallocated, so it is nobody's food either.
  assert.equal(p1.foodTotal, 12);
  assert.equal(summary.unallocated, 8);
});

test("ignored food lines are excluded from the food total", () => {
  const calculator = makeCalculator();
  const lines = [foodLine("l1", 10), foodLine("l2", 99, true)];
  const assignments = [equalAssignment("l1", "p1"), equalAssignment("l2", "p1")];

  const summary = calculator.calculate(people, lines, assignments, 0);

  const p1 = summary.totals.find((t) => t.personId === "p1");
  assert.equal(p1.foodTotal, 10);
  assert.equal(p1.itemTotal, 10);
});

test("food shares of an uneven split sum back to the line exactly", () => {
  const calculator = makeCalculator();
  const lines = [foodLine("l1", 10)];
  const assignments = people.map((p) => equalAssignment("l1", p.id));

  const summary = calculator.calculate(people, lines, assignments, 0);

  const foodCents = summary.totals.reduce((sum, t) => sum + cents(t.foodTotal), 0);
  assert.equal(foodCents, 1000);
  // Nobody's food share may outrun the items it came from.
  for (const t of summary.totals) {
    assert.ok(cents(t.foodTotal) <= cents(t.itemTotal));
  }
});

test("a fully assigned receipt balances against its total", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 30), line("l2", 10)];
  const assignments = [
    ...people.map((p) => equalAssignment("l1", p.id)),
    equalAssignment("l2", "p2")
  ];

  const summary = calculator.calculate(people, lines, assignments, 4);

  assert.equal(summary.receiptTotal, 44);
  assert.equal(summary.assignedTotal, 44);
  assert.equal(summary.isBalanced, true);
});

test("an unassigned line leaves the receipt out of balance by its amount", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 30), line("l2", 12.45)];
  const assignments = [equalAssignment("l1", "p1")];

  const summary = calculator.calculate(people, lines, assignments, 0);

  assert.equal(summary.isBalanced, false);
  assert.equal(summary.receiptTotal, 42.45);
  assert.equal(summary.assignedTotal, 30);
  assert.equal(cents(summary.receiptTotal) - cents(summary.assignedTotal), cents(12.45));
  // Nothing was left over on the line p1 was assigned to.
  assert.equal(summary.unallocated, 0);
});

test("the balance gap counts unassigned lines on top of unallocated", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 20), line("l2", 5)];
  const assignments = [
    { id: "a1", lineId: "l1", personId: "p1", mode: "amount", value: 12 }
  ];

  const summary = calculator.calculate(people, lines, assignments, 0);

  // unallocated is only the $8 left on l1; the gap also carries all of l2.
  assert.equal(summary.unallocated, 8);
  assert.equal(summary.receiptTotal, 25);
  assert.equal(summary.assignedTotal, 12);
  assert.equal(summary.isBalanced, false);
});

test("getUnassignedCount counts active lines with no assignments", () => {
  const calculator = makeCalculator();
  const lines = [line("l1", 10), line("l2", 5), line("l3", 7, true)];
  const assignments = [equalAssignment("l1", "p1")];

  assert.equal(calculator.getUnassignedCount(lines, assignments), 1);
});
