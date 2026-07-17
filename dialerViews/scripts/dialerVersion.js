/** Bump this on each Dial CRM release (GitHub Pages). */
export const DIALER_APP_VERSION = "0.0.0.2";

export function dialerVersionLabel() {
  return "v" + DIALER_APP_VERSION;
}

console.log("[Dial CRM] working version:", dialerVersionLabel());
