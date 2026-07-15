/**
 * The Minorities — Stripe subscription checkout config.
 *
 * HOW TO GO LIVE
 * 1. Stripe Dashboard → create monthly Prices for Bench / Starter / Owner.
 * 2. Paste live Price IDs (price_…) into MIN_STRIPE_PRICE_IDS below.
 *    Never invent IDs. Leave CLEAR_REQUIRED until you have real ones.
 * 3. Set Firebase secrets + params on project the-minorities (see
 *    minoritiesFunctions/README.txt), deploy createMinSubscriptionCheckout
 *    + stripeWebhook, then flip CHECKOUT_LIVE to true.
 *
 * Waterboy is free — no Stripe Price. Client saves it via selectSubscriptionPlan.
 *
 * Do not paste buy.stripe.com/test_… Payment Links here.
 */
window.MIN_STRIPE = (function () {
  /** Flip to true only after live Price IDs + CF secrets are deployed. */
  var CHECKOUT_LIVE = false;

  /**
   * Stripe Price IDs by subscription tier id.
   * CLEAR_REQUIRED = not configured — CF returns tier_not_configured.
   */
  var MIN_STRIPE_PRICE_IDS = {
    // waterboy: free — no price
    bench: "CLEAR_REQUIRED", // LIVE_REQUIRED — $1/mo Bench Player
    starter: "CLEAR_REQUIRED", // LIVE_REQUIRED — $14.99/mo Starter
    owner: "CLEAR_REQUIRED", // LIVE_REQUIRED — $2497/mo Owner
  };

  function isPlaceholder(value) {
    if (!value || typeof value !== "string") return true;
    var trimmed = value.trim();
    if (!trimmed) return true;
    if (trimmed === "CLEAR_REQUIRED" || trimmed.indexOf("LIVE_REQUIRED") === 0) return true;
    if (trimmed.indexOf("price_") !== 0) return true;
    return false;
  }

  function getPriceId(tierId) {
    if (tierId === "waterboy") return null;
    var id = MIN_STRIPE_PRICE_IDS[tierId];
    if (isPlaceholder(id)) return null;
    return id;
  }

  function isCheckoutLive() {
    return CHECKOUT_LIVE === true;
  }

  /** Paid tier ready for CF Checkout Session. */
  function isTierCheckoutReady(tierId) {
    if (tierId === "waterboy") return false;
    return isCheckoutLive() && !!getPriceId(tierId);
  }

  /** Any paid checkout can run (live flag + at least one real price). */
  function isAnyPaidCheckoutReady() {
    if (!isCheckoutLive()) return false;
    return ["bench", "starter", "owner"].some(function (id) {
      return !!getPriceId(id);
    });
  }

  function checkoutModeLabel() {
    if (isAnyPaidCheckoutReady()) return "live";
    return "demo";
  }

  return {
    CHECKOUT_LIVE: CHECKOUT_LIVE,
    MIN_STRIPE_PRICE_IDS: MIN_STRIPE_PRICE_IDS,
    getPriceId: getPriceId,
    isCheckoutLive: isCheckoutLive,
    isTierCheckoutReady: isTierCheckoutReady,
    isAnyPaidCheckoutReady: isAnyPaidCheckoutReady,
    checkoutModeLabel: checkoutModeLabel,
  };
})();
