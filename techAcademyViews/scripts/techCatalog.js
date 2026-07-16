/**
 * Tech Mastery For Seniors — membership catalog (Minorities-style).
 * Stripe Payment Links live in techStripeConfig.js.
 */
export const TECH_CATALOG = {
  profile: {
    name: "Member",
    tier: "free",
  },

  subscriptions: [
    {
      id: "free",
      name: "Free · The Secret To Tech Mastery",
      price: 0,
      priceLabel: "Free",
      perks:
        "Create a free account with your email. Instant access to The Secret To Tech Mastery — the foundational seminar that teaches how to master technology.",
    },
    {
      id: "guide",
      name: "NO B.S. Guide To Tech Mastery For Seniors",
      price: 297,
      priceLabel: "$297",
      perks:
        "Everything in Free, plus the full NO B.S. Guide: cell phone basics, scam avoidance, Zoom, A.I. essentials, and the bonus “How To Legally Print Money On The Internet.” Learn on your own terms.",
    },
    {
      id: "vip",
      name: "VIP Experience · Tech Academy Mastermind",
      price: 14997,
      priceLabel: "$14,997",
      limited: true,
      perks:
        "Everything in the Guide, plus live classes, workshops, open Q&A, I.T. help desk access, and the VIP Tech Academy Mastermind experience. High-touch support to become truly tech-savvy.",
    },
  ],
};

export function getSubscriptionById(id) {
  return TECH_CATALOG.subscriptions.find((s) => s.id === id) || null;
}
