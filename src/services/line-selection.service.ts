namespace ReceiptRing.Services {
  /**
   * Which receipt lines are ticked for a batch edit.
   *
   * Assigning a person one line at a time means opening a popup, ticking a
   * name and waiting for a re-render for every row -- on a grocery receipt of
   * forty items that is forty popups to say "these are all Ana's". The
   * selection lives here rather than in the controller so the range and
   * select-all rules can be tested without a DOM, and so the controller only
   * ever asks it questions.
   *
   * Ids are held for lines the caller still knows about; `prune` is how the
   * caller says which those are after a re-parse.
   */
  export class LineSelectionService {
    private readonly selected = new Set<string>();

    // The last line the user ticked by hand. Shift-clicking selects from here
    // to the clicked row, the way a file list does.
    private anchorId: string | null = null;

    get count(): number {
      return this.selected.size;
    }

    has(lineId: string): boolean {
      return this.selected.has(lineId);
    }

    ids(): string[] {
      return [...this.selected];
    }

    /** Ticks or unticks one line, and makes it the anchor for the next range. */
    toggle(lineId: string): void {
      if (this.selected.has(lineId)) {
        this.selected.delete(lineId);
      } else {
        this.selected.add(lineId);
      }
      this.anchorId = lineId;
    }

    /**
     * Adds every line between the anchor and `lineId` inclusive, the way a
     * shift-click behaves in a file list. Falls back to a plain toggle when
     * there is no anchor to reach from, or when either end is not on screen.
     *
     * The anchor deliberately stays put: shift-clicking a second time is how
     * you resize a range you have just taken, and moving the anchor to the far
     * end would make the next click extend from the wrong row.
     */
    selectRange(lines: readonly Domain.ReceiptLine[], lineId: string): void {
      const target = lines.findIndex((line) => line.id === lineId);
      const anchor = lines.findIndex((line) => line.id === this.anchorId);
      if (target < 0 || anchor < 0) {
        this.toggle(lineId);
        return;
      }

      const start = Math.min(anchor, target);
      const end = Math.max(anchor, target);
      for (let index = start; index <= end; index += 1) {
        this.selected.add(lines[index].id);
      }
    }

    selectAll(lines: readonly Domain.ReceiptLine[]): void {
      lines.forEach((line) => this.selected.add(line.id));
    }

    clear(): void {
      this.selected.clear();
      this.anchorId = null;
    }

    isAllSelected(lines: readonly Domain.ReceiptLine[]): boolean {
      return lines.length > 0 && lines.every((line) => this.selected.has(line.id));
    }

    isAnySelected(lines: readonly Domain.ReceiptLine[]): boolean {
      return lines.some((line) => this.selected.has(line.id));
    }

    /**
     * Forgets lines that no longer exist -- a re-parse hands back a fresh set
     * of ids, and a selection of ids nobody can see would silently apply the
     * next batch action to rows that are gone.
     */
    prune(lines: readonly Domain.ReceiptLine[]): void {
      const live = new Set(lines.map((line) => line.id));
      this.selected.forEach((id) => {
        if (!live.has(id)) this.selected.delete(id);
      });
      if (this.anchorId !== null && !live.has(this.anchorId)) this.anchorId = null;
    }
  }
}
