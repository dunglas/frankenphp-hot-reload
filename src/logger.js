import config from "./config.js";

/**
 * @param {any[]} args
 */
export function log(...args) {
  if (config.loggingEnabled) {
    console.log(`[frankenphp_hot_reloading]`, ...args);
  }
}
