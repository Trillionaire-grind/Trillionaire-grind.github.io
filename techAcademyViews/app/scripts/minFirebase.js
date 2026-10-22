import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { isMinFirebaseConfigured, minFirebaseConfig } from "./minFirebaseConfig.js";

const APP_NAME = "tech-academy";

let app = null;
let auth = null;
let db = null;
let storage = null;

function getMinApp() {
  return getApps().some((entry) => entry.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(minFirebaseConfig, APP_NAME);
}

export function initMinFirebase() {
  if (!isMinFirebaseConfigured()) return null;
  if (!app) {
    app = getMinApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
}

export async function getMinAuthReady() {
  const firebase = initMinFirebase();
  if (!firebase?.auth) return null;
  await setPersistence(firebase.auth, browserLocalPersistence);
  return firebase.auth;
}
