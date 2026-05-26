import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { isLearnFirebaseConfigured, learnFirebaseConfig } from "./learnFirebaseConfig.js";

let app = null;
let auth = null;
let db = null;

export function initLearnFirebase() {
  if (!isLearnFirebaseConfigured()) return null;
  if (!app) {
    app = initializeApp(learnFirebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

export function getLearnAuth() {
  return auth;
}

export function getLearnDb() {
  return db;
}
