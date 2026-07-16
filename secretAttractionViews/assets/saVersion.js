export const SA_APP_VERSION = "0.0.0.1";

export function saVersionLabel() {
  return "v" + SA_APP_VERSION;
}

console.log("[Secret Attraction] working version:", saVersionLabel());
