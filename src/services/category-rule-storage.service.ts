namespace ReceiptRing.Services {
  export class CategoryRuleStorageService {
    constructor(private readonly storageKey: string) {}

    getCategoryFor(label: string): Domain.CategoryName | null {
      const normalizedLabel = this.normalizeLabel(label);
      return this.loadRules()[normalizedLabel]?.category ?? null;
    }

    saveRule(label: string, category: Domain.CategoryName): void {
      const normalizedLabel = this.normalizeLabel(label);
      if (!normalizedLabel) return;

      const rules = this.loadRules();
      rules[normalizedLabel] = {
        normalizedLabel,
        category,
        createdAt: new Date().toISOString()
      };
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(rules));
      } catch {
        // Losing the remembered rule is survivable; aborting the review loop
        // mid-way through the user's receipt is not.
      }
    }

    normalizeLabel(label: string): string {
      return label
        .toLowerCase()
        .replace(/&/g, " and ")
        .replace(/[^a-z0-9\s]/g, " ")
        .replace(/\b(\d+(\.\d+)?|oz|lb|lbs|ct|pk|pkg|ea|each|small|medium|large)\b/g, " ")
        .replace(/\s+/g, " ")
        .trim();
    }

    private loadRules(): Record<string, Domain.StoredCategoryRule> {
      try {
        const rawRules = localStorage.getItem(this.storageKey);
        const parsed = rawRules ? JSON.parse(rawRules) : {};
        // A stored literal "null" parses to null, which the old cast let
        // through -- and getCategoryFor indexes the result immediately,
        // outside any try/catch.
        return parsed && typeof parsed === "object" && !Array.isArray(parsed)
          ? (parsed as Record<string, Domain.StoredCategoryRule>)
          : {};
      } catch {
        return {};
      }
    }
  }
}
