/**
 * Mangé Lakay donation tiers — Stripe Payment Links + Calendly for $100K.
 *
 * STRIPE SETUP
 * ────────────
 * For each Payment Link → After payment → Redirect to the thank-you URL below.
 *
 *   $25      → …/kotfeThankYou.html?tier=feed
 *   $100     → …/kotfeThankYou.html?tier=starter-flock
 *   $300     → …/kotfeThankYou.html?tier=land
 *   $1,000   → …/kotfeThankYou.html?tier=scale
 *   $10,000  → …/kotfeThankYou.html?tier=major
 *   Any amt  → …/kotfeThankYou.html?tier=any
 *
 * $100K uses Calendly + invoice — not instant card checkout.
 */
const KOTFE_SITE_ORIGIN = "https://keplersiguineau.com";

export const KOTFE_THANK_YOU_PATH = "/learnViews/kotfeThankYou.html";

export function kotfeThankYouUrl(tierId) {
  const url = new URL(KOTFE_THANK_YOU_PATH, KOTFE_SITE_ORIGIN);
  if (tierId) url.searchParams.set("tier", tierId);
  return url.href;
}

export const KOTFE_DONATE = {
  anyAmountUrl: "https://buy.stripe.com/eVaaFBaGtfPe7gk8wA",
  anyAmountThankYouUrl: kotfeThankYouUrl("any"),
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
      thankYouUrl: kotfeThankYouUrl("feed"),
    },
    {
      id: "starter-flock",
      amount: 100,
      label: "$100",
      description:
        "Roughly 8 laying hens — ~500 days of eggs per bird after maturity.",
      cta: "Give $100",
      stripeUrl: "https://buy.stripe.com/3cIeVccqn9Jb53Y4eY6Ri0G",
      thankYouUrl: kotfeThankYouUrl("starter-flock"),
    },
    {
      id: "land",
      amount: 300,
      label: "$300",
      description:
        "One centième of land — a permanent step toward scaling the flock on the ground in Kotfè.",
      cta: "Give $300",
      stripeUrl: "https://buy.stripe.com/bJecN49eb8F7dAu12M6Ri0H",
      thankYouUrl: kotfeThankYouUrl("land"),
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
      thankYouUrl: kotfeThankYouUrl("scale"),
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
      thankYouUrl: kotfeThankYouUrl("major"),
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
