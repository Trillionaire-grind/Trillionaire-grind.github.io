/**
 * Dev bypass for livPass.html — LOCALHOST ONLY in production builds.
 *
 * localhost / 127.0.0.1:
 *   • “Buy access code (test)” simulates post-payment UI
 *   • sessionStorage codes + TEST accepted at signup
 *
 * Production (keplersiguineau.com): all bypasses OFF — real codes only from
 * codesPurchased (Stripe webhook) or manual Admin SDK mint.
 *
 * Optional: mintLivDevAccessCode when LIV_DEV_MINT_URL + LIV_DEV_MINT_KEY set
 * on a dev/staging Firebase project only — never on liv-lakay production.
 */
export const LIV_ALLOW_BYPASS_TEST_CODE = false;
export const LIV_BYPASS_TEST_CODE_ID = "TEST";

/** Must match Firebase param LIV_DEV_MINT_KEY (dev/staging only). Leave empty in prod. */
export const LIV_DEV_MINT_KEY = "";

const LIV_DEV_ISSUED_CODES_KEY = "livDevIssuedCodes";
const DEV_CODE_CHARSET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/** True only on local dev servers — not on live GitHub Pages. */
export function isLivDevBypassUiEnabled() {
  try {
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
