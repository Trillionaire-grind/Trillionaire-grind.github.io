/**
 * Temporary dev bypass: skip Firestore accessCodes read/redeem for one fixed code.
 *
 * Normalized access code must match LIV_BYPASS_TEST_CODE_ID (default "TEST" = user types "test").
 * Set LIV_ALLOW_BYPASS_TEST_CODE to false before any public/production release.
 */
export const LIV_ALLOW_BYPASS_TEST_CODE = true;
export const LIV_BYPASS_TEST_CODE_ID = "TEST";
