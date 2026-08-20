namespace ReceiptRing.Services {
  export class NotificationService {
    private toastContainer: HTMLElement;

    constructor() {
      this.toastContainer = this.ensureContainer();
    }

    show(message: string, type: "success" | "error" | "info" = "info", duration = 4000): void {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      toast.textContent = message;

      this.toastContainer.appendChild(toast);

      // Trigger animation
      requestAnimationFrame(() => {
        toast.classList.add("toast-visible");
      });

      // Remove after duration
      setTimeout(() => {
        toast.classList.remove("toast-visible");
        setTimeout(() => {
          toast.remove();
        }, 300);
      }, duration);
    }

    success(message: string, duration?: number): void {
      this.show(message, "success", duration);
    }

    error(message: string, duration?: number): void {
      this.show(message, "error", duration);
    }

    info(message: string, duration?: number): void {
      this.show(message, "info", duration);
    }

    private ensureContainer(): HTMLElement {
      let container = document.querySelector("#toastContainer") as HTMLElement;
      if (!container) {
        container = document.createElement("div");
        container.id = "toastContainer";
        container.className = "toast-container";
        document.body.appendChild(container);
      }
      return container;
    }
  }
}
