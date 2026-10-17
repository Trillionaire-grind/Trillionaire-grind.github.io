/**
 * Firebase web config for Fat Loss auth + ledger sync.
 * Same keplersiguineau.com project as Learn (naples-sunrise-bay).
 * Customer docs live in fatLossUsers/{uid}. Meal photos never go here.
 */
export const flFirebaseConfig = {
  apiKey: "AIzaSyBoFkUtcSFuwuSiUV8y434de-u8t5-MriM",
  authDomain: "naples-sunrise-bay.firebaseapp.com",
  projectId: "naples-sunrise-bay",
  storageBucket: "naples-sunrise-bay.appspot.com",
  messagingSenderId: "39028676552",
  appId: "1:39028676552:web:82d59b7cb863113f9e12fd",
};

export function isFlFirebaseConfigured() {
  return Boolean(
    flFirebaseConfig.apiKey &&
      flFirebaseConfig.projectId &&
      flFirebaseConfig.appId,
  );
}
