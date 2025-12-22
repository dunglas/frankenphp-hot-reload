export {};

import { Application } from "@hotwired/stimulus";

declare global {
  interface Window {
    Idiomorph?: typeof import("idiomorph");
    Turbo?: typeof import("@hotwired/turbo");
    Stimulus?: Application;
  }
}
