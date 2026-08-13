namespace ReceiptRing.Services {
  export class SplitCalculatorService {
    // Everything is computed in whole cents. Splitting in floats and rounding
    // only at display time meant the shares didn't add up to the bill: $10.00
    // three ways printed as three rows of $3.33 against a $10.00 total, and
    // float drift accumulated across lines on top of that.
    calculate(
      people: readonly Domain.SplitPerson[],
      lines: readonly Domain.ReceiptLine[],
      assignments: readonly Domain.LineAssignment[],
      tax: number
    ): Domain.SplitSummary {
      const itemCents = new Map<string, number>();
      people.forEach((person) => itemCents.set(person.id, 0));
      let unallocatedCents = 0;

      lines
        .filter((line) => !line.ignored)
        .forEach((line) => {
          const lineAssignments = assignments.filter((assignment) => assignment.lineId === line.id);
          if (lineAssignments.length === 0) return;

          const shares = this.getLineShares(line, lineAssignments);
          let allocated = 0;
          shares.forEach((cents, personId) => {
            itemCents.set(personId, (itemCents.get(personId) ?? 0) + cents);
            allocated += cents;
          });

          // Custom amounts and percentages need not cover the line. What's
          // left over is charged to nobody, so it has to be reported rather
          // than silently vanishing from the split. A line with no assignments
          // at all is already surfaced by getUnassignedCount.
          unallocatedCents += this.toCents(line.amount) - allocated;
        });

      const orderedPeople = [...people];
      const weights = orderedPeople.map((person) => itemCents.get(person.id) ?? 0);
      const taxShares = this.distributeProportionally(this.toCents(tax), weights);

      const totals = orderedPeople.map((person, index) => {
        const itemTotal = weights[index];
        const allocatedTax = taxShares[index];
        return {
          personId: person.id,
          personName: person.name,
          itemTotal: this.toAmount(itemTotal),
          allocatedTax: this.toAmount(allocatedTax),
          finalTotal: this.toAmount(itemTotal + allocatedTax)
        };
      });

      return { totals, unallocated: this.toAmount(unallocatedCents) };
    }

    getUnassignedCount(
      lines: readonly Domain.ReceiptLine[],
      assignments: readonly Domain.LineAssignment[]
    ): number {
      return lines.filter(
        (line) => !line.ignored && !assignments.some((assignment) => assignment.lineId === line.id)
      ).length;
    }

    /** Each assigned person's share of one line, in whole cents. */
    private getLineShares(
      line: Domain.ReceiptLine,
      assignments: readonly Domain.LineAssignment[]
    ): Map<string, number> {
      const shares = new Map<string, number>();
      if (assignments.length === 0) return shares;

      const lineCents = this.toCents(line.amount);

      if (assignments.every((assignment) => assignment.mode === "equal")) {
        const even = this.distributeEvenly(lineCents, assignments.length);
        assignments.forEach((assignment, index) => shares.set(assignment.personId, even[index]));
        return shares;
      }

      // Mixed modes: the equal-mode assignments still divide the whole line, as
      // before — only the even-split path can distribute leftover cents.
      const equalCount = assignments.filter((assignment) => assignment.mode === "equal").length;
      const equalShares = equalCount > 0 ? this.distributeEvenly(lineCents, assignments.length) : [];
      let equalIndex = 0;

      assignments.forEach((assignment) => {
        if (assignment.mode === "percentage") {
          shares.set(assignment.personId, Math.round(lineCents * (assignment.value / 100)));
        } else if (assignment.mode === "amount") {
          shares.set(assignment.personId, this.toCents(assignment.value));
        } else {
          shares.set(assignment.personId, equalShares[equalIndex]);
          equalIndex += 1;
        }
      });

      return shares;
    }

    /**
     * Split a cent total into `count` parts that sum back to it exactly,
     * handing the leftover cents out one at a time. Works for negative totals
     * (discount lines) as well.
     */
    private distributeEvenly(totalCents: number, count: number): number[] {
      if (count <= 0) return [];
      const base = Math.trunc(totalCents / count);
      let remainder = totalCents - base * count;
      const step = remainder < 0 ? -1 : 1;

      return Array.from({ length: count }, () => {
        if (remainder === 0) return base;
        remainder -= step;
        return base + step;
      });
    }

    /**
     * Split a cent total across weights so the parts sum back to it exactly,
     * giving the leftover cents to the largest fractional remainders.
     */
    private distributeProportionally(totalCents: number, weights: readonly number[]): number[] {
      const weightSum = weights.reduce((sum, weight) => sum + weight, 0);
      if (weightSum === 0 || totalCents === 0) return weights.map(() => 0);

      const exact = weights.map((weight) => (weight / weightSum) * totalCents);
      const result = exact.map((value) => Math.trunc(value));
      let remainder = totalCents - result.reduce((sum, value) => sum + value, 0);
      const step = remainder < 0 ? -1 : 1;

      const byFraction = exact
        .map((value, index) => ({ index, fraction: Math.abs(value - result[index]) }))
        .sort((left, right) => right.fraction - left.fraction);

      for (const { index } of byFraction) {
        if (remainder === 0) break;
        result[index] += step;
        remainder -= step;
      }

      return result;
    }

    private toCents(value: number): number {
      return Number.isFinite(value) ? Math.round(value * 100) : 0;
    }

    private toAmount(cents: number): number {
      return cents / 100;
    }
  }
}
