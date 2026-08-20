namespace ReceiptRing.Services {
  export interface AccountPerson {
    id: string;
    name: string;
    // The account owner's own entry. Exactly one exists per user; the server
    // creates it on demand and refuses to delete it.
    isSelf?: boolean;
  }

  export class PeopleApiService {
    async list(): Promise<AccountPerson[]> {
      const response = await fetch("/api/people");
      if (!response.ok) {
        throw new Error(`Could not load people (${response.status}).`);
      }
      return (await response.json()) as AccountPerson[];
    }

    async add(name: string): Promise<AccountPerson> {
      const response = await fetch("/api/people", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name })
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Add failed (${response.status}): ${message}`);
      }
      return (await response.json()) as AccountPerson;
    }

    async delete(id: string): Promise<void> {
      const response = await fetch(`/api/people/${encodeURIComponent(id)}`, {
        method: "DELETE"
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(`Delete failed (${response.status}): ${message}`);
      }
    }

    async search(query: string): Promise<AccountPerson[]> {
      const response = await fetch(`/api/people/search?q=${encodeURIComponent(query)}`);
      if (!response.ok) {
        throw new Error(`Search failed (${response.status}).`);
      }
      return (await response.json()) as AccountPerson[];
    }
  }
}
