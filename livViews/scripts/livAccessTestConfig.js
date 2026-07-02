/**
 * Dev bypass for livPass.html local / ?devBypass=1 testing.
 *
 * "Buy access code (test)" generates a code and shows the same post-payment UI.
 * Codes are stored in sessionStorage and accepted at signup on localhost / ?devBypass=1.
 * Optionally tries mintLivDevAccessCode first when LIV_DEV_MINT_URL + LIV_DEV_MINT_KEY are set.
 */
export const LIV_ALLOW_BYPASS_TEST_CODE = false;
export const LIV_BYPASS_TEST_CODE_ID = "TEST";

/** Must match Firebase param LIV_DEV_MINT_KEY on mintLivDevAccessCode (dev/staging only). */
export const LIV_DEV_MINT_KEY = "";

const LIV_DEV_ISSUED_CODES_KEY = "livDevIssuedCodes";
const DEV_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function isLivDevBypassUiEnabled() {
  try {
    if (new URLSearchParams(window.location.search).get("devBypass") === "1") {
      return true;
    }
    const h = window.location.hostname;
    return h === "localhost" || h === "127.0.0.1";
  } catch {
    return false;
  }
}

export function livRememberDevIssuedCode(codeId) {
  if (!codeId) return;
  try {
    const list = JSON.parse(sessionStorage.getItem(LIV_DEV_ISSUED_CODES_KEY) || "[]");
    if (!list.includes(codeId)) list.push(codeId);
    sessionStorage.setItem(LIV_DEV_ISSUED_CODES_KEY, JSON.stringify(list));
  } catch (_) {}
}

export function livIsDevIssuedCode(codeId) {
  if (!isLivDevBypassUiEnabled() || !codeId) return false;
  try {
    const list = JSON.parse(sessionStorage.getItem(LIV_DEV_ISSUED_CODES_KEY) || "[]");
    return list.includes(codeId);
  } catch (_) {
    return false;
  }
}

export function livGenerateLocalTestCode() {
  let out = "LIV";
  for (let i = 0; i < 10; i++) {
    out += DEV_CODE_CHARSET[Math.floor(Math.random() * DEV_CODE_CHARSET.length)];
  }
  return out;
}
