/** Bump this on each Liv Lakay release push. */
export const LIV_APP_VERSION = "0.0.0.5";

export function livVersionLabel() {
  return "v" + LIV_APP_VERSION;
}

console.log("[Liv Lakay] working version:", livVersionLabel());
