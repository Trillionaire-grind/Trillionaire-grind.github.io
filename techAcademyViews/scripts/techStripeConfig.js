/**
 * Tech Mastery For Seniors — checkout config (offer ladder).
 *
 * HOW TO GO LIVE
 * 1. Stripe Dashboard → Live mode → create Payment Links for each offer below.
 * 2. Paste the live buy.stripe.com URLs into TECH_PAYMENT_LINKS (must NOT contain /test_).
 * 3. Set CHECKOUT_LIVE = true.
 *
 * Offer ladder (business.txt):
 *   secret  — The Secret To Tech Mastery — $1
 *   guide   — NO B.S. Guide — $297 (or $24/mo)
 *   academy — Tech Mastery For Seniors Academy — $14,997 (or $750/mo)
 *   vip     — VIP Mastermind — $97,000 (or $8K/mo)
 *
 * Do not use buy.stripe.com/test_… links in production CTAs.
 */

export const TECH_BOOK_CALL = "tel:+17863098015";
export const TECH_BOOK_CALL_DISPLAY = "(786) 309-8015";

/** Flip to true only after live Payment Links are filled in. */
export const CHECKOUT_LIVE = false;

/**
 * Live Payment Link URLs. null = LIVE_REQUIRED (not wired yet).
 * Never paste test-mode Payment Links here.
 */
export const TECH_PAYMENT_LINKS = {
  secret: null, // LIVE_REQUIRED — $1 Secret To Tech Mastery
  guide: null, // LIVE_REQUIRED — $297 NO B.S. Guide
  academy: null, // LIVE_REQUIRED — Academy
  vip: null, // LIVE_REQUIRED — VIP (often book-a-call only)
};

export const TECH_OFFERS = {
  secret: {
    key: "secret",
    label: "The Secret To Tech Mastery",
    priceLabel: "$1",
  },
  guide: {
    key: "guide",
    label: "NO B.S. Guide To Tech Mastery For Seniors",
    priceLabel: "$297",
  },
  academy: {
    key: "academy",
    label: "Tech Mastery For Seniors Academy",
    priceLabel: "$14,997",
  },
  vip: {
    key: "vip",
    label: "Tech Mastery VIP Mastermind",
    priceLabel: "$97,000",
  },
};

export function getPaymentUrl(offerKey) {
  const url = TECH_PAYMENT_LINKS[offerKey];
  if (!url || typeof url !== "string") return null;
  if (url.includes("/test_")) return null;
  return url;
}

export function isCheckoutReady(offerKey) {
  return CHECKOUT_LIVE === true && !!getPaymentUrl(offerKey);
}

/** CTA copy for buttons / labels when live checkout is missing. */
export function getCtaCopy(offerKey) {
  if (isCheckoutReady(offerKey)) {
    return {
      mode: "checkout",
      buttonText: "Buy Now",
      hint: null,
    };
  }
  if (offerKey === "academy" || offerKey === "vip") {
    return {
      mode: "call",
      buttonText: `Call to reserve: ${TECH_BOOK_CALL_DISPLAY}`,
      hint: "Online checkout coming soon — call to reserve your spot.",
    };
  }
  return {
    mode: "soon",
    buttonText: "Checkout coming soon — book a call",
    hint: `Payment is not live yet. Call ${TECH_BOOK_CALL_DISPLAY} to enroll.`,
  };
}

/**
 * Opens live Stripe checkout when configured; otherwise books a call.
 * @returns {"checkout"|"call"}
 */
export function startCheckout(offerKey = "guide") {
  const url = getPaymentUrl(offerKey);
  if (isCheckoutReady(offerKey) && url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return "checkout";
  }
  window.location.href = TECH_BOOK_CALL;
  return "call";
}

/** Wire a button/link label + click for an offer. */
export function bindOfferCta(element, offerKey) {
  if (!element) return;
  const copy = getCtaCopy(offerKey);
  const labelEl = element.querySelector(".mdc-button__label") || element;
  if (labelEl && labelEl.tagName !== "DIV") {
    labelEl.textContent = copy.buttonText;
  }
  element.onclick = (e) => {
    e.preventDefault();
    startCheckout(offerKey);
  };
}
