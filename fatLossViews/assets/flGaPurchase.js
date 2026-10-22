/**
 * Google Analytics purchase: thank-you pages only, Stripe session_id required,
 * one fire per session ID (localStorage + GA4 transaction_id).
 */
const STORAGE_KEY = "flGaPurchaseSessionIds";

export function stripeSessionIdFromUrl(search) {
  try {
    const params = new URLSearchParams(search || "");
    return String(params.get("session_id") || "").trim();
  } catch (e) {
    return "";
  }
}

function readSeen() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch (e) {
    return [];
  }
}

function remember(sessionId) {
  const seen = readSeen().filter((id) => id !== sessionId);
  seen.push(sessionId);
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(seen.slice(-80)));
  } catch (e) {}
}

export function fireGaPurchaseOnce(payload) {
  const sessionId = stripeSessionIdFromUrl(location.search);
  if (!sessionId) return false;
  if (readSeen().includes(sessionId)) return false;
  if (typeof gtag !== "function") return false;

  const event = {
    transaction_id: sessionId,
    currency: (payload && payload.currency) || "USD",
  };
  if (payload && payload.value != null) event.value = payload.value;

  gtag("event", "purchase", event);
  remember(sessionId);
  return true;
}
