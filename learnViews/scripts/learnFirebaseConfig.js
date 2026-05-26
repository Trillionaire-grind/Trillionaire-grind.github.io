/** Firebase web config for keplersiguineau.com / learnViews */
export const learnFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
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
