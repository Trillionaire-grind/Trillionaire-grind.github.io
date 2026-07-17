/**
 * Tech Mastery For Seniors — access catalog (Minorities app bones).
 * Same design pattern as the Minorities subscriptions; tech offer
 * names, prices, and assets. Payment wiring lives in minStripeConfig.js.
 */
window.MIN_CATALOG = {
  profile: {
    name: "Member",
    tier: "free",
    avatar: "techAcademyViews/app/assets/person.svg",
  },

  subscriptions: [
    {
      id: "free",
      name: "The Secret To Tech Mastery",
      price: 0,
      image: "techAcademyViews/assets/access/file.png",
      perks:
        "Free forever with your email. Instant access to The Secret To Tech Mastery — the foundational lesson that makes every device fearless.",
    },
    {
      id: "guide",
      name: "NO B.S. Guide To Tech Mastery For Seniors",
      price: 997,
      image: "techAcademyViews/assets/access/guide.png",
      perks:
        "Everything in Free, plus the full guide: cell phone basics, scam avoidance, Zoom, A.I. essentials, and the bonus How To Legally Print Money On The Internet. Comment on lectures and learn on your own terms.",
    },
    {
      id: "vip",
      name: "VIP Experience · Tech Academy Mastermind",
      price: 97000,
      limited: true,
      image: "techAcademyViews/assets/access/vip.png",
      perks:
        "Everything in the Guide, plus live classes, workshops, open Q&A, I.T. help desk chat, and the VIP Tech Academy Mastermind. Enrollment by phone only.",
    },
  ],
};
