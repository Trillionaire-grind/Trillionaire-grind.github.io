/**
 * Liv Lakay purchased access codes (Firestore collection: codesPurchased).
 * Document id = normalized code (A–Z0–9). Minted after $10 payment; consumed once at signup.
 */

export const LIV_CODES_PURCHASED_COLL = "codesPurchased";

/** Legacy collection — still checked during signup for older codes. */
export const LIV_ACCESS_CODES_LEGACY_COLL = "accessCodes";

export function livCodeIsAvailable(data) {
  if (!data) return false;
  if (data.active === false) return false;
  if (data.used === true || data.consumed === true) return false;
  return true;
}

export function livCodeIsUsed(data) {
  if (!data) return true;
  return data.used === true || data.consumed === true;
}
