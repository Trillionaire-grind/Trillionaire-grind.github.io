/**
 * Mangé Lakay donation tiers — Stripe Payment Links + Calendly for $100K.
 *
 * STRIPE SETUP (optional fixed-amount links)
 * ───────────────────────────────────────────
 * 1. Stripe Dashboard → Payment links → create one link per tier amount ($25 … $10,000).
 * 2. Paste each buy.stripe.com/… URL into stripeUrl for that tier.
 * 3. Leave stripeUrl empty to fall back to anyAmountUrl (customer enters amount at checkout).
 *
 * $100K uses Calendly + invoice — not instant card checkout.
 */
export const KOTFE_DONATE = {
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
      stripeUrl: "",
    },
    {
      id: "starter-flock",
      amount: 100,
      label: "$100",
      description:
        "Roughly 8 laying hens — ~500 days of eggs per bird after maturity.",
      cta: "Give $100",
      stripeUrl: "",
    },
    {
      id: "land",
      amount: 300,
      label: "$300",
      description:
        "One centième of land — a permanent step toward scaling the flock on the ground in Kotfè.",
      cta: "Give $300",
      stripeUrl: "",
    },
    {
      id: "scale",
      amount: 1000,
      label: "$1,000",
      description:
        "Housing, stock, and labor for our next flock expansion — a real operational scale step.",
      cta: "Give $1,000",
      major: true,
      stripeUrl: "",
    },
    {
      id: "major",
      amount: 10000,
      label: "$10,000",
      description:
        "A major push — land, buildings, and stock toward the first 1,000-bird deployment.",
      cta: "Give $10,000",
      major: true,
      stripeUrl: "",
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
