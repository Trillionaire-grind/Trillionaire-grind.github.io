import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-analytics.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { livFirebaseConfig } from "./livFirebaseConfig.js";

let app = null;

export function initLivFirebase() {
  if (!app) {
    app = initializeApp(livFirebaseConfig);
    getAnalytics(app);
  }
  return {
    app,
    auth: getAuth(app),
    db: getFirestore(app),
  };
}
