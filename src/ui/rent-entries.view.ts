namespace ReceiptRing.UI {
  export class RentEntriesView {
    constructor(private readonly currencyFormatService: Services.CurrencyFormatService) {}

    render(container: HTMLElement, entries: readonly Domain.RentEntry[]): void {
      container.innerHTML = "";

      if (entries.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty-state";
        const icon = document.createElement("svg");
        icon.className = "empty-icon";
        icon.setAttribute("viewBox", "0 0 24 24");
        icon.setAttribute("fill", "none");
        icon.setAttribute("aria-hidden", "true");
        icon.innerHTML = `
          <path d="M9 3.5h6a2 2 0 0 1 2 2v13l-1.6-1.2-1.6 1.2-1.2-1.2-1.2 1.2-1.6-1.2-1.6 1.2v-13a2 2 0 0 1 2-2Z"
            stroke="currentColor" stroke-width="1.5" stroke-linejoin="round" />
          <path d="M9 8h6M9 11h6M9 14h3"
            stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        `;
        const title = document.createElement("strong");
        title.textContent = "No rent entries";
        const detail = document.createElement("span");
        detail.textContent = "Add your first monthly rent payment to start tracking.";
        empty.append(icon, title, detail);
        container.append(empty);
        return;
      }

      for (const entry of entries) {
        const row = document.createElement("div");
        row.className = "rent-entry-row";

        const main = document.createElement("div");
        main.className = "rent-entry-main";

        const header = document.createElement("div");
        header.className = "rent-entry-header";

        const date = document.createElement("span");
        date.className = "rent-entry-date";
        date.textContent = this.formatDate(entry.date);

        const propertyName = document.createElement("span");
        propertyName.className = "rent-entry-property";
        propertyName.textContent = entry.propertyName || "Rent payment";

        header.append(date, propertyName);

        const meta = document.createElement("span");
        meta.className = "rent-entry-meta";

        const photoIndicator = document.createElement("span");
        photoIndicator.className = "rent-entry-photo-indicator";
        if (entry.hasPhoto) {
          photoIndicator.textContent = "📎";
          photoIndicator.setAttribute("title", "Proof of payment attached");
        }

        meta.append(photoIndicator);
        header.append(meta);

        main.append(header);

        const amount = document.createElement("span");
        amount.className = "rent-entry-amount";
        amount.textContent = this.currencyFormatService.format(entry.amount);

        const actions = document.createElement("div");
        actions.className = "rent-entry-actions";

        const editButton = document.createElement("button");
        editButton.type = "button";
        editButton.className = "btn btn-ghost btn-small";
        editButton.textContent = "Edit";
        editButton.setAttribute("aria-label", `Edit rent entry for ${this.formatDate(entry.date)}`);
        editButton.dataset.entryId = entry.id;

        const deleteButton = document.createElement("button");
        deleteButton.type = "button";
        deleteButton.className = "btn btn-ghost btn-small";
        deleteButton.textContent = "Delete";
        deleteButton.setAttribute("aria-label", `Delete rent entry for ${this.formatDate(entry.date)}`);
        deleteButton.dataset.entryId = entry.id;

        actions.append(editButton, deleteButton);

        row.append(main, amount, actions);
        container.append(row);
      }
    }

    renderForm(modal: HTMLElement, entry?: Domain.RentEntry): void {
      const title = modal.querySelector("#rentEntryTitle") as HTMLHeadingElement;
      const dateInput = modal.querySelector("#rentEntryDate") as HTMLInputElement;
      const amountInput = modal.querySelector("#rentEntryAmount") as HTMLInputElement;
      const propertyInput = modal.querySelector("#rentEntryProperty") as HTMLInputElement;
      const photoInput = modal.querySelector("#rentEntryPhoto") as HTMLInputElement;

      if (entry) {
        title.textContent = "Edit rent payment";
        dateInput.value = entry.date;
        amountInput.value = String(entry.amount);
        propertyInput.value = entry.propertyName || "";
        // Can't pre-fill file input for security reasons
        photoInput.value = "";
      } else {
        title.textContent = "Add rent payment";
        dateInput.value = "";
        amountInput.value = "";
        propertyInput.value = "";
        photoInput.value = "";
      }
    }

    // The entry date is a calendar date ("YYYY-MM-DD"); build it from its
    // parts so it isn't read as UTC midnight and shown a day early west of
    // UTC (see AppController.formatTransactionDate for the same trap).
    private formatDate(dateString: string): string {
      const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(dateString);
      if (!match) return dateString;
      const [, year, month, day] = match;
      return new Date(Number(year), Number(month) - 1, Number(day)).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    }
  }
}
