import { log } from "../logger.js";
import { cacheBustedUrl, reloadHtmlDocument } from "../helpers.js";

/**
 * @typedef {import("@hotwired/stimulus").Controller} Controller
 */

export class StimulusReloader {
  /**
   * @param {string} changedFilePath
   */
  static async reload(changedFilePath) {
    const document = await reloadHtmlDocument();
    return new StimulusReloader(document, changedFilePath).reload();
  }

  static async reloadAll() {
    window.Stimulus?.controllers.forEach((controller) => {
      window.Stimulus?.unload(controller.identifier);
      window.Stimulus?.register(
        controller.identifier,
        /** @type {typeof import("@hotwired/stimulus").Controller} */ (
          controller.constructor
        ),
      );
    });

    return Promise.resolve();
  }

  /**
   * @param {Document} document
   * @param {string} changedFilePath
   */
  constructor(document, changedFilePath) {
    if (typeof window.Stimulus !== "object") {
      throw new Error(
        "Stimulus is not loaded. Please make sure to load the Stimulus library.",
      );
    }

    this.document = document;
    this.changedFilePath = changedFilePath;
    this.application = window.Stimulus;
  }

  async reload() {
    log("Reload Stimulus controllers...");

    this.application.stop();

    await this.#reloadChangedStimulusControllers();
    this.#unloadDeletedStimulusControllers();

    this.application.start();
  }

  async #reloadChangedStimulusControllers() {
    await Promise.all(
      this.#stimulusControllerPathsToReload.map(
        /**
         * @param {string} moduleName
         */
        async (moduleName) => this.#reloadStimulusController(moduleName),
      ),
    );
  }

  get #stimulusControllerPathsToReload() {
    this.controllerPathsToReload =
      this.controllerPathsToReload ||
      this.#stimulusControllerPaths.filter((path) =>
        this.#shouldReloadController(path),
      );
    return this.controllerPathsToReload;
  }

  get #stimulusControllerPaths() {
    return Object.keys(this.#stimulusPathsByModule).filter((path) =>
      path.endsWith("_controller"),
    );
  }

  /**
   *
   * @param {string} path
   */
  #shouldReloadController(path) {
    return (
      this.#extractControllerName(path) === this.#changedControllerIdentifier
    );
  }

  get #changedControllerIdentifier() {
    this.changedControllerIdentifier =
      this.changedControllerIdentifier ||
      this.#extractControllerName(this.changedFilePath);
    return this.changedControllerIdentifier;
  }

  get #stimulusPathsByModule() {
    this.pathsByModule = this.pathsByModule || this.#parseImportmapJson();
    return this.pathsByModule;
  }

  #parseImportmapJson() {
    /**
     * @type {HTMLScriptElement | null}
     */
    const importmapScript = this.document.querySelector(
      "script[type=importmap]",
    );

    if (importmapScript === null) {
      throw new Error("No importmap script found in the document.");
    }

    return JSON.parse(importmapScript.text).imports;
  }

  /**
   * @param {string} moduleName
   */
  async #reloadStimulusController(moduleName) {
    log(`\t${moduleName}`);

    const controllerName = this.#extractControllerName(moduleName);
    const path = cacheBustedUrl(this.#pathForModuleName(moduleName));

    const module = await import(path);

    this.#registerController(controllerName, module);
  }

  #unloadDeletedStimulusControllers() {
    this.#controllersToUnload.forEach(
      /**
       * @param {Controller} controller
       */
      (controller) => this.#deregisterController(controller.identifier),
    );
  }

  get #controllersToUnload() {
    if (this.#didChangeTriggerAReload) {
      return [];
    } else {
      return this.application.controllers.filter(
        /**
         * @param {Controller} controller
         */
        (controller) =>
          this.#changedControllerIdentifier === controller.identifier,
      );
    }
  }

  get #didChangeTriggerAReload() {
    return this.#stimulusControllerPathsToReload.length > 0;
  }

  /**
   * @param {string} moduleName
   */
  #pathForModuleName(moduleName) {
    return this.#stimulusPathsByModule[moduleName];
  }

  /**
   * @param {string} path
   */
  #extractControllerName(path) {
    return path
      .replace(/^\/+/, "")
      .replace(/^controllers\//, "")
      .replace("_controller", "")
      .replace(/\//g, "--")
      .replace(/_/g, "-")
      .replace(/\.js$/, "");
  }

  /**
   * @param {string} name
   * @param {{default: any}} module
   */
  #registerController(name, module) {
    this.application.unload(name);
    this.application.register(name, module.default);
  }

  /**
   * @param {string} name
   */
  #deregisterController(name) {
    log(`\tRemoving controller ${name}`);
    this.application.unload(name);
  }
}
