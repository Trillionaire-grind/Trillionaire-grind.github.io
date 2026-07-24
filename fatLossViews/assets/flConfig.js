/**
 * Fat Loss ebook funnel config.
 * Canonical path: /fatLoss.html
 *
 * Stripe Payment Link success URL (both links):
 *   https://keplersiguineau.com/fatLossViews/thankYou.html
 */
export const PRODUCT_NAME = "How to Lose Fat as Fast as Possible";

export const PRODUCT_PRICE = 29;
export const PRODUCT_PRICE_LABEL = "$29";
export const KIT_PRICE = 9;
export const BUNDLE_PRICE = 38;
export const PRODUCT_PRICE_LABEL_BUNDLE = "$38";
export const VALUE_STACK_TOTAL = "$95+";

/** Book only — $29 */
export const STRIPE_BOOK_ONLY_URL =
  "https://buy.stripe.com/eVqaEW1LJbRjaoicLu6Ri0M";

/** Book + Boy Kibble Kit — $38 */
export const STRIPE_BOOK_PLUS_KIT_URL =
  "https://buy.stripe.com/dRm7sKbmj7B3eEy7ra6Ri0N";

/** @deprecated use STRIPE_BOOK_ONLY_URL */
export const STRIPE_PAYMENT_URL = STRIPE_BOOK_ONLY_URL;

export const CHECKOUT_SUCCESS_URL =
  "https://keplersiguineau.com/fatLossViews/thankYou.html";

/** 2× money-back guarantee — customer sends logs here. */
export const GUARANTEE_EMAIL = "greenbooksapp@gmail.com";

/** Main ebook PDF (relative to fatLossViews/). Worksheets / logs / chart are inside this file. */
export const EBOOK_PDF = "assets/how-to-lose-fat-fast.pdf";

/** Boy Kibble Kit upsell PDF (relative to fatLossViews/). */
export const KIT_PDF = "assets/the-boy-kibble-kit.pdf";

/** @deprecated Worksheets ship inside the ebook — kept empty so old thank-you JS stays safe. */
export const BONUS_DOWNLOADS = [];

/** Hero / section photos (drop files in assets/photos/). */
export const PHOTOS = {
  shirtless: "fatLossViews/assets/photos/shirtless.jpg",
  jersey: "fatLossViews/assets/photos/jersey.jpg",
};
