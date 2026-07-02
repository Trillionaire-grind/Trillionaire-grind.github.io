/**
 * Liv Lakay site + Stripe checkout (Firebase Functions, project liv-lakay).
 * Deploy functions: firebase use liv-lakay && firebase deploy --only functions
 *
 * Payment Links alone are not enough — the webhook must mint codesPurchased in Firestore.
 */

export const LIV_SUPPORT_EMAIL = "buildingwithkepler@gmail.com";

export function livSupportMailto(subject = "Liv Lakay support") {
  return `mailto:${LIV_SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
}

export const LIV_CREATE_CHECKOUT_SESSION_URL =
  "https://us-central1-liv-lakay.cloudfunctions.net/createLivPassCheckout";

export const LIV_REVEAL_ACCESS_CODE_URL =
  "https://us-central1-liv-lakay.cloudfunctions.net/revealLivAccessCode";

/**
 * Dev/staging only: POST to mintLivDevAccessCode with header X-Liv-Dev-Mint.
 * Shown on livPass on localhost / 127.0.0.1 / ?devBypass=1
 */
export const LIV_DEV_MINT_URL =
  "https://us-central1-liv-lakay.cloudfunctions.net/mintLivDevAccessCode";
