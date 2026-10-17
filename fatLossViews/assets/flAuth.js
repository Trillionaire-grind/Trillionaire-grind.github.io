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
  ledgerForCloud,
  mergeLedgerStates,
  replaceLedgerState,
} from "./flLedgerStore.js";
import {
  applyCloudPurchase,
  getLocalPurchase,
  getSignupWindow,
} from "./flPurchase.js";

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
  if (code === "fl/signup-window") return error?.message || "The 30-day window to create an account has ended.";
  return error?.message || "Something went wrong. Try again.";
}

export async function loadCloudProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return snap.data() || null;
}

export async function loadCloudLedger(uid) {
  const profile = await loadCloudProfile(uid);
  return profile?.ledger || null;
}

function purchaseFieldsForCloud(isNew) {
  const purchase = getLocalPurchase() || {};
  const fields = {
    paid: true,
    paidAt: purchase.paidAt || null,
    stripeSessionId: purchase.sessionId || null,
  };
  if (purchase.kibbleKit) fields.kibbleKit = true;
  if (isNew) fields.accountCreatedAt = serverTimestamp();
  return fields;
}

export async function saveCloudLedger(uid, state, email, options = {}) {
  if (!db) return;
  await setDoc(
    doc(db, USERS_COLLECTION, uid),
    {
      email: email || null,
      ledger: ledgerForCloud(state),
      ledgerUpdatedAt: serverTimestamp(),
      ...purchaseFieldsForCloud(Boolean(options.isNew)),
    },
    { merge: true },
  );
}

async function syncLedgerForUser(user, options = {}) {
  const local = getLedgerState();
  const profile = await loadCloudProfile(user.uid);
  applyCloudPurchase(profile);
  const merged = mergeLedgerStates(local, profile?.ledger);
  replaceLedgerState(merged);
  await saveCloudLedger(user.uid, merged, user.email, options);
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
  const signup = getSignupWindow();
  if (!signup.ok) {
    const err = new Error(signup.reason);
    err.code = "fl/signup-window";
    throw err;
  }
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  try {
    await syncLedgerForUser(cred.user, { isNew: true });
  } catch (err) {
    console.error("[Fat Loss auth] ledger sync failed", err);
  }
  return cred.user;
}

export async function signIn(email, password) {
  if (!auth) throw new Error("Account sync is not configured yet.");
  const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
  try {
    await syncLedgerForUser(cred.user);
  } catch (err) {
    console.error("[Fat Loss auth] ledger sync failed", err);
  }
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
