/**
 * Stripe for local testing. No Firebase required.
 *
 * 1. Stripe Dashboard (test mode) → Product → Payment link for each rank.
 * 2. After payment → redirect to:
 *    http://127.0.0.1:8766/princes.html?paid=ticket
 *    (use the rank id: ticket, private, specialist, …)
 *    Live site: https://YOUR_DOMAIN/princes.html?paid=ticket
 * 3. Paste each buy.stripe.com or buy.stripe.com/test_ URL below.
 * 4. Apple Pay and Google Pay show on Stripe's hosted page once the domain
 *    is verified. On localhost, use a Stripe test card (4242 4242 4242 4242).
 */
window.PRINCES_STRIPE = (function () {
  var LINKS = {
    ticket: "",
    private: "",
    specialist: "",
    sergeant: "",
    colonel: "",
    court: "",
  };

  function linkFor(tierId) {
    var url = String(LINKS[tierId] || "").trim();
    if (url.indexOf("https://buy.stripe.com/") === 0) return url;
    return "";
  }

  function isReady(tierId) {
    return Boolean(linkFor(tierId));
  }

  function startCheckout(tierId) {
    var url = linkFor(tierId);
    try {
      sessionStorage.setItem("princes.pendingTier", String(tierId || ""));
    } catch (_) {}
    if (!url) return { ok: false, reason: "no_link" };
    window.location.href = url;
    return { ok: true };
  }

  function paidTierFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var paid = params.get("paid") || params.get("unlock");
    if (paid) return paid;
    if (params.get("checkout") === "success") {
      try {
        return sessionStorage.getItem("princes.pendingTier") || "";
      } catch (_) {
        return "";
      }
    }
    return "";
  }

  function clearPayQuery() {
    if (!window.location.search) return;
    var url = window.location.pathname + window.location.hash;
    window.history.replaceState({}, "", url);
    try {
      sessionStorage.removeItem("princes.pendingTier");
    } catch (_) {}
  }

  return {
    mode: "test",
    LINKS: LINKS,
    linkFor: linkFor,
    isReady: isReady,
    startCheckout: startCheckout,
    paidTierFromUrl: paidTierFromUrl,
    clearPayQuery: clearPayQuery,
  };
})();
