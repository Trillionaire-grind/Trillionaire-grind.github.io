"use strict";

/** Canonical tier ids — must match client minData.js subscription ids. */
const TIERS = Object.freeze({
  free: { id: "free", rank: 0, contentAccess: false },
  waterboy: { id: "waterboy", rank: 1, contentAccess: false },
  bench: { id: "bench", rank: 2, contentAccess: true },
  starter: { id: "starter", rank: 3, contentAccess: true },
  vip: { id: "vip", rank: 4, contentAccess: true },
});

const PAID_TIER_IDS = ["waterboy", "bench", "starter", "vip"];

function normalizeTier(value) {
  if (typeof value !== "string") return "free";
  const key = value.trim().toLowerCase();
  return TIERS[key] ? key : "free";
}

/** Whether a user tier can read content that requires `requiredTier`. */
function tierCanAccess(userTier, requiredTier) {
  const user = normalizeTier(userTier);
  const required = normalizeTier(requiredTier || "free");
  if (required === "free") return true;
  if (!TIERS[user].contentAccess) return false;
  return TIERS[user].rank >= TIERS[required].rank;
}

function tierFromStripePriceId(priceId, priceMap) {
  if (!priceId || !priceMap) return "free";
  for (const [tierId, mappedPrice] of Object.entries(priceMap)) {
    if (mappedPrice && mappedPrice === priceId) return tierId;
  }
  return "free";
}

module.exports = {
  TIERS,
  PAID_TIER_IDS,
  normalizeTier,
  tierCanAccess,
  tierFromStripePriceId,
};
