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
import {
  PROFILE_AVATAR_MAX_BYTES,
  compressProfileAvatar,
} from "./minImageCompress.js";
import {
  DEFAULT_USER_FIELDS,
  SUBSCRIPTION_IDS,
  TEAM_ROLES,
  adminFlagFromTeamRole,
  canCreateAsTeam,
  canModerate,
  normalizeUserProfile,
  teamRoleLabel,
  tierFromSubscriptionId,
  isTeamAuthoredPost,
} from "./minUserSchema.js";

const USERS_COLLECTION = "users";

export { PROFILE_AVATAR_MAX_BYTES };

export function validateProfileAvatarFile(file) {
  if (!file) return null;
  if (!String(file.type || "").startsWith("image/")) {
    return "Choose a JPEG, PNG, WebP, or GIF image.";
  }
  return null;
}

export async function prepareProfileAvatar(file) {
  return compressProfileAvatar(file);
}

const SUBSCRIPTION_TIERS = {
  free: "free",
  guide: "guide",
  vip: "vip",
};

const SUBSCRIPTION_RANK = {
  free: 0,
  guide: 1,
  vip: 2,
};

const CONTENT_ACCESS_RANK = {
  free: 0,
  guide: 1,
  vip: 2,
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
      currentProfile = normalizeUserProfile(await loadProfile(user.uid));
      if (!currentProfile) {
        currentProfile = normalizeUserProfile({
          id: user.uid,
          email: user.email || "",
          displayName: user.displayName || "",
          username: "",
          bio: "",
          avatarUrl: "",
          ...DEFAULT_USER_FIELDS,
        });
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
  if (code === "storage/unauthorized") {
    return "Storage permission denied. Check file size and try again.";
  }
  if (code === "storage/unauthenticated") return "Sign in again to upload images.";
  if (code === "storage/canceled") return "Upload canceled.";
  if (code.startsWith("storage/")) {
    return "Image upload failed. Confirm Firebase Storage is enabled for this project.";
  }
  return (error && error.message) || "Something went wrong. Try again.";
}

export function tierFromSubscription(subscriptionId) {
  return tierFromSubscriptionId(subscriptionId);
}

export function getTeamRole() {
  if (!currentProfile) return "member";
  return currentProfile.teamRole || "member";
}

export function isAdmin() {
  if (!currentProfile) return false;
  return currentProfile.admin === true || currentProfile.teamRole === "admin";
}

export function isModerator() {
  return canModerate(getTeamRole());
}

export function isCreator() {
  return canCreateAsTeam(getTeamRole());
}

export function getTeamRoleLabel() {
  return teamRoleLabel(getTeamRole());
}

export { isTeamAuthoredPost };

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
  if (!currentProfile) return "free";
  return currentProfile.subscriptionId || "free";
}

export function getSubscriptionRank() {
  return SUBSCRIPTION_RANK[getSubscriptionId()] ?? 0;
}

/** Guide or higher (kept name for module compatibility). */
export function hasBenchAccess() {
  return getSubscriptionRank() >= SUBSCRIPTION_RANK.guide;
}

/** VIP Experience (kept name for module compatibility). */
export function hasStarterAccess() {
  return getSubscriptionRank() >= SUBSCRIPTION_RANK.vip;
}

export function hasOwnerAccess() {
  return getSubscriptionId() === "vip";
}

/**
 * Any signed-in member can open Chat and use the General chatroom.
 * Guide+ rooms and VIP Mastermind are gated separately (hasBenchAccess / hasOwnerAccess).
 */
export function hasChatAccess() {
  return isSignedIn();
}

/** Guide members and up can comment on lectures. */
export function hasCommentAccess() {
  return hasBenchAccess();
}

/** Live classes are VIP Experience only. */
export function hasTrainingAccess() {
  return hasStarterAccess();
}

export function canAccessContentLevel(level) {
  const required = CONTENT_ACCESS_RANK[level] ?? 0;
  return getSubscriptionRank() >= required;
}

export function isSignedIn() {
  return Boolean(currentUser);
}

async function loadProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, USERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return normalizeUserProfile({ id: snap.id, ...snap.data() });
}

async function ensureFirebase() {
  const firebase = initMinFirebase();
  if (!firebase) {
    throw new Error("Firebase is not configured for the Tech Academy app.");
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
  currentProfile = normalizeUserProfile(await loadProfile(currentUser.uid));
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
    const profile = normalizeUserProfile({
      app: DEFAULT_USER_FIELDS.app,
      email,
      displayName,
      username,
      bio,
      avatarUrl: "",
      teamRole: DEFAULT_USER_FIELDS.teamRole,
      tier: DEFAULT_USER_FIELDS.tier,
      subscriptionId: DEFAULT_USER_FIELDS.subscriptionId,
      subscriptionStatus: DEFAULT_USER_FIELDS.subscriptionStatus,
      admin: DEFAULT_USER_FIELDS.admin,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    try {
      await setDoc(doc(db, USERS_COLLECTION, uid), profile);
    } catch (error) {
      console.error("MIN_AUTH profile save failed", error);
      throw new Error(
        "Your account was created, but the profile could not be saved. Check Firestore rules, then try signing in.",
      );
    }

    if (fields.avatarFile) {
      try {
        const avatarUrl = await uploadProfileAvatarForUser(fields.avatarFile, uid);
        await setDoc(
          doc(db, USERS_COLLECTION, uid),
          { avatarUrl, updatedAt: serverTimestamp() },
          { merge: true },
        );
        profile.avatarUrl = avatarUrl;
      } catch (error) {
        console.warn("MIN_AUTH register avatar upload failed (non-fatal)", error);
      }
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

async function uploadProfileAvatarForUser(file, userId) {
  if (!storage || !userId) {
    throw new Error("Sign in to update your profile picture.");
  }

  const validationError = validateProfileAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const readyFile = await compressProfileAvatar(file);
  const storageRef = ref(storage, `users/${userId}/avatar.jpg`);

  try {
    await uploadBytes(storageRef, readyFile, { contentType: "image/jpeg" });
    return getDownloadURL(storageRef);
  } catch (error) {
    const code = error && error.code ? error.code : "";
    const message = error && error.message ? String(error.message) : "";
    if (
      code.startsWith("storage/") ||
      message.includes("CORS") ||
      message.includes("ERR_FAILED")
    ) {
      throw new Error(
        "Profile picture upload failed. Enable Firebase Storage for tech-mastery-academy, then try again.",
      );
    }
    throw new Error(authErrorMessage(error));
  }
}

async function uploadProfileAvatar(file) {
  if (!currentUser) {
    throw new Error("Sign in to update your profile picture.");
  }
  return uploadProfileAvatarForUser(file, currentUser.uid);
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

/**
 * Demo / free-plan path: writes subscription fields on the user doc without Stripe.
 * Paid live checkout uses startSubscriptionCheckout → Cloud Function + webhook.
 */
export async function selectSubscriptionPlan(tierId) {
  await ensureFirebase();
  if (!currentUser) throw new Error("Sign in to choose a subscription.");
  if (!SUBSCRIPTION_IDS.includes(tierId)) throw new Error("Unknown plan.");
  if (tierId !== "free") {
    throw new Error(
      "The Guide and VIP Experience are enrolled by phone — call (786) 309-8015.",
    );
  }

  const tier = tierFromSubscriptionId(tierId);
  const subscriptionStatus = tierId === "free" ? "none" : "active";

  const updates = {
    subscriptionId: tierId,
    tier,
    subscriptionStatus,
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, currentUser.uid), updates, { merge: true });
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }

  await refreshProfile();
  return currentProfile;
}

export async function assignTeamRole(targetUid, teamRole) {
  await ensureFirebase();
  if (!currentUser) throw new Error("Sign in as an admin.");
  if (!isAdmin()) throw new Error("Only admins can assign team roles.");
  if (!targetUid || typeof targetUid !== "string") throw new Error("Enter a user ID.");
  if (!TEAM_ROLES.includes(teamRole)) throw new Error("Invalid team role.");

  const updates = {
    teamRole,
    admin: adminFlagFromTeamRole(teamRole),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(doc(db, USERS_COLLECTION, targetUid), updates, { merge: true });
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }

  return updates;
}

export async function startSubscriptionCheckout(tierId) {
  if (!currentUser) throw new Error("Sign in to choose a subscription.");
  if (tierId === "free") {
    return selectSubscriptionPlan("free");
  }
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
      successPath: "/techApp.html",
      cancelPath: "/techApp.html",
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
    if (payload.error === "free_tier_no_checkout") {
      return selectSubscriptionPlan("free");
    }
    throw new Error(payload.error || payload.message || "Could not start checkout.");
  }
  if (!payload.url) throw new Error("Checkout URL missing from server.");
  window.location.assign(payload.url);
}

export async function handleCheckoutReturn() {
  const params = new URLSearchParams(window.location.search);
  const checkout = params.get("checkout");
  if (checkout !== "success" && checkout !== "cancelled") return false;
  if (checkout === "success") {
    await refreshProfile();
  }
  window.history.replaceState({}, "", window.location.pathname + "#subscribe");
  return checkout === "success";
}
