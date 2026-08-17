/**
 * Fat Loss funnel config.
 * Sales: /fatLoss.html
 * Product app (book + ledger): /fatLossViews/app.html
 *
 * Stripe Payment Link → After payment → Redirect customers to:
 *   Book only ($29):
 *     https://keplersiguineau.com/fatLossViews/thankYou.html
 *   Book + Boy Kibble Kit ($38):
 *     https://keplersiguineau.com/fatLossViews/thankYou.html?kit=1
 *
 * Thank-you sends buyers to the app. Kit PDF also available when ?kit=1.
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

/** Customer-facing app — book reader + 90-day ledger (installable PWA). */
export const APP_URL = "app.html";
export const APP_ABSOLUTE_URL =
  "https://keplersiguineau.com/fatLossViews/app.html";

/** 2× money-back guarantee — customer sends logs here. */
export const GUARANTEE_EMAIL = "greenbooksapp@gmail.com";

/** @deprecated use GUARANTEE_EMAIL */
export const SUPPORT_EMAIL = GUARANTEE_EMAIL;

/** Main ebook PDF (relative to fatLossViews/). */
export const EBOOK_PDF = "assets/how-to-lose-fat-fast.pdf";

/** Boy Kibble Kit upsell PDF (relative to fatLossViews/). */
export const KIT_PDF = "assets/the-boy-kibble-kit.pdf";

/** Ledger lives inside the app. */
export const LEDGER_URL = "app.html#ledger";
export const LEDGER_DAYS = 90;
export const LEDGER_WORKOUTS_PER_WEEK = 3;

/** @deprecated Worksheets ship inside the ebook — kept empty so old thank-you JS stays safe. */
export const BONUS_DOWNLOADS = [];

/** Hero / section photos (drop files in assets/photos/). */
export const PHOTOS = {
  heroSpread: "fatLossViews/assets/photos/product-stack.png",
  shirtless: "fatLossViews/assets/photos/shirtless.jpg",
};
