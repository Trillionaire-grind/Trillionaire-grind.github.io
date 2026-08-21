/** Bump this on each Roxanne release (GitHub Pages). */
export const ROXANNE_APP_VERSION = "0.0.0.1";

export function roxanneVersionLabel() {
  return "v" + ROXANNE_APP_VERSION;
}

console.log("[Roxanne] working version:", roxanneVersionLabel());
