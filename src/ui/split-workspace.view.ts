namespace ReceiptRing.UI {
  export interface SplitWorkspaceHandlers {
    onLineIgnore(lineId: string): void;
    onPersonDelete(personId: string): void;
    onAssignToggle(lineId: string, personId: string): void;
    onLineModeChange(lineId: string, mode: Domain.AssignmentMode): void;
    onAssignValueChange(lineId: string, personId: string, value: number): void;
    onLineFood(lineId: string, isFood: boolean): void;
  }

  const MODE_LABELS: Record<Domain.AssignmentMode, string> = {
    equal: "Split evenly",
    percentage: "Split by percentage",
    amount: "Split by custom amount"
  };

  export class SplitWorkspaceView {
    // Scopes the scroll/resize listeners each render's dropdowns register.
    // Discarding a row does not fire its `toggle` event, so an open dropdown's
    // listeners used to outlive the element; aborting per render collects them
    // deterministically instead of waiting for the next scroll to notice.
    private panelListeners: AbortController | null = null;

    constructor(
      private readonly currencyFormatService: Services.CurrencyFormatService,
      private readonly receiptApiService: Services.ReceiptApiService
    ) {}

    renderLines(
      container: HTMLElement,
      lines: readonly Domain.ReceiptLine[],
      assignments: readonly Domain.LineAssignment[],
      people: readonly Domain.SplitPerson[],
      lineModes: ReadonlyMap<string, Domain.AssignmentMode>,
      handlers: SplitWorkspaceHandlers
    ): void {
      // Ticking a person or changing the split mode re-renders every row, which
      // destroyed and recreated the popup the user was working in -- so it shut
      // after each click and assigning one line to three people meant reopening
      // it three times. Remember what was open and restore it below.
      const openLineIds = new Set<string>();
      container
        .querySelectorAll<HTMLDetailsElement>("details.assign-dropdown[open]")
        .forEach((dropdown) => {
          if (dropdown.dataset.lineId) openLineIds.add(dropdown.dataset.lineId);
        });

      this.panelListeners?.abort();
      this.panelListeners = new AbortController();

      container.innerHTML = "";
      lines.forEach((line) => {
        const row = document.createElement("div");
        row.className = "table-row";
        row.classList.toggle("is-ignored", line.ignored);

        const name = document.createElement("span");
        name.className = "line-label";
        name.textContent = line.label;

        const foodCheck = document.createElement("button");
        foodCheck.className = "line-food-check";
        foodCheck.type = "button";
        foodCheck.setAttribute("aria-label", line.isFood ? "Mark as non-food" : "Mark as food");
        foodCheck.setAttribute("aria-pressed", String(line.isFood ?? false));
        foodCheck.innerHTML = this.getFoodCheckIcon(line.isFood ?? false);
        foodCheck.addEventListener("click", () => handlers.onLineFood(line.id, !(line.isFood ?? false)));

        const assignCell = document.createElement("div");
        assignCell.className = "assign-cell";
        const dropdown = this.buildAssignDropdown(line, assignments, people, lineModes, handlers);
        assignCell.append(dropdown);

        const amount = document.createElement("span");
        amount.className = "amount-cell";
        amount.textContent = this.currencyFormatService.format(line.amount);

        const ignore = document.createElement("button");
        ignore.className = "icon-button delete-row";
        ignore.type = "button";
        ignore.textContent = line.ignored ? "+" : "x";
        ignore.setAttribute("aria-label", line.ignored ? "Restore line" : "Ignore line");
        ignore.addEventListener("click", () => handlers.onLineIgnore(line.id));

        row.append(name, foodCheck, assignCell, amount, ignore);
        container.append(row);

        // Reopen after insertion so the toggle handler can measure the summary
        // to position the popup.
        if (openLineIds.has(line.id)) {
          dropdown.open = true;
        }
      });
    }

    private buildAssignDropdown(
      line: Domain.ReceiptLine,
      assignments: readonly Domain.LineAssignment[],
      people: readonly Domain.SplitPerson[],
      lineModes: ReadonlyMap<string, Domain.AssignmentMode>,
      handlers: SplitWorkspaceHandlers
    ): HTMLDetailsElement {
      const lineAssignments = assignments.filter((assignment) => assignment.lineId === line.id);
      const mode = lineModes.get(line.id) ?? "equal";

      const details = document.createElement("details");
      details.className = "assign-dropdown";
      // Lets the next render find this row's dropdown and restore its open state.
      details.dataset.lineId = line.id;

      const summary = document.createElement("summary");
      summary.className = "assign-summary";
      summary.textContent = this.getAssignmentSummary(lineAssignments, people);
      details.append(summary);

      const panel = document.createElement("div");
      panel.className = "assign-panel-pop";

      // The panel is rendered with position: fixed (computed on open) so it
      // escapes the `.items-table` overflow:hidden clip and the viewport edge.
      // Without this, the popup for the last row in a long list gets cut off.
      const reposition = (): void => {
        if (!details.isConnected) {
          this.teardownPanelPositioning(reposition);
          return;
        }
        this.positionPanel(summary, panel);
      };
      details.addEventListener("toggle", () => {
        if (details.open) {
          this.closeOtherDropdowns(details);
          this.positionPanel(summary, panel);
          const signal = this.panelListeners?.signal;
          window.addEventListener("scroll", reposition, { capture: true, signal });
          window.addEventListener("resize", reposition, { signal });
        } else {
          this.teardownPanelPositioning(reposition);
          this.resetPanelPosition(panel);
        }
      });

      if (people.length === 0) {
        const hint = document.createElement("p");
        hint.className = "assign-hint";
        hint.textContent = "Add people first, then assign them here.";
        panel.append(hint);
        details.append(panel);
        return details;
      }

      const modeSelect = document.createElement("select");
      modeSelect.className = "table-select assign-mode";
      (Object.keys(MODE_LABELS) as Domain.AssignmentMode[]).forEach((value) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = MODE_LABELS[value];
        modeSelect.append(option);
      });
      modeSelect.value = mode;
      modeSelect.addEventListener("change", () =>
        handlers.onLineModeChange(line.id, modeSelect.value as Domain.AssignmentMode)
      );
      panel.append(modeSelect);

      people.forEach((person) => {
        const assignment = lineAssignments.find((candidate) => candidate.personId === person.id);
        const personRow = document.createElement("label");
        personRow.className = "assign-person-row";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = Boolean(assignment);
        checkbox.addEventListener("change", () => handlers.onAssignToggle(line.id, person.id));

        const personName = document.createElement("span");
        personName.className = "assign-person-name";
        personName.textContent = person.name;

        personRow.append(checkbox, personName);

        if (mode !== "equal") {
          const valueInput = document.createElement("input");
          valueInput.type = "number";
          valueInput.min = "0";
          valueInput.step = "0.01";
          valueInput.className = "table-input assign-value";
          valueInput.placeholder = mode === "percentage" ? "%" : "$";
          valueInput.value = assignment ? String(assignment.value) : "";
          valueInput.disabled = !assignment;
          valueInput.addEventListener("input", () =>
            handlers.onAssignValueChange(line.id, person.id, Number(valueInput.value))
          );
          personRow.append(valueInput);
        }

        panel.append(personRow);
      });

      details.append(panel);
      return details;
    }

    renderPeople(
      container: HTMLElement,
      people: readonly Domain.SplitPerson[],
      handlers: SplitWorkspaceHandlers
    ): void {
      container.innerHTML = "";
      people.forEach((person) => {
        const row = document.createElement("div");
        row.className = "person-chip";

        const label = document.createElement("span");
        label.textContent = person.name;

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "x";
        remove.setAttribute("aria-label", `Remove ${person.name}`);
        remove.addEventListener("click", () => handlers.onPersonDelete(person.id));

        row.append(label, remove);
        container.append(row);
      });
    }

    renderTotals(container: HTMLElement, summary: Domain.SplitSummary): void {
      container.innerHTML = "";

      // Only surface the food line on receipts where anything was flagged, and
      // then on every person's row so the column reads consistently -- including
      // the people who owe nothing toward it.
      const anyFood = summary.totals.some((total) => total.foodTotal > 0);

      summary.totals.forEach((total) => {
        const row = document.createElement("div");
        row.className = "split-total-row";

        // Build with textContent (never innerHTML) — person names are
        // attacker-influenced data and must not be parsed as HTML.
        const name = document.createElement("strong");
        name.textContent = total.personName;
        const items = document.createElement("span");
        items.textContent = `Items ${this.currencyFormatService.format(total.itemTotal)}`;
        const tax = document.createElement("span");
        tax.textContent = `Tax ${this.currencyFormatService.format(total.allocatedTax)}`;
        const final = document.createElement("b");
        final.textContent = this.currencyFormatService.format(total.finalTotal);

        row.append(name, items);
        if (anyFood) {
          const food = document.createElement("span");
          food.className = "is-food-line";
          food.textContent = `Food ${this.currencyFormatService.format(total.foodTotal)}`;
          row.append(food);
        }
        row.append(tax, final);
        container.append(row);
      });

      // Custom amounts and percentages can leave part of a line on nobody's
      // tab. Say so, rather than letting the shares quietly total less than
      // the receipt.
      if (Math.abs(summary.unallocated) >= 0.01) {
        const row = document.createElement("div");
        row.className = "split-total-row is-unallocated";

        const name = document.createElement("strong");
        name.textContent = "Unallocated";
        const detail = document.createElement("span");
        detail.textContent = "Not covered by the amounts entered";
        const spacer = document.createElement("span");
        const value = document.createElement("b");
        value.textContent = this.currencyFormatService.format(summary.unallocated);

        row.append(name, detail, spacer, value);
        container.append(row);
      }

      if (summary.totals.length > 0) {
        container.append(this.buildReconciliation(summary));
      }
    }

    /**
     * The check the user actually cares about at the end of a split: does what
     * everyone owes add back up to what the receipt says? Both figures are shown
     * side by side, because "balanced" is only trustworthy if you can see the
     * two numbers it is claiming are equal.
     */
    private buildReconciliation(summary: Domain.SplitSummary): HTMLElement {
      const block = document.createElement("div");
      block.className = "split-reconcile";
      block.classList.toggle("is-balanced", summary.isBalanced);

      const addLine = (label: string, amount: number, variant = ""): void => {
        const line = document.createElement("div");
        line.className = variant ? `split-reconcile-line ${variant}` : "split-reconcile-line";
        const text = document.createElement("span");
        text.textContent = label;
        const value = document.createElement("b");
        value.textContent = this.currencyFormatService.format(amount);
        line.append(text, value);
        block.append(line);
      };

      addLine("Split across everyone", summary.assignedTotal);
      addLine("Receipt total", summary.receiptTotal);

      const status = document.createElement("div");
      status.className = "split-reconcile-status";
      if (summary.isBalanced) {
        status.textContent = "Balanced — the split matches the receipt.";
      } else {
        const gap = summary.receiptTotal - summary.assignedTotal;
        const amount = this.currencyFormatService.format(Math.abs(gap));
        status.textContent =
          gap > 0
            ? `${amount} of the receipt is not on anyone's tab yet.`
            : `The split is over the receipt total by ${amount}.`;
      }
      block.append(status);

      return block;
    }

    renderHistory(
      container: HTMLElement,
      receipts: readonly Services.SavedReceiptSummary[],
      onDelete?: (receipt: Services.SavedReceiptSummary) => void,
      onLineFood?: (receiptId: string, lineId: string, isFood: boolean) => void,
      onLinkTransaction?: (receipt: Services.SavedReceiptSummary) => void,
      onUnlinkTransaction?: (receipt: Services.SavedReceiptSummary) => void
    ): void {
      container.innerHTML = "";
      receipts.forEach((receipt) => {
        const card = document.createElement("details");
        card.className = "history-card";
        card.draggable = true;

        card.addEventListener("dragstart", (event) => {
          if (event.dataTransfer) {
            event.dataTransfer.effectAllowed = "copy";
            event.dataTransfer.setData("text/plain", receipt.id);
          }
        });

        const summary = document.createElement("summary");
        summary.className = "history-summary";

        const heading = document.createElement("div");
        heading.className = "history-heading";
        const title = document.createElement("strong");
        title.textContent = receipt.storeName || "Untitled receipt";
        const meta = document.createElement("span");
        meta.className = "history-meta";
        const when = new Date(receipt.createdAt).toLocaleDateString();
        meta.textContent = `${receipt.category} · ${when}`;
        heading.append(title, meta);

        const total = document.createElement("b");
        total.className = "history-total";
        total.textContent = this.currencyFormatService.format(Number(receipt.total ?? 0));

        summary.append(heading, total);
        card.append(summary);

        const body = document.createElement("div");
        body.className = "history-body";

        if (receipt.hasImage) {
          // Inside the collapsed card, so the photos only load for receipts the
          // user actually opens.
          const figure = document.createElement("a");
          figure.className = "history-image";
          figure.href = this.receiptApiService.imageUrl(receipt.id);
          figure.target = "_blank";
          figure.rel = "noopener";
          figure.title = "Open the full-size receipt photo";

          const photo = document.createElement("img");
          photo.src = figure.href;
          photo.loading = "lazy";
          photo.alt = `Photo of the receipt from ${receipt.storeName || "an unknown store"}`;
          figure.append(photo);
          body.append(figure);
        }

        if (receipt.lines.length > 0) {
          const linesWrap = document.createElement("div");
          linesWrap.className = "history-lines";
          receipt.lines.forEach((line) => {
            const lineRow = document.createElement("div");
            lineRow.className = "history-line";
            const names = line.assignments
              .map((assignment) => assignment.personName)
              .filter((value): value is string => Boolean(value));

            // line.label comes from OCR of arbitrary receipt images and from
            // the server; render as text, never HTML, to prevent stored XSS.
            const label = document.createElement("span");
            label.textContent = line.label;

            const foodCheck = document.createElement("button");
            foodCheck.className = "line-food-check";
            foodCheck.type = "button";
            foodCheck.setAttribute("aria-label", line.isFood ? "Mark as non-food" : "Mark as food");
            foodCheck.setAttribute("aria-pressed", String(line.isFood ?? false));
            foodCheck.innerHTML = this.getFoodCheckIcon(line.isFood ?? false);
            if (onLineFood) {
              foodCheck.addEventListener("click", () => onLineFood(receipt.id, line.id, !(line.isFood ?? false)));
            } else {
              foodCheck.disabled = true;
            }

            const peopleSpan = document.createElement("span");
            peopleSpan.className = "history-line-people";
            peopleSpan.textContent = names.length ? names.join(", ") : "Unassigned";
            const amountEl = document.createElement("b");
            amountEl.textContent = this.currencyFormatService.format(Number(line.amount));
            lineRow.append(label, foodCheck, peopleSpan, amountEl);
            linesWrap.append(lineRow);
          });
          body.append(linesWrap);
        }

        if (receipt.people.length > 0) {
          const peopleWrap = document.createElement("div");
          peopleWrap.className = "history-people";
          peopleWrap.textContent = `People: ${receipt.people.map((person) => person.name).join(", ")}`;
          body.append(peopleWrap);
        }

        if (onDelete) {
          const actions = document.createElement("div");
          actions.className = "history-actions";
          const deleteButton = document.createElement("button");
          deleteButton.type = "button";
          deleteButton.className = "btn btn-danger btn-small";
          deleteButton.textContent = "Delete receipt";
          deleteButton.addEventListener("click", () => onDelete(receipt));
          actions.append(deleteButton);
          body.append(actions);
        }

        card.append(body);
        container.append(card);
      });
    }

    private positionPanel(summary: HTMLElement, panel: HTMLElement): void {
      const margin = 8;
      const summaryRect = summary.getBoundingClientRect();

      // Measure the panel at its natural size before committing a position.
      panel.style.position = "fixed";
      panel.style.maxHeight = "";
      panel.style.width = `${Math.max(230, summaryRect.width)}px`;
      const panelHeight = panel.scrollHeight;

      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      const spaceBelow = viewportHeight - summaryRect.bottom - margin;
      const spaceAbove = summaryRect.top - margin;

      let top: number;
      if (panelHeight <= spaceBelow || spaceBelow >= spaceAbove) {
        // Drop down.
        top = summaryRect.bottom + margin;
        panel.style.maxHeight = `${Math.max(0, spaceBelow)}px`;
      } else {
        // Flip up when there isn't enough room below (e.g. the last row).
        panel.style.maxHeight = `${Math.max(0, spaceAbove)}px`;
        top = Math.max(margin, summaryRect.top - margin - Math.min(panelHeight, spaceAbove));
      }

      const panelWidth = panel.getBoundingClientRect().width;
      const left = Math.max(margin, Math.min(summaryRect.left, viewportWidth - margin - panelWidth));

      panel.style.top = `${top}px`;
      panel.style.left = `${left}px`;
      panel.style.overflowY = "auto";
    }

    private resetPanelPosition(panel: HTMLElement): void {
      panel.style.position = "";
      panel.style.top = "";
      panel.style.left = "";
      panel.style.width = "";
      panel.style.maxHeight = "";
      panel.style.overflowY = "";
    }

    private teardownPanelPositioning(reposition: () => void): void {
      window.removeEventListener("scroll", reposition, true);
      window.removeEventListener("resize", reposition);
    }

    private closeOtherDropdowns(current: HTMLDetailsElement): void {
      document
        .querySelectorAll<HTMLDetailsElement>("details.assign-dropdown[open]")
        .forEach((dropdown) => {
          if (dropdown !== current) {
            dropdown.open = false;
          }
        });
    }

    private getAssignmentSummary(
      lineAssignments: readonly Domain.LineAssignment[],
      people: readonly Domain.SplitPerson[]
    ): string {
      const names = lineAssignments
        .map((assignment) => people.find((person) => person.id === assignment.personId)?.name)
        .filter((name): name is string => Boolean(name));

      return names.length > 0 ? names.join(", ") : "Assign ▾";
    }

    private getFoodCheckIcon(isFood: boolean): string {
      // Filled circle for checked, outline for unchecked
      const strokeWidth = isFood ? "0" : "1.6";
      const fill = isFood ? "currentColor" : "none";
      return `<svg viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg" class="food-check-icon">
        <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="${strokeWidth}"/>
      </svg>`;
    }
  }
}
