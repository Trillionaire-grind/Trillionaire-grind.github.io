/** Bump on each consulting funnel release. */
export const CONSULTING_APP_VERSION = "0.0.0.2";

/** Put this URL on your business card QR code */
export const CONSULTING_QR_URL = "https://keplersiguineau.com/consulting.html";

export function consultingVersionLabel() {
  return "v" + CONSULTING_APP_VERSION;
}

/** Book a strategy / scoping call */
export const CONSULTING_SPEAK_URL = "/learnViews/learn.html#speak";

export const CONSULTING_HUB_URL = "/consulting.html";
export const MARKETING_WEBSITES_URL = "/consultingViews/marketing-websites.html";
export const CUSTOM_SOFTWARE_URL = "/consultingViews/custom-software.html";

export const WEBSITE_TIERS = [
  {
    id: "lead-gen",
    name: "Starter Site",
    price: "$997",
    priceNote: "one-time build",
    tagline: "One clear page so people can find you and reach out.",
    bullets: [
      "One professional page about your business",
      "Contact form or click-to-call",
      "Looks good on phones",
      "Shows up when people Google you",
      "We show you how to update basic text",
    ],
    bestFor: "Local shops, salons, contractors, and service businesses that need a real web presence fast.",
    featured: false,
  },
  {
    id: "lead-machine",
    name: "Growth Site",
    price: "$5,997",
    priceNote: "full website build",
    tagline: "The full setup — pages, forms, booking, and follow-up.",
    bullets: [
      "Home page + service pages as you need them",
      "Forms that email you when someone inquires",
      "Online booking or payment if you take deposits",
      "Thank-you pages after someone signs up",
      "Quick call up front so we build what you actually sell",
    ],
    bestFor: "Business owners ready to turn their website into a steady source of calls and leads.",
    featured: true,
  },
  {
    id: "web-app",
    name: "Custom Web App",
    price: "$12,000+",
    priceNote: "priced after we talk",
    tagline: "When your business needs its own tool — not just pages.",
    bullets: [
      "Customer logins (track orders, files, appointments)",
      "A back-office for you and your staff",
      "Secure hosting — we handle the tech",
      "Take payments online if you need to",
      "Ongoing help available",
    ],
    bestFor: "Growing businesses tired of juggling spreadsheets and five different apps.",
    featured: false,
    href: CUSTOM_SOFTWARE_URL,
  },
];

console.log("[Consulting] working version:", consultingVersionLabel());
