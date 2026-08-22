/** Bump this on each Roxanne AI release (GitHub Pages). */
export const ROXANNE_AI_APP_VERSION = "0.0.0.2";

export function roxanneAIVersionLabel() {
  return "v" + ROXANNE_AI_APP_VERSION;
}

console.log("[Roxanne AI] working version:", roxanneAIVersionLabel());
