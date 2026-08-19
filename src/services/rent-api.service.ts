namespace ReceiptRing.Services {
  export interface CreateRentEntryPayload {
    month: number;
    year: number;
    amount: number;
    propertyName?: string;
    date: string;
    photoDataUrl?: string;
  }

  export interface RentSummary {
    rentTotal: number;
    entries: Domain.RentEntry[];
  }

  export class RentEntryApiService {
    async create(payload: CreateRentEntryPayload): Promise<Domain.RentEntry> {
      const response = await fetch("/api/rent-entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Create failed (${response.status}): ${message}`);
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

    async update(id: string, updates: Partial<Domain.RentEntry>): Promise<Domain.RentEntry> {
      const response = await fetch(`/api/rent-entries/${encodeURIComponent(id)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates)
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Update failed (${response.status}): ${message}`);
      }
      return (await response.json()) as Domain.RentEntry;
    }

    async delete(id: string): Promise<void> {
      const response = await fetch(`/api/rent-entries/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Delete failed (${response.status}): ${message}`);
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
