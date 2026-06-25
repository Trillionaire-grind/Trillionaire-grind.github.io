import {
  getApp,
  getApps,
  initializeApp,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { isLearnFirebaseConfigured, learnFirebaseConfig } from "./learnFirebaseConfig.js";

const APP_NAME = "learn";

let app = null;
let auth = null;
let db = null;
let authReadyPromise = null;

function getLearnApp() {
  return getApps().some((entry) => entry.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(learnFirebaseConfig, APP_NAME);
}

export function initLearnFirebase() {
  if (!isLearnFirebaseConfigured()) return null;
  if (!app) {
    app = getLearnApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

export async function getLearnAuthReady() {
  const firebase = initLearnFirebase();
  if (!firebase?.auth) return null;
  if (!authReadyPromise) {
    authReadyPromise = setPersistence(firebase.auth, browserLocalPersistence);
  }
  await authReadyPromise;
  return firebase.auth;
}

export function getLearnAuth() {
  return auth;
}

export function getLearnDb() {
  return db;
}
