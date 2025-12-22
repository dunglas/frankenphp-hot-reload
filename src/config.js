/**
 * @param {string} name
 * @returns {string|null}
 */
function getConfigurationProperty(name) {
  const content = document
    .querySelector(`meta[name="frankenphp-hot-reload:${name}"]`)
    ?.getAttribute("content");

  return content ?? null;
}

let htmlReloadMethod = getConfigurationProperty("html-reload-method") ?? null;
if (htmlReloadMethod === null && typeof window.Idiomorph !== "undefined") {
  htmlReloadMethod = "morph";
} else if (htmlReloadMethod === null && typeof window.Turbo !== "undefined") {
  htmlReloadMethod = "turbo";
}

const mercureURL = getConfigurationProperty("url");
if (mercureURL === null) {
  throw new Error(
    `<meta name="frankenphp-hot-reload:url"> element is required.`,
  );
}

export default {
  loggingEnabled: getConfigurationProperty("logging") ?? false,
  mercureURL,
  htmlReloadMethod,
};
