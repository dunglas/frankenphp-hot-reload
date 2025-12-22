import { log } from "../logger.js";
import {
  cacheBustedUrl,
  reloadHtmlDocument,
  pathWithoutAssetDigest,
} from "../helpers.js";

export class CssReloader {
  /**
   * @param {RegExp[]} params
   */
  static async reload(...params) {
    return new CssReloader(...params).reload();
  }

  constructor(filePattern = /./) {
    this.filePattern = filePattern;
  }

  async reload() {
    log("Reload css...");
    await Promise.all(await this.#reloadAllLinks());
  }

  async #reloadAllLinks() {
    const cssLinks = await this.#loadNewCssLinks();
    return cssLinks.map((link) => this.#reloadLinkIfNeeded(link));
  }

  /**
   * @returns {Promise<HTMLLinkElement[]>}
   */
  async #loadNewCssLinks() {
    const reloadedDocument = await reloadHtmlDocument();
    return Array.from(
      reloadedDocument.head.querySelectorAll("link[rel='stylesheet']"),
    );
  }

  /**
   * @param {HTMLLinkElement} link
   */
  #reloadLinkIfNeeded(link) {
    if (this.#shouldReloadLink(link)) {
      return this.#reloadLink(link);
    } else {
      return Promise.resolve();
    }
  }

  /**
   * @param {HTMLLinkElement} link
   */
  #shouldReloadLink(link) {
    const href = link.getAttribute("href");
    if (!href) {
      return false;
    }

    return this.filePattern.test(href);
  }

  /**
   * @param {HTMLLinkElement} link
   */
  async #reloadLink(link) {
    return /** @type {Promise<void>} **/ (
      new Promise((resolve) => {
        const href = link.getAttribute("href");
        const newLink =
          this.#findExistingLinkFor(link) || this.#appendNewLink(link);

        if (href === null) {
          throw new Error("The link element has no href attribute.");
        }

        newLink.setAttribute("href", cacheBustedUrl(href));
        newLink.onload = () => {
          log(`\t${href}`);
          resolve();
        };
      })
    );
  }

  /**
   * @param {HTMLLinkElement} link
   */
  #findExistingLinkFor(link) {
    return this.#cssLinks.find(
      (newLink) =>
        pathWithoutAssetDigest(link.href) ===
        pathWithoutAssetDigest(newLink.href),
    );
  }

  /**
   * @returns {HTMLLinkElement[]}
   */
  get #cssLinks() {
    return Array.from(document.querySelectorAll("link[rel='stylesheet']"));
  }

  /**
   * @param {HTMLLinkElement} link
   */
  #appendNewLink(link) {
    document.head.append(link);
    return link;
  }
}
