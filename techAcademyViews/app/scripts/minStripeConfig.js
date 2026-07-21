/**
 * Tech Mastery For Seniors — checkout config (Minorities app bones).
 *
 * free  — email registration, no payment
 * guide — $997 · PHONE ONLY (dial to enroll)
 * vip   — $97,000 · PHONE ONLY, never Stripe
 *
 * Paid tiers enroll by call — no Stripe Payment Links in the app.
 */
window.MIN_STRIPE = (function () {
  /** Online card checkout is off — Guide and VIP both dial. */
  var CHECKOUT_LIVE = false;

  /** Kept null on purpose — Guide is call-only. */
  var GUIDE_PAYMENT_LINK = null;

  var BOOK_CALL = "tel:+17863098015";
  var BOOK_CALL_DISPLAY = "(786) 309-8015";

  function isValidLink(url) {
    if (!url || typeof url !== "string") return false;
    if (url.indexOf("/test_") !== -1) return false;
    return url.indexOf("https://buy.stripe.com/") === 0;
  }

  function getPaymentLink(tierId) {
    if (tierId !== "guide") return null;
    return isValidLink(GUIDE_PAYMENT_LINK) ? GUIDE_PAYMENT_LINK : null;
  }

  function isCheckoutLive() {
    return CHECKOUT_LIVE === true;
  }

  /** No paid tier uses Stripe checkout — always dial. */
  function isTierCheckoutReady(tierId) {
    return false;
  }

  function isAnyPaidCheckoutReady() {
    return false;
  }

  function checkoutModeLabel() {
    return "call";
  }

  /** @returns {"checkout"|"call"|null} action taken for a paid tier */
  function startTierPurchase(tierId) {
    if (tierId === "guide" || tierId === "vip") {
      window.location.href = BOOK_CALL;
      return "call";
    }
    return null;
  }

  return {
    CHECKOUT_LIVE: CHECKOUT_LIVE,
    BOOK_CALL: BOOK_CALL,
    BOOK_CALL_DISPLAY: BOOK_CALL_DISPLAY,
    getPaymentLink: getPaymentLink,
    isCheckoutLive: isCheckoutLive,
    isTierCheckoutReady: isTierCheckoutReady,
    isAnyPaidCheckoutReady: isAnyPaidCheckoutReady,
    checkoutModeLabel: checkoutModeLabel,
    startTierPurchase: startTierPurchase,
  };
})();
