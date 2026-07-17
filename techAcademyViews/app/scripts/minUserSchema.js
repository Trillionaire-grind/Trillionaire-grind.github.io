/**
 * Firestore user document schema — users/{uid} (tech-mastery-academy)
 *
 * Subscription (billing / content access)
 *   subscriptionId: free | guide | vip
 *   tier: free | guide | vip
 *   subscriptionStatus: none | active | canceled | past_due | trialing
 *
 * Legacy compatibility (pre-app Tech Academy users)
 *   accessLevel: 0 | 1 | 2 | 3  → free | guide | vip | vip
 *   name → used as displayName fallback
 *
 * Team (moderation / ops — separate from subscription)
 *   teamRole: member | creator | moderator | admin
 *   admin: boolean (true when teamRole === "admin")
 */

export const SUBSCRIPTION_IDS = ["free", "guide", "vip"];

export const ACCESS_TIERS = ["free", "guide", "vip"];

export const TEAM_ROLES = ["member", "creator", "moderator", "admin"];

export const SUBSCRIPTION_STATUSES = ["none", "active", "canceled", "past_due", "trialing"];

export const SUBSCRIPTION_TO_TIER = {
  free: "free",
  guide: "guide",
  vip: "vip",
  // legacy aliases
  secret: "free",
  waterboy: "free",
  academy: "vip",
};

export const ACCESS_LEVEL_TO_TIER = {
  0: "free",
  1: "guide",
  2: "vip",
  3: "vip",
};

export const DEFAULT_USER_FIELDS = {
  app: "tech-academy",
  teamRole: "member",
  tier: "free",
  subscriptionId: "free",
  subscriptionStatus: "none",
  admin: false,
};

export function tierFromSubscriptionId(subscriptionId) {
  return SUBSCRIPTION_TO_TIER[subscriptionId] || "free";
}

export function tierFromAccessLevel(accessLevel) {
  return ACCESS_LEVEL_TO_TIER[Number(accessLevel)] || "free";
}

export function adminFlagFromTeamRole(teamRole) {
  return teamRole === "admin";
}

export function normalizeTeamRole(teamRole, adminFlag) {
  if (teamRole && TEAM_ROLES.includes(teamRole)) return teamRole;
  if (adminFlag === true) return "admin";
  return "member";
}

export function normalizeUserProfile(data) {
  if (!data || typeof data !== "object") return null;

  const teamRole = normalizeTeamRole(data.teamRole, data.admin);

  let subscriptionId = data.subscriptionId;
  if (!SUBSCRIPTION_IDS.includes(subscriptionId)) {
    if (ACCESS_TIERS.includes(data.tier)) {
      subscriptionId = data.tier;
    } else if (data.accessLevel !== undefined && data.accessLevel !== null) {
      // Legacy Tech Academy user — map numeric accessLevel
      subscriptionId = tierFromAccessLevel(data.accessLevel);
    } else if (SUBSCRIPTION_TO_TIER[subscriptionId]) {
      subscriptionId = SUBSCRIPTION_TO_TIER[subscriptionId];
    } else {
      subscriptionId = DEFAULT_USER_FIELDS.subscriptionId;
    }
  }

  const tier = ACCESS_TIERS.includes(data.tier)
    ? data.tier
    : tierFromSubscriptionId(subscriptionId);

  const subscriptionStatus = SUBSCRIPTION_STATUSES.includes(data.subscriptionStatus)
    ? data.subscriptionStatus
    : DEFAULT_USER_FIELDS.subscriptionStatus;

  return {
    ...data,
    app: data.app || DEFAULT_USER_FIELDS.app,
    displayName: data.displayName || data.name || "",
    teamRole,
    admin: adminFlagFromTeamRole(teamRole),
    subscriptionId,
    tier,
    subscriptionStatus,
  };
}

export function teamRoleLabel(teamRole) {
  if (teamRole === "admin") return "Admin";
  if (teamRole === "moderator") return "Moderator";
  if (teamRole === "creator") return "Creator";
  return "Member";
}

export function canModerate(teamRole) {
  return teamRole === "moderator" || teamRole === "admin";
}

export function canCreateAsTeam(teamRole) {
  return teamRole === "creator" || teamRole === "moderator" || teamRole === "admin";
}

export const TEAM_AUTHOR_LABELS = [
  "tech academy",
  "tech mastery for seniors",
  "the tech academy",
  "kepler",
  "képler",
];

export function isTeamAuthoredPost(post) {
  if (!post) return false;
  if (post.authorType === "team") return true;
  if (post.authorType === "community") return false;

  const role = post.authorTeamRole || "";
  if (canCreateAsTeam(role)) return true;

  const label = String(post.authorName || post.author || post.authorUsername || "")
    .trim()
    .toLowerCase();
  if (!label) return false;

  return TEAM_AUTHOR_LABELS.some(function (name) {
    return label === name || label.indexOf(name + "/") === 0 || label.indexOf(name) === 0;
  });
}
