import { initializeApp, getApps, getApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  setPersistence,
  browserLocalPersistence,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoFkUtcSFuwuSiUV8y434de-u8t5-MriM",
  authDomain: "naples-sunrise-bay.firebaseapp.com",
  projectId: "naples-sunrise-bay",
  storageBucket: "naples-sunrise-bay.appspot.com",
  messagingSenderId: "39028676552",
  appId: "1:39028676552:web:82d59b7cb863113f9e12fd",
  measurementId: "G-L0QCNW7C6W",
};

let authReadyPromise = null;

export function getTmApp() {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getTmDb() {
  return getFirestore(getTmApp());
}

export async function getTmAuth() {
  const auth = getAuth(getTmApp());
  if (!authReadyPromise) {
    authReadyPromise = setPersistence(auth, browserLocalPersistence);
  }
  await authReadyPromise;
  return auth;
}

export function waitForTmUser(auth, { timeoutMs = 3000 } = {}) {
  return new Promise((resolve) => {
    if (auth.currentUser) {
      resolve(auth.currentUser);
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(auth.currentUser);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled || !user) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}
