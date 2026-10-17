/**
 * Purchase entitlement for Fat Loss.
 * Thank-you (Stripe session_id and/or kit=1) stamps a local pass.
 * Create-account stays open for 30 days after that stamp.
 * Kibble kit follows the account once they sign up.
 */
export const PURCHASE_STORAGE_KEY = "fl-purchase-v1";
export const SIGNUP_WINDOW_DAYS = 30;
const SIGNUP_WINDOW_MS = SIGNUP_WINDOW_DAYS * 24 * 60 * 60 * 1000;

export function kitFromSearch(search) {
  try {
    const params = new URLSearchParams(search || "");
    return (
      params.get("kit") === "1" ||
      params.get("kit") === "true" ||
      params.get("bundle") === "1"
    );
  } catch {
    return false;
  }
}

export function sessionIdFromSearch(search) {
  try {
    return String(new URLSearchParams(search || "").get("session_id") || "").trim();
  } catch {
    return "";
  }
}

export function getLocalPurchase() {
  try {
    const raw = localStorage.getItem(PURCHASE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      paid: Boolean(parsed.paid),
      kibbleKit: Boolean(parsed.kibbleKit),
      paidAt: typeof parsed.paidAt === "string" ? parsed.paidAt : "",
      sessionId: typeof parsed.sessionId === "string" ? parsed.sessionId : "",
    };
  } catch {
    return null;
  }
}

function saveLocalPurchase(next) {
  try {
    localStorage.setItem(PURCHASE_STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Private mode can block storage. App still runs for this tab.
  }
  return next;
}

export function signupWindowFromPaidAt(paidAtIso, nowMs = Date.now()) {
  const paidAt = Date.parse(paidAtIso || "");
  if (!Number.isFinite(paidAt)) {
    return {
      ok: false,
      daysLeft: 0,
      reason: "Create an account from the thank-you page after you pay.",
    };
  }
  const remaining = paidAt + SIGNUP_WINDOW_MS - nowMs;
  if (remaining <= 0) {
    return {
      ok: false,
      daysLeft: 0,
      reason: "The 30-day window to create an account has ended. Sign in if you already made one.",
    };
  }
  return {
    ok: true,
    daysLeft: Math.max(1, Math.ceil(remaining / 86400000)),
  };
}

export function getSignupWindow(nowMs = Date.now()) {
  const purchase = getLocalPurchase();
  if (!purchase?.paid) {
    return {
      ok: false,
      daysLeft: 0,
      reason: "New accounts open for 30 days after you pay. Open the app from your thank-you page, then create the account.",
    };
  }
  return signupWindowFromPaidAt(purchase.paidAt, nowMs);
}

export function hasLocalPaidAccess() {
  return Boolean(getLocalPurchase()?.paid);
}

export function hasKibbleKit() {
  return Boolean(getLocalPurchase()?.kibbleKit);
}

export function rememberKibbleKit() {
  const prev = getLocalPurchase() || {
    paid: true,
    kibbleKit: false,
    paidAt: new Date().toISOString(),
    sessionId: "",
  };
  if (prev.kibbleKit) return prev;
  return saveLocalPurchase({ ...prev, paid: true, kibbleKit: true });
}

export function capturePurchaseFromUrl(search) {
  const sessionId = sessionIdFromSearch(search);
  const kit = kitFromSearch(search);
  if (!sessionId && !kit) return getLocalPurchase();

  const prev = getLocalPurchase() || {};
  return saveLocalPurchase({
    paid: true,
    kibbleKit: Boolean(prev.kibbleKit || kit),
    paidAt: prev.paidAt || new Date().toISOString(),
    sessionId: sessionId || prev.sessionId || "",
  });
}

export function applyCloudPurchase(profile) {
  if (!profile || typeof profile !== "object") return getLocalPurchase();
  const prev = getLocalPurchase() || {};
  const cloudKit = Boolean(profile.kibbleKit);
  const cloudPaidAt =
    typeof profile.paidAt === "string"
      ? profile.paidAt
      : profile.paidAt?.toDate
        ? profile.paidAt.toDate().toISOString()
        : "";
  if (!cloudKit && !profile.paid && !cloudPaidAt) return prev.paid ? prev : null;

  return saveLocalPurchase({
    paid: true,
    kibbleKit: Boolean(prev.kibbleKit || cloudKit),
    paidAt: prev.paidAt || cloudPaidAt || new Date().toISOString(),
    sessionId: prev.sessionId || String(profile.stripeSessionId || ""),
  });
}
