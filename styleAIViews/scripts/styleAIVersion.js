/** Bump this on each Style AI release (GitHub Pages). */
export const STYLE_AI_APP_VERSION = "0.0.0.2";

export function styleAIVersionLabel() {
  return "v" + STYLE_AI_APP_VERSION;
}

console.log("[Style AI] working version:", styleAIVersionLabel());

const label = document.getElementById("appVersion");
if (label) label.textContent = styleAIVersionLabel();
