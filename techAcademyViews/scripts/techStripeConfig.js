/**
 * Tech Mastery For Seniors — checkout config (3-tier membership).
 *
 * Tiers (mirrors Minorities structure; different names/prices/benefits):
 *   free  — Free · The Secret To Tech Mastery — $0 (register only)
 *   guide — NO B.S. Guide To Tech Mastery For Seniors — $297
 *   vip   — VIP Experience · Tech Academy Mastermind — $14,997 (or call)
 *
 * HOW TO GO LIVE
 * 1. Stripe Dashboard → Live mode → create Payment Links for guide + vip.
 * 2. Paste live buy.stripe.com URLs into TECH_PAYMENT_LINKS (no /test_).
 * 3. Set CHECKOUT_LIVE = true.
 */

export const TECH_BOOK_CALL = "tel:+17863098015";
export const TECH_BOOK_CALL_DISPLAY = "(786) 309-8015";

/** Flip to true only after live Payment Links are filled in. */
export const CHECKOUT_LIVE = false;

/**
 * Live Payment Link URLs. null = not wired yet.
 * Free has no Stripe link — email registration only.
 */
export const TECH_PAYMENT_LINKS = {
  free: null,
  guide: null, // LIVE_REQUIRED — $297 NO B.S. Guide
  vip: null, // LIVE_REQUIRED — VIP Experience (or keep call-only)
  // legacy keys → map to new tiers
  secret: null,
  academy: null,
};

export const TECH_OFFERS = {
  free: {
    key: "free",
    label: "Free · The Secret To Tech Mastery",
    priceLabel: "Free",
  },
  guide: {
    key: "guide",
    label: "NO B.S. Guide To Tech Mastery For Seniors",
    priceLabel: "$297",
  },
  vip: {
    key: "vip",
    label: "VIP Experience · Tech Academy Mastermind",
    priceLabel: "$14,997",
  },
};

/** Normalize legacy offer keys to the 3-tier model */
export function normalizeOfferKey(offerKey) {
  if (offerKey === "secret") return "free";
  if (offerKey === "academy") return "vip";
  if (offerKey === "free" || offerKey === "guide" || offerKey === "vip") {
    return offerKey;
  }
  return "guide";
}

export function getPaymentUrl(offerKey) {
  const key = normalizeOfferKey(offerKey);
  const url = TECH_PAYMENT_LINKS[key];
  if (!url || typeof url !== "string") return null;
  if (url.includes("/test_")) return null;
  return url;
}

export function isCheckoutReady(offerKey) {
  const key = normalizeOfferKey(offerKey);
  if (key === "free") return false;
  return CHECKOUT_LIVE === true && !!getPaymentUrl(key);
}

export function getCtaCopy(offerKey) {
  const key = normalizeOfferKey(offerKey);
  if (key === "free") {
    return {
      mode: "register",
      buttonText: "Create free account",
      hint: "Free with email — unlock The Secret To Tech Mastery.",
    };
  }
  if (isCheckoutReady(key)) {
    return {
      mode: "checkout",
      buttonText: key === "guide" ? "Get The Guide — $297" : "Join VIP Experience",
      hint: null,
    };
  }
  if (key === "vip") {
    return {
      mode: "call",
      buttonText: `Call to reserve: ${TECH_BOOK_CALL_DISPLAY}`,
      hint: "VIP Experience — call to reserve your spot.",
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
 * Free should use registerView — not this helper.
 * @returns {"checkout"|"call"|"register"}
 */
export function startCheckout(offerKey = "guide") {
  const key = normalizeOfferKey(offerKey);
  if (key === "free") {
    window.location.href = "registerView.html?tier=free";
    return "register";
  }
  const url = getPaymentUrl(key);
  if (isCheckoutReady(key) && url) {
    window.open(url, "_blank", "noopener,noreferrer");
    return "checkout";
  }
  window.location.href = TECH_BOOK_CALL;
  return "call";
}

export function bindOfferCta(element, offerKey) {
  if (!element) return;
  const key = normalizeOfferKey(offerKey);
  const copy = getCtaCopy(key);
  const labelEl = element.querySelector(".mdc-button__label") || element;
  if (labelEl && labelEl.tagName !== "DIV") {
    labelEl.textContent = copy.buttonText;
  }
  element.onclick = (e) => {
    e.preventDefault();
    startCheckout(key);
  };
}
