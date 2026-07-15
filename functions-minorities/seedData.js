"use strict";

/**
 * Default Firestore seed for a fresh The Minorities project.
 * Run once via adminSeedMinContent (requires MIN_ADMIN_SEED_KEY).
 */
module.exports = {
  contentCards: [
    {
      id: "welcome",
      title: "Welcome to The Minorities",
      date: "Jan 1, 2026",
      commentsCount: 0,
      imageUrl: null,
      locked: false,
      requiredTier: "free",
      sortOrder: 0,
      body: "Official updates, drops, and member-only content live here.",
      active: true,
    },
    {
      id: "member-preview",
      title: "Member-only drop preview",
      date: "Jan 1, 2026",
      commentsCount: 0,
      imageUrl: null,
      locked: true,
      requiredTier: "starter",
      sortOrder: 1,
      body: "Upgrade to Starter or above to unlock this content.",
      active: true,
    },
  ],

  chatRooms: [
    {
      id: "general",
      name: "General Community Group Chat",
      preview: "Welcome everyone",
      vip: false,
      isGroup: true,
      memberUids: [],
      sortOrder: 0,
    },
    {
      id: "vip",
      name: "V.I.P. Group Chat",
      preview: "VIP members only",
      vip: true,
      isGroup: true,
      memberUids: [],
      sortOrder: 1,
    },
  ],

  learnSessions: [
    {
      id: "next-live",
      title: "Upcoming Live Session",
      nextSessionLabel: "Tuesday at 4:00 PM EST",
      startAt: null,
      zoomUrl: "",
      requiredTier: "starter",
      replayUrl: null,
      active: true,
    },
  ],
};
