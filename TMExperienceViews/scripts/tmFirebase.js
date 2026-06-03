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

export function waitForTmUser(auth, { timeoutMs = 3000, uid = null } = {}) {
  return new Promise((resolve) => {
    const matches = (user) => {
      if (!user) return false;
      if (!uid) return true;
      return user.uid === uid;
    };

    if (matches(auth.currentUser)) {
      resolve(auth.currentUser);
      return;
    }

    let settled = false;
    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsubscribe();
      resolve(matches(auth.currentUser) ? auth.currentUser : null);
    }, timeoutMs);

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (settled || !matches(user)) return;
      settled = true;
      clearTimeout(timeout);
      unsubscribe();
      resolve(user);
    });
  });
}

/** Wait until auth.currentUser matches a specific uid (for account switches). */
export function waitForAuthUid(auth, uid, options = {}) {
  return waitForTmUser(auth, { ...options, uid });
}

/** Resolve signed-in user for iframe views; optional shellUid from parent postMessage. */
export async function requireTmAuthUser(auth, { shellUid = null, timeoutMs = 12000 } = {}) {
  await auth.authStateReady();
  if (shellUid) {
    const matched = await waitForTmUser(auth, { uid: shellUid, timeoutMs });
    if (matched) return matched;
  }
  const user = auth.currentUser;
  if (user) return user;
  return waitForTmUser(auth, { timeoutMs });
}

/** Wait for iframe Auth to match shell before Firestore reads (parent signs in first). */
export async function ensureFirestoreAuth(auth, { shellUid = null, shellSignedIn = null } = {}) {
  return resolveTmIframeAuth(auth, { shellUid, shellSignedIn, timeoutMs: 12000 });
}

/** True only when the shell and Firebase both agree the member is signed out. */
export function shouldTmIframeSignOut(shellSignedIn, auth) {
  return shellSignedIn === false && !auth.currentUser;
}

/**
 * Resolve Auth for iframe tabs. Waits for Firebase session to catch up after shell login.
 */
export async function resolveTmIframeAuth(auth, { shellUid = null, shellSignedIn = null, timeoutMs = 15000 } = {}) {
  await auth.authStateReady();
  const current = auth.currentUser;

  if (shouldTmIframeSignOut(shellSignedIn, auth)) {
    return null;
  }

  if (shellSignedIn === true || shellUid) {
    const matched = await requireTmAuthUser(auth, {
      shellUid: shellUid || undefined,
      timeoutMs,
    });
    if (matched) return matched;
  }

  if (current) {
    if (shellUid && current.uid !== shellUid) return null;
    return current;
  }

  if (shellSignedIn !== false) {
    return waitForTmUser(auth, { timeoutMs });
  }

  return null;
}
