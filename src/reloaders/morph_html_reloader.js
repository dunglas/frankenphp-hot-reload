//import { Idiomorph } from "idiomorph/dist/idiomorph.esm.js"
import { reloadHtmlDocument } from "../helpers.js";
import { log } from "../logger.js";
import { StimulusReloader } from "./stimulus_reloader.js";

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
    this.#updateBody(reloadedDocument.body);
    return reloadedDocument;
  }

  /**
   * @param {HTMLElement} newBody
   */
  #updateBody(newBody) {
    window.Idiomorph.morph(document.body, newBody, {
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
