/**
 * Mangé Lakay donation tiers — Stripe Payment Links + Calendly for $100K.
 *
 * STRIPE SETUP
 * ────────────
 * For every Payment Link → After payment → Redirect to thankYouUrl (same for all tiers).
 *
 * $100K uses Calendly + invoice — not instant card checkout.
 */
export const KOTFE_THANK_YOU_URL =
  "https://keplersiguineau.com/learnViews/kotfeThankYou.html";

export const KOTFE_DONATE = {
  thankYouUrl: KOTFE_THANK_YOU_URL,
  anyAmountUrl: "https://buy.stripe.com/eVaaFBaGtfPe7gk8wA",
  calendlyUrl: "https://calendly.com/buildingwithkepler",
  supportEmail: "buildingwithkepler@gmail.com",
  tiers: [
    {
      id: "feed",
      amount: 25,
      label: "$25",
      description:
        "About a week of chicken feed for our current flock — keeps daily egg sales running.",
      cta: "Give $25",
      stripeUrl: "https://buy.stripe.com/fZu9AS2PNdZr1RMh1K6Ri0F",
    },
    {
      id: "starter-flock",
      amount: 100,
      label: "$100",
      description:
        "Roughly 8 laying hens — ~500 days of eggs per bird after maturity.",
      cta: "Give $100",
      stripeUrl: "https://buy.stripe.com/3cIeVccqn9Jb53Y4eY6Ri0G",
    },
    {
      id: "land",
      amount: 300,
      label: "$300",
      description:
        "One centième of land — a permanent step toward scaling the flock on the ground in Kotfè.",
      cta: "Give $300",
      stripeUrl: "https://buy.stripe.com/bJecN49eb8F7dAu12M6Ri0H",
    },
    {
      id: "scale",
      amount: 1000,
      label: "$1,000",
      description:
        "Housing, stock, and labor for our next flock expansion — a real operational scale step.",
      cta: "Give $1,000",
      major: true,
      stripeUrl: "https://buy.stripe.com/00w5kCcqnf3v0NI9zi6Ri0I",
    },
    {
      id: "major",
      amount: 10000,
      label: "$10,000",
      description:
        "A major push — land, buildings, and stock toward the first 1,000-bird deployment.",
      cta: "Give $10,000",
      major: true,
      stripeUrl: "https://buy.stripe.com/cNi7sK0HF9Jb0NIfXG6Ri0J",
    },
    {
      id: "deployment",
      amount: 100000,
      label: "$100,000",
      description:
        "Fund the first full deployment milestone (~50 birds → ~1,000) — land, housing, stock, and labor. Named in the quarterly report.",
      cta: "Schedule $100K call",
      major: true,
      flagship: true,
      action: "calendly",
    },
  ],
};
