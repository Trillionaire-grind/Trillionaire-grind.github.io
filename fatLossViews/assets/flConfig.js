/**
 * Fat Loss ebook funnel config.
 * Canonical path: /fatLoss.html
 *
 * Stripe Payment Link → After payment → Redirect customers to:
 *   Book only ($29):
 *     https://keplersiguineau.com/fatLossViews/thankYou.html
 *   Book + Boy Kibble Kit ($38):
 *     https://keplersiguineau.com/fatLossViews/thankYou.html?kit=1
 *
 * Thank-you OTOs (set Payment Link success URL to thankYou.html or thankYou.html?kit=1
 * if they already have the kit flag — usually plain thankYou.html is fine):
 *   Corner Man ($79) / Day 1 Review ($27) → same thank-you page
 *
 * The thank-you page only shows the kit download when ?kit=1 is present.
 */
export const PRODUCT_NAME = "How to Lose Fat as Fast as Possible";

export const PRODUCT_PRICE = 29;
export const PRODUCT_PRICE_LABEL = "$29";
export const KIT_PRICE = 9;
export const BUNDLE_PRICE = 38;
export const PRODUCT_PRICE_LABEL_BUNDLE = "$38";
export const VALUE_STACK_TOTAL = "$147";

/** Book only — $29 */
export const STRIPE_BOOK_ONLY_URL =
  "https://buy.stripe.com/eVqaEW1LJbRjaoicLu6Ri0M";

/** Book + Boy Kibble Kit — $38 */
export const STRIPE_BOOK_PLUS_KIT_URL =
  "https://buy.stripe.com/dRm7sKbmj7B3eEy7ra6Ri0N";

/** @deprecated use STRIPE_BOOK_ONLY_URL */
export const STRIPE_PAYMENT_URL = STRIPE_BOOK_ONLY_URL;

/** Book-only Stripe success redirect (no kit download). */
export const CHECKOUT_SUCCESS_URL =
  "https://keplersiguineau.com/fatLossViews/thankYou.html";

/** Book + kit Stripe success redirect (shows kit download). */
export const CHECKOUT_SUCCESS_URL_WITH_KIT =
  "https://keplersiguineau.com/fatLossViews/thankYou.html?kit=1";

/** The 90 Day Corner Man OTO — $79 one-time. */
export const CORNER_MAN_PRICE = 79;
export const CORNER_MAN_PRICE_LABEL = "$79";
export const STRIPE_CORNER_MAN_URL =
  "https://buy.stripe.com/4gM3cuaif5sVcwqaDm6Ri0O";

/** Day 1 Review downsell — $27 one-time. */
export const DAY1_REVIEW_PRICE = 27;
export const DAY1_REVIEW_PRICE_LABEL = "$27";
export const STRIPE_DAY1_REVIEW_URL =
  "https://buy.stripe.com/aFaeVc61ZaNfbsm26Q6Ri0P";

/** Support / Day 1 registration / guarantee emails. */
export const SUPPORT_EMAIL = "ksiguineau@gmail.com";
export const GUARANTEE_EMAIL = SUPPORT_EMAIL;

/** Main ebook PDF (relative to fatLossViews/). Worksheets / logs / chart are inside this file. */
export const EBOOK_PDF = "assets/how-to-lose-fat-fast.pdf";

/** Boy Kibble Kit upsell PDF (relative to fatLossViews/). */
export const KIT_PDF = "assets/the-boy-kibble-kit.pdf";

/** 90-day three-pillar ledger (calories · steps · workouts). */
export const LEDGER_URL = "ledger.html";
export const LEDGER_DAYS = 90;
export const LEDGER_WORKOUTS_PER_WEEK = 3;

/** @deprecated Worksheets ship inside the ebook — kept empty so old thank-you JS stays safe. */
export const BONUS_DOWNLOADS = [];

/** Hero / section photos (drop files in assets/photos/). */
export const PHOTOS = {
  heroSpread: "fatLossViews/assets/photos/product-stack.png",
  shirtless: "fatLossViews/assets/photos/shirtless.jpg",
};
