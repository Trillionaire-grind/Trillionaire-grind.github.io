export const LOGIN_APP_VERSION = "0.0.0.4";

export function loginVersionLabel() {
  return "v" + LOGIN_APP_VERSION;
}

console.log("[Network Login] working version:", loginVersionLabel());
