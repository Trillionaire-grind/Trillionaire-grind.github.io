import {
  createUserWithEmailAndPassword,
  deleteUser,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import {
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { getFlAuthReady, getFlDb, isFlFirebaseConfigured } from "./flFirebase.js";
import {
  getLedgerState,
  mergeLedgerStates,
  replaceLedgerState,
} from "./flLedgerStore.js";

export const USERS_COLLECTION = "fatLossUsers";

let auth = null;
let db = null;
let currentUser = null;
let authReady = false;
let cloudSyncEnabled = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(currentUser, cloudSyncEnabled);
    } catch (err) {
      console.error("[Fat Loss auth] listener error", err);
    }
  });
}

function authErrorMessage(error) {
  const code = error?.code || "";
  if (code === "auth/email-already-in-use") return "That email is already registered.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (
    code === "auth/user-not-found" ||
    code === "auth/wrong-password" ||
    code === "auth/invalid-credential"
  ) {
    return "Email or password is incorrect.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a minute and try again.";
  return error?.message || "Something went wrong. Try again.";
}

export async function loadCloudLedger(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  const data = snap.data();
  return data?.ledger || null;
}

export async function saveCloudLedger(uid, state, email) {
  if (!db) return;
  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      email: email || null,
      ledger: state,
      ledgerUpdatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

async function syncLedgerForUser(user) {
  const local = getLedgerState();
  const cloud = await loadCloudLedger(user.uid);
  const merged = mergeLedgerStates(local, cloud);
  replaceLedgerState(merged);
  await saveCloudLedger(user.uid, merged, user.email);
}

export async function pushLedgerToCloud() {
  if (!currentUser || !cloudSyncEnabled) return;
  const state = getLedgerState();
  await saveCloudLedger(currentUser.uid, state, currentUser.email);
}

export async function initFlAuth() {
  cloudSyncEnabled = isFlFirebaseConfigured();
  if (!cloudSyncEnabled) {
    authReady = true;
    notify();
    return false;
  }
  auth = await getFlAuthReady();
  if (!auth) {
    authReady = true;
    notify();
    return false;
  }
  db = getFlDb();
  onAuthStateChanged(auth, async (user) => {
    currentUser = user;
    if (user) {
      try {
        await syncLedgerForUser(user);
      } catch (err) {
        console.error("[Fat Loss auth] ledger sync failed", err);
      }
    }
    authReady = true;
    notify();
  });
  return true;
}

export function onFlAuthChange(fn) {
  listeners.add(fn);
  fn(currentUser, cloudSyncEnabled);
  return () => listeners.delete(fn);
}

export function waitForFlAuthReady() {
  return new Promise((resolve) => {
    if (authReady) {
      resolve({ user: currentUser, cloudSyncEnabled });
      return;
    }
    const unsub = onFlAuthChange((user, enabled) => {
      if (authReady) {
        unsub();
        resolve({ user, cloudSyncEnabled: enabled });
      }
    });
  });
}

export function getFlUser() {
  return currentUser;
}

export function isCloudSyncEnabled() {
  return cloudSyncEnabled;
}

export async function signUp(email, password) {
  if (!auth) throw new Error("Account sync is not configured yet.");
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  await syncLedgerForUser(cred.user);
  return cred.user;
}

export async function signIn(email, password) {
  if (!auth) throw new Error("Account sync is not configured yet.");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  await syncLedgerForUser(cred.user);
  return cred.user;
}

export async function signOutUser() {
  if (!auth) return;
  await signOut(auth);
}

export async function resetPassword(email) {
  if (!auth) throw new Error("Account sync is not configured yet.");
  await sendPasswordResetEmail(auth, email.trim());
}

export async function deleteAccount() {
  if (!auth || !currentUser) throw new Error("No signed-in account.");
  const uid = currentUser.uid;
  if (db) {
    await setDoc(doc(db, USERS_COLLECTION, uid), { ledger: null, deletedAt: serverTimestamp() }, { merge: true });
  }
  await deleteUser(currentUser);
}

export { authErrorMessage };
