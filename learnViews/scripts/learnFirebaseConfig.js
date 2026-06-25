/** Firebase web config for keplersiguineau.com / learnViews (naples-sunrise-bay) */
export const learnFirebaseConfig = {
  apiKey: "AIzaSyBoFkUtcSFuwuSiUV8y434de-u8t5-MriM",
  authDomain: "naples-sunrise-bay.firebaseapp.com",
  projectId: "naples-sunrise-bay",
  storageBucket: "naples-sunrise-bay.appspot.com",
  messagingSenderId: "39028676552",
  appId: "1:39028676552:web:82d59b7cb863113f9e12fd",
  measurementId: "G-L0QCNW7C6W",
};

/** Only these emails may stay signed in on Notes admin */
export const LEARN_ADMIN_EMAILS = [
  "buildingwithkepler@gmail.com",
];

export function isLearnFirebaseConfigured() {
  return Boolean(learnFirebaseConfig.apiKey && learnFirebaseConfig.projectId);
}

/** True when Firebase is not set up — notes stay in the browser only */
export function isLearnDemoMode() {
  return !isLearnFirebaseConfigured();
}

/** Optional GA4 measurement ID — set on window before loading learnAnalytics.js */
export const LEARN_GA_MEASUREMENT_ID =
  typeof window !== "undefined" ? window.LEARN_GA_MEASUREMENT_ID || "" : "";
