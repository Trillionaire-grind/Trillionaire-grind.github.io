/**
 * Tech Mastery For Seniors — checkout config (3-tier membership).
 *
 * Tiers (mirrors Minorities structure; different names/prices/benefits):
 *   free  — Free · The Secret To Tech Mastery — $0 (register only)
 *   guide — NO B.S. Guide To Tech Mastery For Seniors — $997 (phone call only)
 *   vip   — VIP Experience · Tech Academy Mastermind — $97,000 (phone call only)
 *
 * Guide and VIP enroll by dial — no Stripe Payment Links in the app.
 */

export const TECH_BOOK_CALL = "tel:+17863098015";
export const TECH_BOOK_CALL_DISPLAY = "(786) 309-8015";

/** Online card checkout is off — Guide and VIP both dial. */
export const CHECKOUT_LIVE = false;

/**
 * Payment Link URLs kept null — paid tiers are call-only.
 */
export const TECH_PAYMENT_LINKS = {
  free: null,
  guide: null, // CALL_ONLY — dial to enroll
  vip: null, // CALL_ONLY — do not add a Stripe URL
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
    priceLabel: "$997",
  },
  vip: {
    key: "vip",
    label: "VIP Experience · Tech Academy Mastermind",
    priceLabel: "$97,000",
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
  return null;
}

export function isCheckoutReady(offerKey) {
  return false;
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
  if (key === "vip") {
    return {
      mode: "call",
      buttonText: `Call to reserve: ${TECH_BOOK_CALL_DISPLAY}`,
      hint: "VIP Experience ($97,000) — phone enrollment only. No online checkout.",
    };
  }
  return {
    mode: "call",
    buttonText: `Call to enroll — ${TECH_BOOK_CALL_DISPLAY}`,
    hint: `NO B.S. Guide ($997) — call to enroll. No online checkout.`,
  };
}

/**
 * Free → register. Guide + VIP → always call.
 * @returns {"checkout"|"call"|"register"}
 */
export function startCheckout(offerKey = "guide") {
  const key = normalizeOfferKey(offerKey);
  if (key === "free") {
    window.location.href = "registerView.html?tier=free";
    return "register";
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
