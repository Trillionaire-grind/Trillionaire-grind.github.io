/**
 * Business-card QR redirect — change focus here only.
 *
 * Print this URL on cards (never change the printed URL):
 *   https://keplersiguineau.com/QR-redirect.html
 *
 * Then swap QR_REDIRECT_DESTINATION below whenever the campaign changes.
 * Prefer site-relative paths (start with /) or full https:// URLs.
 *
 * Common targets (copy one into QR_REDIRECT_DESTINATION):
 *   /techAcademy.html
 *   /techApp.html#register
 *   /consulting.html
 *   /learnViews/learn.html
 *   /secretAttraction.html
 *   /liv.html
 *   /mars.html
 *   /strangestSecret.html
 *   /greenBooks.html
 *   tel:+17863098015
 */

/** Bump on each redirect / destination change that ships. */
export const QR_REDIRECT_VERSION = "0.0.0.1";

export function qrRedirectVersionLabel() {
  return "v" + QR_REDIRECT_VERSION;
}

export const QR_REDIRECT_VERSION_LABEL = qrRedirectVersionLabel();

/**
 * LIVE destination — edit this string to retarget every printed card.
 * Current focus: Tech Academy (Guide / free register funnel).
 */
export const QR_REDIRECT_DESTINATION = "/techAcademy.html";

/** Short label shown on the brief “taking you…” screen. */
export const QR_REDIRECT_FOCUS_LABEL = "Tech Academy";

console.log(
  "[QR Redirect] working version:",
  QR_REDIRECT_VERSION_LABEL,
  "→",
  QR_REDIRECT_DESTINATION
);
