namespace ReceiptRing.Domain {
  export type CategoryName =
    | "Groceries"
    | "Dining"
    | "Home"
    | "Health"
    | "Transport"
    | "Personal"
    | "Entertainment"
    | "Other";

  export interface Category {
    name: CategoryName;
    color: string;
    keywords: readonly string[];
  }

  export interface PurchaseItem {
    id: string;
    label: string;
    amount: number;
    category: CategoryName;
    categorizationConfidence: number;
    categorizationSource: CategorizationSource;
    needsCategoryReview: boolean;
  }

  export type CategorizationSource = "saved-rule" | "keyword-match" | "uncertain";

  export interface CategorizationResult {
    category: CategoryName;
    confidence: number;
    source: CategorizationSource;
    matchedTerms: readonly string[];
    shouldPrompt: boolean;
  }

  export interface StoredCategoryRule {
    normalizedLabel: string;
    category: CategoryName;
    createdAt: string;
  }

  export type ReceiptCategory = "Dining" | "Groceries" | "Entertainment" | "Travel" | "Other";

  export interface ReceiptLine {
    id: string;
    label: string;
    amount: number;
    confidence: number;
    ignored: boolean;
    isFood?: boolean;
  }

  export interface SplitPerson {
    id: string;
    name: string;
  }

  export type AssignmentMode = "equal" | "percentage" | "amount";

  export interface LineAssignment {
    id: string;
    lineId: string;
    personId: string;
    mode: AssignmentMode;
    value: number;
  }

  export interface PersonSplitTotal {
    personId: string;
    personName: string;
    itemTotal: number;
    // The slice of itemTotal that came from food-flagged lines. Item amounts
    // only, so it is always <= itemTotal and never includes tax.
    foodTotal: number;
    allocatedTax: number;
    finalTotal: number;
  }

  export interface SplitSummary {
    totals: PersonSplitTotal[];
    // Money on assigned lines that custom amounts or percentages left on
    // nobody's tab. Reported so it can't go missing in silence.
    unallocated: number;
    // What the receipt asks for: every non-ignored line plus tax.
    receiptTotal: number;
    // What the split actually hands out. It falls short of receiptTotal by
    // `unallocated` plus everything on lines nobody was assigned to, so the
    // gap between the two is the wider number of the pair.
    assignedTotal: number;
    isBalanced: boolean;
  }

  export interface RentEntry {
    id: string;
    year: number;
    month: number;
    amount: number;
    propertyName?: string;
    // Calendar date, "YYYY-MM-DD".
    date: string;
    hasPhoto?: boolean;
    // Set when the entry was logged from a bank transaction in the budgeting
    // view, so that row can show it is already counted as rent.
    bankTransactionId?: string | null;
  }
}
