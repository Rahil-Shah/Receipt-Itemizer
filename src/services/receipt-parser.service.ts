namespace ReceiptRing.Services {
  export class ReceiptParserService {
    private readonly ignoredLabel = /^(total|subtotal|tax|cash|change|visa|mastercard|amex|debit|credit|balance|auth|approval|receipt)\b/i;
    // The amount must start at a word boundary. Capping the integer part at a
    // few digits without anchoring the left side let the regex simply start
    // matching partway into a longer number: "Tv 10999.00" matched "999.00"
    // and the stray "1" was absorbed into the label, booking a $10,999 TV as
    // $999. Anchor to start-of-line or whitespace and accept any length.
    private readonly amountPattern = /(?:^|\s)(-?\$?\s*\d+(?:,\d{3})*[,.]\d{2}|-?\$\s*\d+)\s*$/;

    constructor(
      private readonly categorizationService: CategorizationService,
      private readonly idService: IdService
    ) {}

    parse(text: string): Domain.PurchaseItem[] {
      return text
        .split(/\n+/)
        .map((line) => line.replace(/\s+/g, " ").trim())
        .filter(Boolean)
        .map((line) => this.parseLine(line))
        .filter((item): item is Domain.PurchaseItem => item !== null);
    }

    private parseLine(line: string): Domain.PurchaseItem | null {
      const match = line.match(this.amountPattern);
      if (!match || match.index === undefined) return null;

      const amount = this.parseAmount(match[1]);
      const label = line
        .slice(0, match.index)
        .replace(/[*#@]/g, "")
        .replace(/\b\d{4,}\b/g, "")
        .trim();

      if (!label || this.ignoredLabel.test(label) || !Number.isFinite(amount) || amount === 0) {
        return null;
      }

      const categorization = this.categorizationService.categorize(label);

      return {
        id: this.idService.create(),
        label: this.toTitleCase(label),
        amount: Number(amount.toFixed(2)),
        category: categorization.category,
        categorizationConfidence: categorization.confidence,
        categorizationSource: categorization.source,
        needsCategoryReview: categorization.shouldPrompt
      };
    }

    private toTitleCase(value: string): string {
      return value
        .toLowerCase()
        .split(" ")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
    }

    private parseAmount(value: string): number {
      const compactValue = value.replace(/[$\s]/g, "");
      const normalizedValue =
        compactValue.includes(".") || !compactValue.includes(",")
          ? compactValue.replace(/,/g, "")
          : compactValue.replace(",", ".");

      return Number(normalizedValue);
    }
  }
}
