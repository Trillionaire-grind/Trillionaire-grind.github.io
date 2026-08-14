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
import { getLoginAuthReady, getLoginDb, getLoginStorage } from "./loginFirebase.js";
import {
  DEFAULT_MEMBER_FIELDS,
  MEMBERS_COLLECTION,
  normalizeMember,
} from "./loginSchema.js";

let auth = null;
let db = null;
let storage = null;
let currentUser = null;
let currentProfile = null;
let authReady = false;
const listeners = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(currentUser, currentProfile);
    } catch (err) {
      console.error("LOGIN_AUTH listener error", err);
    }
  });
}

async function loadProfile(uid) {
  if (!db) return null;
  const snap = await getDoc(doc(db, MEMBERS_COLLECTION, uid));
  if (!snap.exists()) return null;
  return normalizeMember(uid, snap.data());
}

async function applyAuthState(user) {
  currentUser = user;
  if (user) {
    try {
      currentProfile = await loadProfile(user.uid);
      if (!currentProfile) {
        currentProfile = normalizeMember(user.uid, {
          email: user.email || "",
          name: user.displayName || "",
          ...DEFAULT_MEMBER_FIELDS,
        });
      }
    } catch (err) {
      console.error("LOGIN_AUTH profile load failed", err);
      currentProfile = null;
    }
  } else {
    currentProfile = null;
  }
  authReady = true;
  notify();
}

export async function initLoginAuth() {
  auth = await getLoginAuthReady();
  if (!auth) return false;
  db = getLoginDb();
  storage = getLoginStorage();
  onAuthStateChanged(auth, applyAuthState);
  return true;
}

export function onLoginAuthChange(fn) {
  listeners.add(fn);
  fn(currentUser, currentProfile);
  return () => listeners.delete(fn);
}

export function waitForLoginAuthReady() {
  return new Promise((resolve) => {
    if (authReady) {
      resolve({ user: currentUser, profile: currentProfile });
      return;
    }
    const unsub = onLoginAuthChange((user, profile) => {
      if (authReady) {
        unsub();
        resolve({ user, profile });
      }
    });
  });
}

export function getLoginUser() {
  return currentUser;
}

export function getLoginProfile() {
  return currentProfile;
}

function authErrorMessage(error) {
  const code = error?.code || "";
  if (code === "auth/email-already-in-use") return "That email is already registered.";
  if (code === "auth/invalid-email") return "Enter a valid email address.";
  if (code === "auth/weak-password") return "Password must be at least 6 characters.";
  if (code === "auth/user-not-found" || code === "auth/wrong-password" || code === "auth/invalid-credential") {
    return "Email or password is incorrect.";
  }
  if (code === "auth/too-many-requests") return "Too many attempts. Wait a minute and try again.";
  return error?.message || "Something went wrong. Try again.";
}

export async function loginAccount(email, password) {
  if (!auth) throw new Error("Firebase is not configured.");
  const trimmedEmail = String(email || "").trim();
  const trimmedPassword = String(password || "");
  if (!trimmedEmail || !trimmedPassword) throw new Error("Email and password are required.");
  try {
    await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
    return currentProfile;
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function registerAccount(fields) {
  if (!auth || !db) throw new Error("Firebase is not configured.");

  const name = String(fields.name || "").trim();
  const phone = String(fields.phone || "").trim();
  const preferredName = String(fields.preferredName || "").trim();
  const businessName = String(fields.businessName || "").trim();
  const helpDescription = String(fields.helpDescription || "").trim();
  const email = String(fields.email || "").trim();
  const password = String(fields.password || "");

  if (!name) throw new Error("Name is required.");
  if (!phone) throw new Error("Phone is required.");
  if (!businessName) throw new Error("Business name is required.");
  if (!helpDescription) throw new Error("Tell us who and how you help.");
  if (!email) throw new Error("Email is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, email, password);
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }

  const profile = normalizeMember(cred.user.uid, {
    name,
    phone,
    preferredName,
    businessName,
    helpDescription,
    email,
    ...DEFAULT_MEMBER_FIELDS,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  await setDoc(doc(db, MEMBERS_COLLECTION, cred.user.uid), profile);
  currentProfile = profile;
  notify();
  return profile;
}

export async function saveMemberProfile(updates) {
  if (!auth?.currentUser || !db) throw new Error("Sign in to update your profile.");
  const uid = auth.currentUser.uid;
  const existing = currentProfile || normalizeMember(uid, { email: auth.currentUser.email || "" });

  const next = normalizeMember(uid, {
    ...existing,
    name: String(updates.name ?? existing.name).trim(),
    preferredName: String(updates.preferredName ?? existing.preferredName).trim(),
    phone: String(updates.phone ?? existing.phone).trim(),
    businessName: String(updates.businessName ?? existing.businessName).trim(),
    helpDescription: String(updates.helpDescription ?? existing.helpDescription).trim(),
    email: String(updates.email ?? existing.email).trim(),
    photoUrl: String(updates.photoUrl ?? existing.photoUrl).trim(),
    profileOpen: updates.profileOpen ?? existing.profileOpen !== false,
    admin: existing.admin,
    updatedAt: serverTimestamp(),
  });

  if (!next.name) throw new Error("Name is required.");
  if (!next.phone) throw new Error("Phone is required.");
  if (!next.businessName) throw new Error("Business name is required.");
  if (!next.helpDescription) throw new Error("Who and how you help is required.");

  await setDoc(doc(db, MEMBERS_COLLECTION, uid), next, { merge: true });
  currentProfile = next;
  notify();
  return next;
}

export async function uploadProfilePhoto(file) {
  if (!auth?.currentUser || !storage) throw new Error("Sign in to upload a photo.");
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  if (file.size > 4 * 1024 * 1024) throw new Error("Image must be under 4 MB.");

  const uid = auth.currentUser.uid;
  const ext = file.type.includes("png") ? "png" : file.type.includes("webp") ? "webp" : "jpg";
  const storageRef = ref(storage, `networkMembers/${uid}/avatar.${ext}`);
  await uploadBytes(storageRef, file, { contentType: file.type });
  const photoUrl = await getDownloadURL(storageRef);
  return saveMemberProfile({ photoUrl });
}

export async function resetLoginPassword(email) {
  if (!auth) throw new Error("Firebase is not configured.");
  const trimmed = String(email || "").trim();
  if (!trimmed) throw new Error("Enter your email.");
  try {
    await sendPasswordResetEmail(auth, trimmed);
  } catch (error) {
    throw new Error(authErrorMessage(error));
  }
}

export async function logoutAccount() {
  if (!auth) return;
  await signOut(auth);
}
