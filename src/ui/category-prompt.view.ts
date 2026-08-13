namespace ReceiptRing.UI {
  export interface CategoryPromptResult {
    category: Domain.CategoryName;
    remember: boolean;
  }

  export class CategoryPromptView {
    private activeResolve: ((result: CategoryPromptResult | null) => void) | null = null;

    constructor(
      private readonly categories: readonly Domain.Category[],
      private readonly elements: DomRegistry
    ) {
      this.renderOptions();
      this.bindEvents();
    }

    prompt(item: Domain.PurchaseItem): Promise<CategoryPromptResult | null> {
      // Overwriting activeResolve would abandon the previous promise unresolved
      // and hang the caller's review loop forever. The controller's
      // isPromptingForCategories guard makes that unreachable today; settle it
      // here so the invariant doesn't depend on a caller remembering.
      this.activeResolve?.(null);
      this.activeResolve = null;

      this.elements.categoryPromptItem.textContent = item.label;
      this.elements.categoryPromptSelect.value = item.category;
      this.elements.categoryPromptRemember.checked = false;
      this.elements.categoryPrompt.classList.remove("hidden");
      this.elements.categoryPromptSelect.focus();

      return new Promise((resolve) => {
        this.activeResolve = resolve;
      });
    }

    private renderOptions(): void {
      this.elements.categoryPromptSelect.innerHTML = "";
      this.categories.forEach((category) => {
        const option = document.createElement("option");
        option.value = category.name;
        option.textContent = category.name;
        this.elements.categoryPromptSelect.append(option);
      });
    }

    private bindEvents(): void {
      this.elements.categoryPromptSave.addEventListener("click", () => this.resolvePrompt());
      this.elements.categoryPromptSkip.addEventListener("click", () => this.closePrompt(null));

      // Listen on the document, not the backdrop: a single click on the dim
      // area moved focus to <body>, after which Escape stopped reaching the
      // dialog and the only way out was the Skip button.
      document.addEventListener("keydown", (event) => {
        if (this.activeResolve === null) return;
        if (event.key === "Escape") {
          this.closePrompt(null);
          return;
        }
        // An aria-modal dialog must not let Tab wander into the page behind it.
        if (event.key === "Tab") {
          this.keepFocusInDialog(event);
        }
      });

      // Clicking the dim backdrop (but not the card) dismisses, as modals do.
      this.elements.categoryPrompt.addEventListener("click", (event) => {
        if (event.target === this.elements.categoryPrompt) {
          this.closePrompt(null);
        }
      });
    }

    private keepFocusInDialog(event: KeyboardEvent): void {
      const focusable = this.elements.categoryPrompt.querySelectorAll<HTMLElement>(
        "select, input, button, [href], textarea, [tabindex]:not([tabindex='-1'])"
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && (active === first || !this.elements.categoryPrompt.contains(active))) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (active === last || !this.elements.categoryPrompt.contains(active))) {
        event.preventDefault();
        first.focus();
      }
    }

    private resolvePrompt(): void {
      this.closePrompt({
        category: this.elements.categoryPromptSelect.value as Domain.CategoryName,
        remember: this.elements.categoryPromptRemember.checked
      });
    }

    private closePrompt(result: CategoryPromptResult | null): void {
      this.elements.categoryPrompt.classList.add("hidden");
      const resolve = this.activeResolve;
      this.activeResolve = null;
      resolve?.(result);
    }
  }
}
