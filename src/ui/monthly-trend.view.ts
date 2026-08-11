namespace ReceiptRing.UI {
  export class MonthlyTrendView {
    constructor(private readonly currencyFormatService: Services.CurrencyFormatService) {}

    render(
      container: HTMLElement,
      months: readonly Services.MonthlySpend[],
      selectedMonth: string | null,
      onSelect: (month: string) => void
    ): void {
      container.replaceChildren();

      if (months.length === 0) {
        const empty = document.createElement("p");
        empty.className = "budget-ring-empty";
        empty.textContent = "No spending recorded yet.";
        container.append(empty);
        return;
      }

      // The aggregator sorts newest-first; a trend reads left-to-right oldest-first.
      const chronological = [...months].reverse();
      const max = Math.max(...chronological.map((entry) => entry.total));

      const chart = document.createElement("div");
      chart.className = "trend-chart";

      for (const entry of chronological) {
        chart.append(this.buildBar(entry, max, entry.month === selectedMonth, onSelect));
      }

      container.append(chart);
    }

    private buildBar(
      entry: Services.MonthlySpend,
      max: number,
      isSelected: boolean,
      onSelect: (month: string) => void
    ): HTMLElement {
      const column = document.createElement("button");
      column.type = "button";
      column.className = "trend-bar-col";
      column.classList.toggle("is-selected", isSelected);
      column.setAttribute("aria-pressed", String(isSelected));
      column.setAttribute(
        "aria-label",
        `${this.monthLabel(entry.month, true)}: ${this.currencyFormatService.format(entry.total)}`
      );
      column.addEventListener("click", () => onSelect(entry.month));

      const value = document.createElement("span");
      value.className = "trend-bar-value";
      value.textContent = this.currencyFormatService.format(entry.total);

      const track = document.createElement("span");
      track.className = "trend-bar-track";

      const fill = document.createElement("span");
      fill.className = "trend-bar-fill";
      // Guard against a divide-by-zero when every month total is 0.
      const percent = max > 0 ? Math.round((entry.total / max) * 100) : 0;
      fill.style.height = `${percent}%`;

      track.append(fill);

      const label = document.createElement("span");
      label.className = "trend-bar-label";
      label.textContent = this.monthLabel(entry.month, false);

      column.append(value, track, label);
      return column;
    }

    private monthLabel(key: string, includeYear: boolean): string {
      const [year, month] = key.split("-").map(Number);
      if (!year || !month) return key;
      return new Date(year, month - 1, 1).toLocaleDateString(undefined, {
        month: "short",
        ...(includeYear ? { year: "numeric" } : {})
      });
    }
  }
}
