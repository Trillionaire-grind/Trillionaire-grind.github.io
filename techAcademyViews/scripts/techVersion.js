/** Bump this on each Tech Academy release (GitHub Pages). */
export const TECH_APP_VERSION = "0.0.0.1";

export function techVersionLabel() {
  return "v" + TECH_APP_VERSION;
}

export const TECH_APP_VERSION_LABEL = techVersionLabel();

console.log("[Tech Mastery Academy] working version:", TECH_APP_VERSION_LABEL);
