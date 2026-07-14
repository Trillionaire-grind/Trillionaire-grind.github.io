/**
 * Copy to minFirebaseConfig.js and paste your Firebase web app config.
 * Project: the-minorities-app (create in Firebase Console first).
 */
export const minFirebaseConfig = {
  apiKey: "AIza...",
  authDomain: "the-minorities.firebaseapp.com",
  projectId: "the-minorities",
  storageBucket: "the-minorities.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
  measurementId: "G-XXXXXXXXXX",
};

export function isMinFirebaseConfigured() {
  return Boolean(
    minFirebaseConfig.apiKey &&
      minFirebaseConfig.projectId &&
      minFirebaseConfig.appId,
  );
}

export function getMinCheckoutApiUrl() {
  if (!minFirebaseConfig.projectId) return "";
  return `https://us-central1-${minFirebaseConfig.projectId}.cloudfunctions.net/createMinSubscriptionCheckout`;
}

function functionsBaseUrl() {
  if (!minFirebaseConfig.projectId) return "";
  return `https://us-central1-${minFirebaseConfig.projectId}.cloudfunctions.net`;
}

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

/** Web Push VAPID public key (Firebase Console → Cloud Messaging → Web Push certificates). */
export const minFcmVapidKey = "";

export function isMinFcmConfigured() {
  return Boolean(
    minFirebaseConfig.messagingSenderId &&
      minFirebaseConfig.appId &&
      minFcmVapidKey,
  );
}

/*
FCM setup:
1. Firebase Console → Project settings → Cloud Messaging → Web Push certificates → Generate key pair
2. Paste the public key into minFcmVapidKey above
3. Deploy functions: firebase deploy -c firebase.minorities.json --project the-minorities --only functions,firestore:rules

Mux setup (free plan):
1. https://dashboard.mux.com → Settings → Access Tokens
2. Deploy functions + secrets (see minoritiesFunctions/README.txt)

Stripe subscription checkout:
1. Create monthly Prices for bench / starter / owner in Stripe
2. Set CF params MIN_STRIPE_PRICE_* + secrets (see minoritiesFunctions/README.txt)
3. Paste the same Price IDs into minStripeConfig.js and set CHECKOUT_LIVE = true
*/
