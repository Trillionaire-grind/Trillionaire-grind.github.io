import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import {
  flFirebaseConfig,
  isFlFirebaseConfigured,
} from "./flFirebaseConfig.js";

const APP_NAME = "fat-loss-app";

let app = null;
let auth = null;
let db = null;

function getFlApp() {
  return getApps().some((entry) => entry.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(flFirebaseConfig, APP_NAME);
}

export function initFlFirebase() {
  if (!isFlFirebaseConfigured()) return null;
  if (!app) {
    app = getFlApp();
    auth = getAuth(app);
    db = getFirestore(app);
  }
  return { app, auth, db };
}

export async function getFlAuthReady() {
  const firebase = initFlFirebase();
  if (!firebase?.auth) return null;
  await setPersistence(firebase.auth, browserLocalPersistence);
  return firebase.auth;
}

export function getFlDb() {
  return initFlFirebase()?.db || null;
}

export function getFlAuth() {
  return initFlFirebase()?.auth || null;
}

export { isFlFirebaseConfigured };
