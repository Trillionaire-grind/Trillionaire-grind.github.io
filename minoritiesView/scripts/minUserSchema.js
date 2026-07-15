/**
 * Firestore user document schema — users/{uid}
 *
 * Identity
 *   app: "minorities"
 *   email, displayName, username, bio, avatarUrl
 *
 * Subscription (billing / content access)
 *   subscriptionId: waterboy | bench | starter | owner
 *   tier: free | bench | starter | owner
 *   subscriptionStatus: none | active | canceled | past_due | trialing
 *   stripeCustomerId?, stripeSubscriptionId?, subscriptionRenewsAt?
 *
 * Team (moderation / brand / ops — separate from subscription)
 *   teamRole: member | creator | moderator | admin
 *   admin: boolean (true when teamRole === "admin"; used in security rules)
 *
 * Post documents (posts/{id}) — author classification
 *   authorType: team | community
 *   authorTeamRole: team role at time of post (optional)
 *
 * Meta: createdAt, updatedAt
 */

export const SUBSCRIPTION_IDS = ["waterboy", "bench", "starter", "owner"];

export const ACCESS_TIERS = ["free", "bench", "starter", "owner"];

export const TEAM_ROLES = ["member", "creator", "moderator", "admin"];

export const SUBSCRIPTION_STATUSES = ["none", "active", "canceled", "past_due", "trialing"];

export const SUBSCRIPTION_TO_TIER = {
  waterboy: "free",
  bench: "bench",
  starter: "starter",
  owner: "owner",
};

export const DEFAULT_USER_FIELDS = {
  app: "minorities",
  teamRole: "member",
  tier: "free",
  subscriptionId: "waterboy",
  subscriptionStatus: "none",
  admin: false,
};

export function tierFromSubscriptionId(subscriptionId) {
  return SUBSCRIPTION_TO_TIER[subscriptionId] || "free";
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
  const subscriptionId = SUBSCRIPTION_IDS.includes(data.subscriptionId)
    ? data.subscriptionId
    : DEFAULT_USER_FIELDS.subscriptionId;
  const tier = ACCESS_TIERS.includes(data.tier)
    ? data.tier
    : tierFromSubscriptionId(subscriptionId);
  const subscriptionStatus = SUBSCRIPTION_STATUSES.includes(data.subscriptionStatus)
    ? data.subscriptionStatus
    : DEFAULT_USER_FIELDS.subscriptionStatus;

  return {
    ...data,
    app: data.app || DEFAULT_USER_FIELDS.app,
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
  "the minorities",
  "jason/jay",
  "jason",
  "jay",
  "zed",
  "zeb",
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
