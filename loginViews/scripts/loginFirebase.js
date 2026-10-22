import { getApp, getApps, initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
import {
  browserLocalPersistence,
  getAuth,
  setPersistence,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import {
  isLoginFirebaseConfigured,
  loginFirebaseConfig,
} from "./loginFirebaseConfig.js";

const APP_NAME = "network-login";

let app = null;
let auth = null;
let db = null;
let storage = null;

function getLoginApp() {
  return getApps().some((entry) => entry.name === APP_NAME)
    ? getApp(APP_NAME)
    : initializeApp(loginFirebaseConfig, APP_NAME);
}

export function initLoginFirebase() {
  if (!isLoginFirebaseConfigured()) return null;
  if (!app) {
    app = getLoginApp();
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
  }
  return { app, auth, db, storage };
}

export async function getLoginAuthReady() {
  const firebase = initLoginFirebase();
  if (!firebase?.auth) return null;
  await setPersistence(firebase.auth, browserLocalPersistence);
  return firebase.auth;
}

export function getLoginDb() {
  return initLoginFirebase()?.db || null;
}

export function getLoginStorage() {
  return initLoginFirebase()?.storage || null;
}

export function getLoginAuth() {
  return initLoginFirebase()?.auth || null;
}
