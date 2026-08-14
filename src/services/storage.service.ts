namespace ReceiptRing.Services {
  export class StorageService {
    constructor(private readonly storageKey: string) {}

    load(): Domain.PurchaseItem[] {
      try {
        const rawValue = localStorage.getItem(this.storageKey);
        const parsed = rawValue ? JSON.parse(rawValue) : [];
        // The cast alone was a lie: anything at all could be under this key.
        // A stored object rather than an array survived load() and then threw
        // from this.items.find/.map deep in the category-review path.
        return Array.isArray(parsed) ? (parsed as Domain.PurchaseItem[]) : [];
      } catch {
        return [];
      }
    }

    // Writes can throw where reads don't: a private-mode quota, or a browser
    // configured to block storage for the site. render() saves before it draws
    // anything, so an unguarded throw here took the entire UI down with it.
    save(items: readonly Domain.PurchaseItem[]): void {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(items));
      } catch {
        /* not persisting is survivable; failing to render is not */
      }
    }
  }
}
