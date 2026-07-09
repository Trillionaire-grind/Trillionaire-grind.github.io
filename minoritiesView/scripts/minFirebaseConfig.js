/** Firebase web config for The Minorities (project: the-minorities) */
export const minFirebaseConfig = {
  apiKey: "AIzaSyBVQvjVADlwaS06syq9D4CWogSy2sC-4aU",
  authDomain: "the-minorities.firebaseapp.com",
  projectId: "the-minorities",
  storageBucket: "the-minorities.firebasestorage.app",
  messagingSenderId: "1037931201409",
  appId: "1:1037931201409:web:caf7850d07a29a0c969e80",
  measurementId: "G-H51EZ9Q5DK",
};

export function isMinFirebaseConfigured() {
  return Boolean(
    minFirebaseConfig.apiKey &&
      minFirebaseConfig.projectId &&
      minFirebaseConfig.appId,
  );
}

/** Subscription checkout Cloud Function — derived from projectId */
export function getMinCheckoutApiUrl() {
  if (!minFirebaseConfig.projectId) return "";
  return `https://us-central1-${minFirebaseConfig.projectId}.cloudfunctions.net/createMinSubscriptionCheckout`;
}

function functionsBaseUrl() {
  if (!minFirebaseConfig.projectId) return "";
  return `https://us-central1-${minFirebaseConfig.projectId}.cloudfunctions.net`;
}

/** Mux direct upload — requires MUX_TOKEN_ID + MUX_TOKEN_SECRET on Cloud Functions */
export function getMuxUploadApiUrl() {
  const base = functionsBaseUrl();
  return base ? `${base}/createMuxDirectUpload` : "";
}

export function getMuxUploadStatusApiUrl() {
  const base = functionsBaseUrl();
  return base ? `${base}/getMuxUploadStatus` : "";
}

export function isMinMuxConfigured() {
  return Boolean(getMuxUploadApiUrl() && getMuxUploadStatusApiUrl());
}

/**
 * Web Push VAPID key — Firebase Console → Project settings → Cloud Messaging
 * → Web Push certificates → Key pair → copy public key.
 */
export const minFcmVapidKey = "";

export function isMinFcmConfigured() {
  return Boolean(
    minFirebaseConfig.messagingSenderId &&
      minFirebaseConfig.appId &&
      minFcmVapidKey,
  );
}
