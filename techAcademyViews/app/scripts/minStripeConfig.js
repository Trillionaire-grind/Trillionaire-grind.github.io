/**
 * Tech Mastery For Seniors — checkout config (Minorities app bones).
 *
 * free  — email registration, no payment
 * guide — $997 one-time via Stripe Payment Link (paste live URL below)
 * vip   — $97,000 · PHONE ONLY, never Stripe
 *
 * HOW TO GO LIVE (Guide only)
 * 1. Stripe Dashboard → Live mode → Payment Link for the $997 Guide.
 * 2. Paste the live buy.stripe.com URL into GUIDE_PAYMENT_LINK (no /test_).
 * 3. Set CHECKOUT_LIVE = true.
 */
window.MIN_STRIPE = (function () {
  var CHECKOUT_LIVE = false;

  /** LIVE_REQUIRED — $997 NO B.S. Guide Payment Link. null = not wired. */
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

  /** Only the Guide can ever be checkout-ready. VIP is strictly phone. */
  function isTierCheckoutReady(tierId) {
    if (tierId !== "guide") return false;
    return isCheckoutLive() && !!getPaymentLink("guide");
  }

  function isAnyPaidCheckoutReady() {
    return isTierCheckoutReady("guide");
  }

  function checkoutModeLabel() {
    return isAnyPaidCheckoutReady() ? "live" : "call";
  }

  /** @returns {"checkout"|"call"|null} action taken for a paid tier */
  function startTierPurchase(tierId) {
    if (tierId === "guide" && isTierCheckoutReady("guide")) {
      window.open(getPaymentLink("guide"), "_blank", "noopener,noreferrer");
      return "checkout";
    }
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
