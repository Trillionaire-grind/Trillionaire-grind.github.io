/**
 * Setup (one time):
 * 1. Create a Firebase project for Fat Loss (or reuse an existing one).
 * 2. Enable Authentication → Email/Password.
 * 3. Create Firestore database.
 * 4. Deploy rules: firebase deploy -c firebase.fatloss.json --project YOUR_PROJECT_ID
 * 5. Copy web app config into flFirebaseConfig.js
 */
export const flFirebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};

export function isFlFirebaseConfigured() {
  return Boolean(
    flFirebaseConfig.apiKey &&
      flFirebaseConfig.projectId &&
      flFirebaseConfig.appId,
  );
}
