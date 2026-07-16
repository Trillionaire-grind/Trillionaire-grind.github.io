/**
 * Tech Mastery For Seniors — checkout config (3-tier membership).
 *
 * Tiers (mirrors Minorities structure; different names/prices/benefits):
 *   free  — Free · The Secret To Tech Mastery — $0 (register only)
 *   guide — NO B.S. Guide To Tech Mastery For Seniors — $997 (Stripe Payment Link)
 *   vip   — VIP Experience · Tech Academy Mastermind — $97,000 (phone call only)
 *
 * HOW TO GO LIVE (Guide only)
 * 1. Stripe Dashboard → Live mode → create a Payment Link for the $997 Guide.
 * 2. Paste the live buy.stripe.com URL into TECH_PAYMENT_LINKS.guide (no /test_).
 * 3. Set CHECKOUT_LIVE = true.
 *
 * VIP never uses Stripe — startCheckout("vip") always opens the phone dialer.
 */

export const TECH_BOOK_CALL = "tel:+17863098015";
export const TECH_BOOK_CALL_DISPLAY = "(786) 309-8015";

/** Flip to true only after the Guide live Payment Link is filled in. */
export const CHECKOUT_LIVE = false;

/**
 * Live Payment Link URLs. null = not wired yet.
 * free — email registration only (no Stripe)
 * vip  — phone call only (never a Payment Link)
 */
export const TECH_PAYMENT_LINKS = {
  free: null,
  guide: null, // LIVE_REQUIRED — $997 NO B.S. Guide
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
  const key = normalizeOfferKey(offerKey);
  // VIP is strictly phone — never resolve a Stripe URL
  if (key === "vip" || key === "free") return null;
  const url = TECH_PAYMENT_LINKS[key];
  if (!url || typeof url !== "string") return null;
  if (url.includes("/test_")) return null;
  return url;
}

export function isCheckoutReady(offerKey) {
  const key = normalizeOfferKey(offerKey);
  if (key === "free" || key === "vip") return false;
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
  if (key === "vip") {
    return {
      mode: "call",
      buttonText: `Call to reserve: ${TECH_BOOK_CALL_DISPLAY}`,
      hint: "VIP Experience ($97,000) — phone enrollment only. No online checkout.",
    };
  }
  if (isCheckoutReady(key)) {
    return {
      mode: "checkout",
      buttonText: "Get The Guide — $997",
      hint: null,
    };
  }
  return {
    mode: "soon",
    buttonText: "Checkout coming soon — book a call",
    hint: `Guide payment is not live yet. Call ${TECH_BOOK_CALL_DISPLAY} to enroll.`,
  };
}

/**
 * Free → register. Guide → Stripe when live, else call. VIP → always call.
 * @returns {"checkout"|"call"|"register"}
 */
export function startCheckout(offerKey = "guide") {
  const key = normalizeOfferKey(offerKey);
  if (key === "free") {
    window.location.href = "registerView.html?tier=free";
    return "register";
  }
  if (key === "vip") {
    window.location.href = TECH_BOOK_CALL;
    return "call";
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
