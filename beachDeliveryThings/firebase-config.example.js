/**
 * Copy this file to firebase-config.js and fill in your Firebase web app credentials.
 * Firebase Console → Project settings → Your apps → Web app → Config
 *
 * IMPORTANT: use window.FIREBASE_CONFIG (not firebaseConfig) so other scripts can read it.
 */
window.FIREBASE_CONFIG = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

/** Emails allowed to access Restaurant admin (in addition to PIN). */
window.STAFF_EMAILS = [
  "owner@badasscoffee.com",
];
