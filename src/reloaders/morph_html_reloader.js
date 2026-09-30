//import { Idiomorph } from "idiomorph/dist/idiomorph.esm.js"
import { reloadHtmlDocument } from "../helpers.js";
import { log } from "../logger.js";
import { StimulusReloader } from "./stimulus_reloader.js";

// Libraries such as Turbo inject their own styles in the head, they must not shift the pairing.
const renderedStyles = new WeakSet(document.head.querySelectorAll("style"));

export class MorphHtmlReloader {
  constructor() {
    if (typeof window.Idiomorph !== "object") {
      throw new Error(
        "Idiomorph is not loaded. Please make sure to load the Idiomorph library.",
      );
    }
  }

  static async reload() {
    return new MorphHtmlReloader().reload();
  }

  async reload() {
    await this.#reloadHtml();
    await this.#reloadStimulus();
  }

  async #reloadHtml() {
    log("Reload html with morph...");

    const reloadedDocument = await reloadHtmlDocument();
    this.#updateHeadStyles(reloadedDocument.head);
    this.#updateBody(reloadedDocument.body);
    return reloadedDocument;
  }

  /**
   * @param {HTMLHeadElement} newHead
   */
  #updateHeadStyles(newHead) {
    const newStyles = newHead.querySelectorAll("style");

    Array.from(document.head.querySelectorAll("style"))
      .filter((style) => renderedStyles.has(style))
      .forEach((currentStyle, index) => {
        const newStyle = newStyles[index];

        if (
          !newStyle ||
          currentStyle.hasAttribute("data-frankenphp-hot-reload-preserve")
        ) {
          return;
        }

        window.Idiomorph.morph(currentStyle, newStyle, {
          callbacks: {
            // The page's CSP only allows the nonce of the initial response.
            beforeAttributeUpdated: (/** @type {string} */ name) =>
              name !== "nonce",
          },
        });
      });
  }

  /**
   * @param {HTMLElement} newBody
   */
  #updateBody(newBody) {
    window.Idiomorph.morph(document.body, newBody, {
      // Keep what the developer is typing in the focused field.
      ignoreActiveValue: true,
      callbacks: {
        beforeNodeMorphed:
          /**
           *
           * @param {Element} oldNode
           * @param {Element} _
           */
          function (oldNode, _) {
            if (typeof oldNode.hasAttribute !== "function") return true;

            return !oldNode.hasAttribute("data-frankenphp-hot-reload-preserve");
          },
      },
    });
  }

  async #reloadStimulus() {
    if (typeof window.Stimulus === "undefined") {
      return;
    }

    await StimulusReloader.reloadAll();
  }
}
