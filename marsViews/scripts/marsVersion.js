export const MARS_APP_VERSION = "0.0.0.1";

export function marsVersionLabel() {
  return "v" + MARS_APP_VERSION;
}

console.log("[BettrLife Mars] working version:", marsVersionLabel());
