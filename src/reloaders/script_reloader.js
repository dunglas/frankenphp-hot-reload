import { log } from "../logger.js";

export class ScriptReloader {
  /**
   * @param {RegExp} filePattern
   */
  static async reload(filePattern) {
    log("Reload page for scripts...");

    // location.reload() only revalidates the document, cached scripts would be reused.
    await Promise.all(
      Array.from(document.querySelectorAll("script[src]"))
        .map((script) => script.getAttribute("src"))
        .filter((src) => src !== null && filePattern.test(src))
        .map((src) =>
          fetch(/** @type {string} */ (src), { cache: "reload" }).catch(
            () => {},
          ),
        ),
    );

    window.location.reload();
  }
}
