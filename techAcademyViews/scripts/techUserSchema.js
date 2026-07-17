/**
 * Firestore user document schema — users/{uid}
 *
 * Subscription (billing / content access) — Minorities-style tiers
 *   subscriptionId: free | guide | vip
 *   tier: free | guide | vip
 *   accessLevel: 0 | 1 | 2  (legacy numeric; mirrors tier)
 *   subscriptionStatus: none | active | canceled | past_due | trialing
 *
 * Meta: name, email, createdAt, updatedAt
 */

export const SUBSCRIPTION_IDS = ["free", "guide", "vip"];
export const ACCESS_TIERS = ["free", "guide", "vip"];
export const SUBSCRIPTION_STATUSES = ["none", "active", "canceled", "past_due", "trialing"];

/** Legacy numeric accessLevel for existing views */
export const TIER_TO_ACCESS_LEVEL = {
  free: 0,
  guide: 1,
  vip: 2,
};

export const ACCESS_LEVEL_TO_TIER = {
  0: "free",
  1: "guide",
  2: "vip",
  3: "vip", // old VIP mastermind folded into vip
};

export const SUBSCRIPTION_TO_TIER = {
  free: "free",
  guide: "guide",
  vip: "vip",
  // legacy aliases
  secret: "free",
  academy: "vip",
  waterboy: "free",
};

export const DEFAULT_USER_FIELDS = {
  app: "tech-academy",
  tier: "free",
  subscriptionId: "free",
  accessLevel: 0,
  subscriptionStatus: "none",
};

export function tierFromSubscriptionId(subscriptionId) {
  return SUBSCRIPTION_TO_TIER[subscriptionId] || "free";
}

export function tierFromAccessLevel(accessLevel) {
  const n = Number(accessLevel);
  return ACCESS_LEVEL_TO_TIER[n] || "free";
}

export function accessLevelFromTier(tier) {
  return TIER_TO_ACCESS_LEVEL[tier] ?? 0;
}

export function normalizeUserProfile(data) {
  if (!data || typeof data !== "object") return null;

  let subscriptionId = data.subscriptionId;
  let tier = data.tier;

  if (!SUBSCRIPTION_IDS.includes(subscriptionId)) {
    if (ACCESS_TIERS.includes(tier)) {
      subscriptionId = tier;
    } else if (data.accessLevel !== undefined && data.accessLevel !== null) {
      tier = tierFromAccessLevel(data.accessLevel);
      subscriptionId = tier;
    } else {
      subscriptionId = DEFAULT_USER_FIELDS.subscriptionId;
      tier = DEFAULT_USER_FIELDS.tier;
    }
  }

  if (!ACCESS_TIERS.includes(tier)) {
    tier = tierFromSubscriptionId(subscriptionId);
  }

  const accessLevel = accessLevelFromTier(tier);
  const subscriptionStatus = SUBSCRIPTION_STATUSES.includes(data.subscriptionStatus)
    ? data.subscriptionStatus
    : DEFAULT_USER_FIELDS.subscriptionStatus;

  return {
    ...data,
    app: data.app || DEFAULT_USER_FIELDS.app,
    subscriptionId,
    tier,
    accessLevel,
    subscriptionStatus,
  };
}

export function tierLabel(tier) {
  if (tier === "guide") return "NO B.S. Guide To Tech Mastery For Seniors";
  if (tier === "vip") return "VIP Experience · Tech Academy Mastermind";
  return "The Secret To Tech Mastery";
}

export function hasGuideAccess(tierOrLevel) {
  const tier =
    typeof tierOrLevel === "string"
      ? tierOrLevel
      : tierFromAccessLevel(tierOrLevel);
  return tier === "guide" || tier === "vip";
}

export function hasVipAccess(tierOrLevel) {
  const tier =
    typeof tierOrLevel === "string"
      ? tierOrLevel
      : tierFromAccessLevel(tierOrLevel);
  return tier === "vip";
}

export function canAccessCourse(tierOrLevel, courseIndex) {
  const tier =
    typeof tierOrLevel === "string"
      ? tierOrLevel
      : tierFromAccessLevel(tierOrLevel);
  // Free: only course 0 (The Secret). Guide/VIP: all guide courses.
  if (courseIndex === 0) return true;
  return hasGuideAccess(tier);
}
