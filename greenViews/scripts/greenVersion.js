/** Bump this on each Green Books release (GitHub Pages / Firebase Hosting). */
export const GREEN_APP_VERSION = "0.0.0.6";

export function greenVersionLabel() {
  return "v" + GREEN_APP_VERSION;
}

console.log("[Green Books] working version:", greenVersionLabel());
