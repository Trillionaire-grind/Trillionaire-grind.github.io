/**
 * Firebase web config for Fat Loss app auth + ledger sync.
 * Paste values from Firebase Console (see flFirebaseConfig.example.js).
 */
export const flFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export function isFlFirebaseConfigured() {
  return Boolean(
    flFirebaseConfig.apiKey &&
      flFirebaseConfig.projectId &&
      flFirebaseConfig.appId,
  );
}
