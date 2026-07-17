/** Firebase web config for Tech Mastery For Seniors (project: tech-mastery-academy) */
export const minFirebaseConfig = {
  apiKey: "AIzaSyAw_s-SsnRQp44GoR7_PZjzocHCTaansfY",
  authDomain: "tech-mastery-academy.firebaseapp.com",
  projectId: "tech-mastery-academy",
  storageBucket: "tech-mastery-academy.firebasestorage.app",
  messagingSenderId: "205345673412",
  appId: "1:205345673412:web:d8970165489c414745b991",
  measurementId: "G-KLKCTD047P",
};

export function isMinFirebaseConfigured() {
  return Boolean(
    minFirebaseConfig.apiKey &&
      minFirebaseConfig.projectId &&
      minFirebaseConfig.appId,
  );
}

/**
 * Tech Academy has no subscription Cloud Function — the Guide sells via a
 * Stripe Payment Link and VIP is phone-only. Return "" so the CF path is
 * never used.
 */
export function getMinCheckoutApiUrl() {
  return "";
}

/** Mux video upload is not configured for Tech Academy. */
export function getMuxUploadApiUrl() {
  return "";
}

export function getMuxUploadStatusApiUrl() {
  return "";
}

export function isMinMuxConfigured() {
  return false;
}

/** No Web Push VAPID key yet — push stays disabled (in-app alerts only). */
export const minFcmVapidKey = "";

export function isMinFcmConfigured() {
  return Boolean(
    minFirebaseConfig.messagingSenderId &&
      minFirebaseConfig.appId &&
      minFcmVapidKey,
  );
}
