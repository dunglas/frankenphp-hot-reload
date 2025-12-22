import config from "./config.js";
import { assetNameFromPath } from "./helpers.js";
import { MorphHtmlReloader } from "./reloaders/morph_html_reloader.js";
import { CssReloader } from "./reloaders/css_reloader.js";
import { StimulusReloader } from "./reloaders/stimulus_reloader.js";
import { TurboHtmlReloader } from "./reloaders/turbo_reloader.js";

const es = new EventSource(config.mercureURL);
es.onmessage =
  /**
   * @param {any} data
   */
  ({ data }) => {
    const changes = JSON.parse(data);
    const seen = Object.create(null);

    for (const change of changes) {
      const pathName = change.associated_path_name || change.path_name;

      if (typeof seen[pathName] !== "undefined") {
        continue;
      }

      seen[pathName] = true;
      const ext = pathName.split(".").pop();

      switch (ext) {
        case "css":
          return CssReloader.reload(new RegExp(assetNameFromPath(pathName)));

        case "js":
          if (typeof window.Stimulus === "undefined")
            return StimulusReloader.reload(pathName);

        default:
          switch (config.htmlReloadMethod) {
            case "morph":
              return MorphHtmlReloader.reload();

            case "turbo":
              return TurboHtmlReloader.reload();

            default:
              window.location.reload();

              return;
          }
      }
    }
  };
