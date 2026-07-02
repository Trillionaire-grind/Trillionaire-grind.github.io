/**
 * Liv Lakay sponsorship tiers — Stripe Payment Links + Calendly for flagship tier.
 *
 * STRIPE SETUP: each Payment Link → After payment → redirect to thankYouUrl.
 * Top tier ($45K): Calendly call + invoice/wire (same pattern as Mangé Lakay $100K).
 */
import { LIV_SUPPORT_EMAIL } from "./livCheckoutConfig.js";

export const LIV_SUPPORT_THANK_YOU_URL =
  "https://keplersiguineau.com/livViews/livSupportThankYou.html";

export const LIV_SUPPORT = {
  thankYouUrl: LIV_SUPPORT_THANK_YOU_URL,
  /** Optional “any amount” link; leave empty until Stripe is ready. */
  anyAmountUrl: "",
  calendlyUrl: "https://calendly.com/buildingwithkepler",
  supportEmail: LIV_SUPPORT_EMAIL,
  /** Retail access pass (individual) — links to purchase flow. */
  singlePassUrl: "../livPass.html",
  tiers: [
    {
      id: "family",
      amount: 30,
      label: "$30",
      name: "Twazy elèv",
      nameEn: "Three students",
      description:
        "Aksè Liv Lakay pou twa timoun — yon ti fanmi, twa frè ak sè, oswa twa zanmi ki pa t kapab peye pès la.",
      descriptionEn: "Liv Lakay access for three children — siblings, cousins, or friends who cannot afford a pass.",
      cta: "Bay $30",
      stripeUrl: "",
    },
    {
      id: "classroom",
      amount: 100,
      label: "$100",
      name: "Yon klas",
      nameEn: "Classroom",
      description:
        "Sponsorize aksè pou yon klas (~30 elèv). Pri patnè — nou mete plis pase yon pès $10 sou chak elèv pou rive nan kantite sa a.",
      descriptionEn: "Sponsor access for a full classroom (~30 students) at partner pricing.",
      cta: "Bay $100",
      major: true,
      stripeUrl: "",
    },
    {
      id: "school",
      amount: 3000,
      label: "$3,000",
      name: "Alimante yon lekòl",
      nameEn: "Fuel a school",
      description:
        "Kòd aksè an gwoup, fòmasyon anplwaye, ak sipò pou mete Liv Lakay nan yon lekòl — liv Kreyòl sou telefòn ak òdinatè.",
      descriptionEn: "Bulk passes, staff onboarding, and rollout support for one school.",
      cta: "Bay $3,000",
      major: true,
      stripeUrl: "",
    },
    {
      id: "regional",
      amount: 45000,
      label: "$45,000",
      name: "Patnè rejyonal",
      nameEn: "Regional partner",
      description:
        "Déplwayman nan plizyè lekòl — vise ~5,000 elèv nan yon rejyon. Nou planifye ak ou anvan peman (apèl + rapò).",
      descriptionEn:
        "Multi-school deployment — target ~5,000 students in a region. We plan with you before payment (call + reporting).",
      cta: "Planifye apèl patnè",
      ctaEn: "Schedule partner call",
      major: true,
      flagship: true,
      action: "calendly",
    },
  ],
};
