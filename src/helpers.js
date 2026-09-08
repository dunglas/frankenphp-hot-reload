/**
 * Extracts the asset name (basename without extension) from a file path.
 *
 * The path comes from the file watcher, so on Windows it is an OS path
 * separated by backslashes (e.g. `C:\app\public\style.css`). Both separators
 * must be handled, otherwise nothing is stripped and the whole path is
 * returned as the asset name.
 *
 * @param {string} path
 */
export function assetNameFromPath(path) {
  return /** @type {string} */ (path.split(/[/\\]/).pop()).split(".")[0];
}

/**
 *
 * @param {string} path
 */
export function pathWithoutAssetDigest(path) {
  return path.replace(/-[a-z0-9]+\.(\w+)(\?.*)?$/, ".$1");
}

/**
 *
 * @param {string} urlString
 * @param {Object} params
 */
export function urlWithParams(urlString, params) {
  const url = new URL(urlString, window.location.origin);
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.set(key, value);
  });
  return url.toString();
}

/**
 * @param {string} urlString
 */
export function cacheBustedUrl(urlString) {
  return urlWithParams(urlString, { reload: Date.now() });
}

export async function reloadHtmlDocument() {
  let currentUrl = cacheBustedUrl(
    urlWithParams(window.location.href, { frankenphp_hot_reloading: "true" }),
  );
  const response = await fetch(currentUrl, {
    headers: { Accept: "text/html" },
  });

  if (!response.ok) {
    throw new Error(`${response.status} when fetching ${currentUrl}`);
  }

  const fetchedHTML = await response.text();
  const parser = new DOMParser();
  return parser.parseFromString(fetchedHTML, "text/html");
}
