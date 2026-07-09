import {
  createUserWithEmailAndPassword,
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
import {
  getDownloadURL,
  ref,
  uploadBytes,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-storage.js";
import { getMinAuthReady, initMinFirebase } from "./minFirebase.js";
import { getMinCheckoutApiUrl } from "./minFirebaseConfig.js";

const USERS_COLLECTION = "users";

const SUBSCRIPTION_TIERS = {
  waterboy: "free",
  bench: "member",
  starter: "member",
  vip: "vip",
};

let auth = null;
let db = null;
let storage = null;
let currentUser = null;
let currentProfile = null;
let authReady = false;
let registrationInProgress = false;
const listeners = new Set();

async function applyAuthState(user) {
  currentUser = user;
  if (user) {
    try {
      currentProfile = await loadProfile(user.uid);
      if (!currentProfile) {
        currentProfile = {
          id: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          username: "",
          bio: "",
          tier: "free",
          subscriptionId: "waterboy",
        };
      }
    } catch (err) {
      console.error("MIN_AUTH profile load failed", err);
      currentProfile = null;
    }
  } else {
    currentProfile = null;
  }
  authReady = true;
  notify();
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(currentUser, currentProfile);
    } catch (err) {
      console.error("MIN_AUTH listener error", err);
    }
  });
}

function authErrorMessage(error) {
  const code = error && error.code ? error.code : "";
  if (code === "auth/email-already-in-use") return "That email is already registered.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password") {
    return "Incorrect email or password.";
  }
  if (code === "auth/user-not-found") return "No account found with that email.";
  if (code === "auth/operation-not-allowed") {
    return "Email/password sign-in is not enabled yet in Firebase.";
  }
  if (code === "auth/network-request-failed") return "Network error. Check your connection and try again.";
  if (code === "permission-denied") return "Firestore permission denied. Check your database rules.";
  return (error && error.message) || "Something went wrong. Try again.";
}

export function tierFromSubscription(subscriptionId) {
  return SUBSCRIPTION_TIERS[subscriptionId] || "free";
}

export function onMinAuthChange(fn) {
  listeners.add(fn);
  fn(currentUser, currentProfile);
  return function unsubscribe() {
    listeners.delete(fn);
  };
}

export function isRegistering() {
  return registrationInProgress;
}

export function waitForAuthReady(timeoutMs) {
  if (authReady) return Promise.resolve();
  const limit = typeof timeoutMs === "number" ? timeoutMs : 10000;
  return new Promise((resolve) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      authReady = true;
      resolve();
    }, limit);

    const unsubscribe = onMinAuthChange(() => {
      if (!authReady || settled) return;
      settled = true;
      clearTimeout(timer);
      unsubscribe();
      resolve();
    });
  });
}

export function isAuthReady() {
  return authReady;
}

export function getCurrentUser() {
  return currentUser;
}

export function getCurrentProfile() {
  return currentProfile;
}

export function getTier() {
  if (!currentProfile) return "free";
  return currentProfile.tier || tierFromSubscription(currentProfile.subscriptionId) || "free";
}

export function getSubscriptionId() {
  if (!currentProfile) return "waterboy";
  return currentProfile.subscriptionId || "waterboy";
}

export function isSignedIn() {
  return Boolean(currentUser);
}

async function loadProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

async function ensureFirebase() {
  const firebase = initMinFirebase();
  if (!firebase) {
    throw new Error("Firebase is not configured for The Minorities app.");
  }
  auth = firebase.auth;
  db = firebase.db;
  storage = firebase.storage;
  return firebase;
}

export async function initMinAuth() {
  await ensureFirebase();
  await getMinAuthReady();

  return new Promise((resolve) => {
    let initialAuthStateHandled = false;

    const timeout = setTimeout(() => {
      if (initialAuthStateHandled) return;
      initialAuthStateHandled = true;
      authReady = true;
      notify();
      resolve({ user: currentUser, profile: currentProfile });
    }, 8000);

    onAuthStateChanged(auth, async (user) => {
      try {
        await applyAuthState(user);
      } catch (err) {
        console.error("MIN_AUTH onAuthStateChanged error", err);
        authReady = true;
        notify();
      }

      if (!initialAuthStateHandled) {
        initialAuthStateHandled = true;
        clearTimeout(timeout);
        resolve({ user: currentUser, profile: currentProfile });
      }
    });
  });
}

export async function refreshProfile() {
  if (!currentUser) return null;
  currentProfile = await loadProfile(currentUser.uid);
  notify();
  return currentProfile;
}

export async function registerAccount(fields) {
  await ensureFirebase();
  registrationInProgress = true;

  try {
    const displayName = String(fields.displayName || "").trim();
    const username = String(fields.username || "").trim();
    const bio = String(fields.bio || "").trim();
    const email = String(fields.email || "").trim();
    const password = String(fields.password || "");

    if (displayName.length < 2) throw new Error("Enter your name.");
    if (username.length < 2) throw new Error("Choose a username.");
    if (!email.includes("@")) throw new Error("Enter a valid email.");
    if (password.length < 6) throw new Error("Password must be at least 6 characters.");

    let credential;
    try {
      credential = await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      throw new Error(authErrorMessage(error));
    }

    const uid = credential.user.uid;
    const profile = {
      app: "minorities",
      email,
      displayName,
      username,
      bio,
      avatarUrl: "",
      tier: "free",
      subscriptionId: "waterboy",
      admin: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    try {
      await setDoc(doc(db, USERS_COLLECTION, uid), profile);
    } catch (error) {
      console.error("MIN_AUTH profile save failed", error);
      throw new Error(
        "Your account was created, but the profile could not be saved. Check Firestore rules, then try signing in.",
      );
    }

    await refreshProfile();
    return { id: uid, ...profile };
  } finally {
    registrationInProgress = false;
  }
}

export async function loginAccount(email, password) {
  await ensureFirebase();
  const trimmedEmail = String(email || "").trim();
  const trimmedPassword = String(password || "");
  if (!trimmedEmail.includes("@")) throw new Error("Enter a valid email.");
  if (!trimmedPassword) throw new Error("Enter your password.");

  try {
    await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    return currentProfile;
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function logoutAccount() {
  await ensureFirebase();
  await signOut(auth);
}

async function uploadProfileAvatar(file) {
  if (!storage || !currentUser) {
    throw new Error("Sign in to update your profile picture.");
  }
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose an image file.");
  }
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("Image must be 5 MB or smaller.");
  }

  const extension = String(file.name || "")
    .split(".")
    .pop()
    .toLowerCase();
  const safeExtension = ["jpg", "jpeg", "png", "webp", "gif"].includes(extension)
    ? extension
    : "jpg";
  const storageRef = ref(storage, `users/${currentUser.uid}/avatar.${safeExtension}`);

  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

export async function updateProfile(fields) {
  await ensureFirebase();
  if (!currentUser) throw new Error("Sign in to update your profile.");

  const displayName = String(fields.displayName || "").trim();
  const username = String(fields.username || "").trim();
  const bio = String(fields.bio || "").trim();

  if (displayName.length < 2) throw new Error("Enter your name.");
  if (username.length < 2) throw new Error("Choose a username.");

  const updates = {
    displayName,
    username,
    bio,
    updatedAt: serverTimestamp(),
  };

  if (fields.avatarFile) {
    updates.avatarUrl = await uploadProfileAvatar(fields.avatarFile);
  }

  try {
    await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), updates, { merge: true });
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }

  await refreshProfile();
  return currentProfile;
}

export async function resetPassword(email) {
  await ensureFirebase();
  const trimmedEmail = String(email || "").trim();
  if (!trimmedEmail.includes("@")) throw new Error("Enter a valid email.");
  try {
    await sendPasswordResetEmail(auth, trimmedEmail);
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function startSubscriptionCheckout(tierId) {
  if (!currentUser) throw new Error("Sign in to choose a subscription.");
  const checkoutUrl = getMinCheckoutApiUrl();
  if (!checkoutUrl) throw new Error("Checkout is not configured yet.");

  const token = await currentUser.getIdToken();
  const response = await fetch(checkoutUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      tierId,
      successPath: "/minorities.html#subscribe",
      cancelPath: "/minorities.html#subscribe",
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (payload.error === "tier_not_configured") {
      throw new Error("This plan is not live yet. Stripe price IDs still need to be configured.");
    }
    if (payload.error === "unauthorized") {
      throw new Error("Sign in again to continue checkout.");
    }
    throw new Error(payload.error || payload.message || "Could not start checkout.");
  }
  if (!payload.url) throw new Error("Checkout URL missing from server.");
  window.location.assign(payload.url);
}

export async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  if (params.get("checkout") !== "success") return false;
  await refreshProfile();
  const hash = window.location.hash || "#subscribe";
  window.history.replaceState({}, "", window.location.pathname + hash);
  return true;
}
