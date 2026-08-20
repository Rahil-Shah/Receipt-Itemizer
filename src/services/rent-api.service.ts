namespace ReceiptRing.Services {
  export interface CreateRentEntryPayload {
    month: number;
    year: number;
    amount: number;
    propertyName?: string;
    date: string;
    photoDataUrl?: string;
    // The bank transaction this payment was logged from, when it came from the
    // transaction list rather than the rent form.
    bankTransactionId?: string;
  }

  export interface UpdateRentEntryPayload {
    amount?: number;
    propertyName?: string | null;
    date?: string;
    photoDataUrl?: string;
  }

  export interface RentSummary {
    rentTotal: number;
    entries: Domain.RentEntry[];
  }

  // A rent entry's month is the calendar month written in its date string.
  // Routing the string through `new Date(...)` reads it as UTC midnight and
  // hands back the previous month's number to anyone west of UTC, filing an
  // "Aug 1" payment under July — so take the parts from the string itself.
  export function parseRentDateParts(date: string): { year: number; month: number } | null {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date.trim());
    if (!match) return null;
    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    if (month < 1 || month > 12 || day < 1 || day > 31) return null;
    return { year, month };
  }

  // "YYYY-MM" key for a rent entry, matching SpendingAggregatorService.monthKey.
  export function rentMonthKey(year: number, month: number): string {
    return `${year}-${String(month).padStart(2, "0")}`;
  }

  export class RentEntryApiService {
    // The server explains itself in an { error } body ("A rent entry already
    // exists for this month."). Dumping the raw JSON into a toast buried that
    // sentence in punctuation, so unwrap it here.
    private async parseError(response: Response): Promise<string> {
      try {
        const data = (await response.json()) as { error?: string };
        if (data.error) return data.error;
      } catch {
        // Fall through to the status-only message.
      }
      return `Request failed (${response.status}).`;
    }

    async create(payload: CreateRentEntryPayload): Promise<Domain.RentEntry> {
      const response = await fetch("/api/rent-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }
      return (await response.json()) as Domain.RentEntry;
    }

    async list(month?: string): Promise<Domain.RentEntry[]> {
      const url = month ? `/api/rent-entries?month=${encodeURIComponent(month)}` : "/api/rent-entries";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not load rent entries (${response.status}).`);
      }
      return (await response.json()) as Domain.RentEntry[];
    }

    async update(id: string, updates: UpdateRentEntryPayload): Promise<Domain.RentEntry> {
      const response = await fetch(`/api/rent-entries/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }
      return (await response.json()) as Domain.RentEntry;
    }

    async delete(id: string): Promise<void> {
      const response = await fetch(`/api/rent-entries/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        throw new Error(await this.parseError(response));
      }
    }

    async getSummary(month?: string): Promise<RentSummary> {
      const url = month
        ? `/api/rent-entries/summary?month=${encodeURIComponent(month)}`
        : "/api/rent-entries/summary";
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Could not load rent summary (${response.status}).`);
      }
      return (await response.json()) as RentSummary;
    }
  }
}
