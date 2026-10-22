/**
 * Copy to loginFirebaseConfig.js and paste your Firebase web app config.
 *
 * Firebase Console setup:
 * 1. Create project (e.g. network-checkin-app)
 * 2. Authentication → Email/Password → Enable
 * 3. Firestore → Create database
 * 4. Storage → Enable
 * 5. Project settings → Your apps → Web → copy config here
 * 6. Deploy rules: firebase deploy -c firebase.network.json --project YOUR_PROJECT_ID
 *
 * First admin: in Firestore set networkMembers/{your-uid}.admin = true
 *
 * QR code URL: https://keplersiguineau.com/login.html?checkin=1
 */
export const loginFirebaseConfig = {
  apiKey: "AIza...",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.firebasestorage.app",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456",
};

export function isLoginFirebaseConfigured() {
  return Boolean(
    loginFirebaseConfig.apiKey &&
      loginFirebaseConfig.projectId &&
      loginFirebaseConfig.appId &&
      !loginFirebaseConfig.apiKey.startsWith("AIza...") &&
      loginFirebaseConfig.projectId !== "YOUR_PROJECT_ID",
  );
}
