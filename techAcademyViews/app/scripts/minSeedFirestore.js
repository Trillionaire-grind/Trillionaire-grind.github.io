/**
 * One-time Firestore seed payloads for Tech Mastery For Seniors.
 * Seeded by an admin login when collections are empty — see
 * seedDefaultFirestoreContent(). The six Guide lessons also render as
 * local fallback cards before any Firestore content exists.
 */

export const SEED_CONTENT_CARDS = [
  {
    id: "lesson-secret",
    title: "The Secret To Tech Mastery",
    author: "Tech Academy",
    image: "techAcademyViews/assets/guide/secret_1.png",
    externalUrl: "techAcademyViews/secrets/firstSecret.html",
    body: "FREE — The foundational lesson. You cannot break your phone by tapping the wrong thing.",
    access: "free",
    locked: false,
    sortOrder: 60,
  },
  {
    id: "lesson-cellphone",
    title: "Master The Basics Of Your Cell Phone",
    author: "Tech Academy",
    image: "techAcademyViews/assets/guide/secret_2.png",
    externalUrl: "techAcademyViews/secrets/secondSecret.html",
    body: "GUIDE — Calls, favorites, dictated texts, photos, bigger text, flashlight, charging.",
    access: "guide",
    locked: true,
    sortOrder: 50,
  },
  {
    id: "lesson-scams",
    title: "How To Avoid Scams",
    author: "Tech Academy",
    image: "techAcademyViews/assets/guide/secret_3.png",
    externalUrl: "techAcademyViews/secrets/thirdSecret.html",
    body: "GUIDE — Hang up and call back, the gift-card rule, the family code word, link safety.",
    access: "guide",
    locked: true,
    sortOrder: 40,
  },
  {
    id: "lesson-zoom",
    title: "How To Use Zoom",
    author: "Tech Academy",
    image: "techAcademyViews/assets/guide/secret_4.png",
    externalUrl: "techAcademyViews/secrets/fourthSecret.html",
    body: "GUIDE — Join any call in three taps, the two buttons that matter, and the phone backup.",
    access: "guide",
    locked: true,
    sortOrder: 30,
  },
  {
    id: "lesson-ai",
    title: "5 Things You Need To Know About A.I.",
    author: "Tech Academy",
    image: "techAcademyViews/assets/guide/secret_5.png",
    externalUrl: "techAcademyViews/secrets/fifthSecret.html",
    body: "GUIDE — What A.I. really is, how to use it as your patient teacher, and how to stay safe.",
    access: "guide",
    locked: true,
    sortOrder: 20,
  },
  {
    id: "lesson-print-money",
    title: "How To Legally Print Money On The Internet",
    author: "Tech Academy",
    image: "techAcademyViews/assets/guide/secret_bonus.png",
    externalUrl: "techAcademyViews/secrets/bonusSecret.html",
    body: "BONUS (GUIDE) — Turn things you own and things you know into real income, safely.",
    access: "guide",
    locked: true,
    sortOrder: 10,
  },
];

export const SEED_POSTS = [
  {
    id: "welcome",
    headline: "Welcome to the Tech Academy",
    body:
      "This is your home for lectures, announcements, and community. Start with The Secret To Tech Mastery — it's free. Guide members unlock the full curriculum; the VIP Experience adds live classes and the I.T. help desk.",
    authorName: "Tech Academy",
    authorUsername: "techacademy",
    authorType: "team",
    type: "text",
    sortOrder: 20,
  },
  {
    id: "first-assignment",
    headline: "Your first assignment",
    body:
      "Practice the escape hatch ten times today: open any app, then go home. By tomorrow it will be automatic — and a device that can always be rescued is a device you can never fear.",
    authorName: "Tech Academy",
    authorUsername: "techacademy",
    authorType: "team",
    type: "text",
    sortOrder: 10,
  },
];

export const SEED_PRODUCTS = [];

export const SEED_APP_CONFIG = {
  learn: {
    nextSession: "Live class schedule posted soon",
    previewNote:
      "VIP Experience joins live classes, workshops, and the I.T. help desk. Free and Guide members see the schedule only.",
    zoomUrl: "",
  },
  promo: {
    title: "VIP Experience",
    body: "Tech Academy Mastermind — live classes, workshops & help desk",
    cta: "See access levels ›",
    image: "techAcademyViews/assets/access/vip.png",
    linkTab: "subscribe",
  },
};
