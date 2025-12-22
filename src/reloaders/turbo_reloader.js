import { log } from "../logger.js";

export class TurboHtmlReloader {
  constructor() {
    if (typeof window.Turbo !== "object") {
      throw new Error(
        "Turbo is not loaded. Please make sure to load the Turbo library.",
      );
    }
  }
  static async reload() {
    return new TurboHtmlReloader().reload();
  }

  async reload() {
    await this.#reloadHtml();
  }

  async #reloadHtml() {
    log("Reload html with Turbo...");

    this.#keepScrollPosition();
    await this.#visitCurrentPage();
  }

  #keepScrollPosition() {
    document.addEventListener(
      "turbo:before-render",
      () => {
        window.Turbo.navigator.currentVisit.scrolled = true;
      },
      { once: true },
    );
  }

  #visitCurrentPage() {
    return new Promise((resolve) => {
      document.addEventListener("turbo:load", () => resolve(document), {
        once: true,
      });
      window.Turbo.visit(window.location);
    });
  }
}
