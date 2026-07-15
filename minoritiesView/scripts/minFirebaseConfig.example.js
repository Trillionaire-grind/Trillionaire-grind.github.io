/**
 * Copy to minFirebaseConfig.js and fill in after creating the Firebase project.
 * Firebase Console → Project settings → Your apps → Web app.
 */
export const minFirebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "the-minorities.firebaseapp.com",
  projectId: "the-minorities",
  storageBucket: "the-minorities.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
};

/** Cloud Functions base (us-central1). Deploy with firebase.minorities.json */
export const minFunctionsBase =
  "https://us-central1-the-minorities.cloudfunctions.net";

/** Set true once minFirebaseConfig is filled and project is live. */
export const minFirebaseEnabled = false;
