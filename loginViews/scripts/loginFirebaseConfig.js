/**
 * Firebase web config — paste values from Firebase Console.
 * See loginFirebaseConfig.example.js for setup steps.
 */
export const loginFirebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: "",
};

export function isLoginFirebaseConfigured() {
  return Boolean(
    loginFirebaseConfig.apiKey &&
      loginFirebaseConfig.projectId &&
      loginFirebaseConfig.appId,
  );
}
