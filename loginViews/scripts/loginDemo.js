import {
  dateKeyFromDate,
  displayName,
  normalizeMember,
} from "./loginSchema.js";

const STORAGE_KEY = "network-login-demo-v1";

const SEED_MEMBERS = [
  {
    uid: "demo-seed-1",
    name: "Maria Lopez",
    preferredName: "Maria",
    phone: "(305) 555-0142",
    businessName: "Lopez Legal Group",
    helpDescription: "Small businesses with contracts, leases, and compliance.",
    email: "maria@example.com",
    photoUrl: "",
    profileOpen: true,
    admin: false,
  },
  {
    uid: "demo-seed-2",
    name: "James Chen",
    preferredName: "James",
    phone: "(786) 555-0198",
    businessName: "Chen Growth Studio",
    helpDescription: "Local brands that need clearer offers and ad creative.",
    email: "james@example.com",
    photoUrl: "",
    profileOpen: true,
    admin: false,
  },
  {
    uid: "demo-admin",
    name: "Kepler Siguineau",
    preferredName: "Kepler",
    phone: "(786) 555-0100",
    businessName: "Build With Kepler",
    helpDescription: "Founders shipping web products and funnels that sell.",
    email: "admin@demo.com",
    photoUrl: "",
    profileOpen: true,
    admin: true,
  },
];

function readStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    /* fresh demo */
  }
  const members = {};
  SEED_MEMBERS.forEach((m) => {
    members[m.uid] = normalizeMember(m.uid, m);
  });
  return { sessionUid: null, members, checkins: [], passwords: { "admin@demo.com": "demo123" } };
}

function writeStore(store) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
}

let store = readStore();
let currentUser = null;
let currentProfile = null;
let authReady = false;
const listeners = new Set();

function uid() {
  return "demo-" + Math.random().toString(36).slice(2, 10);
}

function notify() {
  listeners.forEach((fn) => {
    try {
      fn(currentUser, currentProfile);
    } catch (err) {
      console.error("LOGIN_DEMO listener error", err);
    }
  });
}

function applySession(uidValue) {
  store.sessionUid = uidValue || null;
  writeStore(store);
  if (!uidValue) {
    currentUser = null;
    currentProfile = null;
  } else {
    currentUser = { uid: uidValue, email: store.members[uidValue]?.email || "" };
    currentProfile = normalizeMember(uidValue, store.members[uidValue]);
  }
  authReady = true;
  notify();
}

export function initLoginDemo() {
  store = readStore();
  if (store.sessionUid && store.members[store.sessionUid]) {
    applySession(store.sessionUid);
  } else {
    authReady = true;
    notify();
  }
  return true;
}

export function onLoginAuthChange(fn) {
  listeners.add(fn);
  fn(currentUser, currentProfile);
  return () => listeners.delete(fn);
}

export function waitForLoginAuthReady() {
  return Promise.resolve({ user: currentUser, profile: currentProfile });
}

export function getLoginUser() {
  return currentUser;
}

export function getLoginProfile() {
  return currentProfile;
}

export async function loginAccount(email, password) {
  const trimmedEmail = String(email || "").trim().toLowerCase();
  const trimmedPassword = String(password || "");
  if (!trimmedEmail || !trimmedPassword) throw new Error("Email and password are required.");

  const memberEntry = Object.entries(store.members).find(
    ([, m]) => String(m.email || "").trim().toLowerCase() === trimmedEmail,
  );
  if (!memberEntry) throw new Error("No demo account for that email — register first.");

  const [memberUid] = memberEntry;
  const saved = store.passwords?.[trimmedEmail];
  if (saved && saved !== trimmedPassword) throw new Error("Email or password is incorrect.");

  applySession(memberUid);
  return currentProfile;
}

export async function registerAccount(fields) {
  const email = String(fields.email || "").trim().toLowerCase();
  const password = String(fields.password || "");
  const name = String(fields.name || "").trim();
  const phone = String(fields.phone || "").trim();
  const preferredName = String(fields.preferredName || "").trim();
  const businessName = String(fields.businessName || "").trim();
  const helpDescription = String(fields.helpDescription || "").trim();

  if (!name) throw new Error("Name is required.");
  if (!phone) throw new Error("Phone is required.");
  if (!businessName) throw new Error("Business name is required.");
  if (!helpDescription) throw new Error("Tell us who and how you help.");
  if (!email) throw new Error("Email is required.");
  if (password.length < 6) throw new Error("Password must be at least 6 characters.");

  const exists = Object.values(store.members).some(
    (m) => String(m.email || "").trim().toLowerCase() === email,
  );
  if (exists) throw new Error("That email is already registered.");

  const memberUid = uid();
  store.members[memberUid] = normalizeMember(memberUid, {
    name,
    phone,
    preferredName,
    businessName,
    helpDescription,
    email,
    admin: Object.keys(store.members).length === 0,
  });
  store.passwords = store.passwords || {};
  store.passwords[email] = password;
  writeStore(store);
  applySession(memberUid);
  return currentProfile;
}

export async function saveMemberProfile(updates) {
  if (!currentUser) throw new Error("Sign in to update your profile.");
  const uidValue = currentUser.uid;
  const existing = store.members[uidValue] || normalizeMember(uidValue, {});

  const next = normalizeMember(uidValue, {
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
  });

  if (!next.name) throw new Error("Name is required.");
  if (!next.phone) throw new Error("Phone is required.");
  if (!next.businessName) throw new Error("Business name is required.");
  if (!next.helpDescription) throw new Error("Who and how you help is required.");

  store.members[uidValue] = next;
  writeStore(store);
  currentProfile = next;
  notify();
  return next;
}

export async function uploadProfilePhoto(file) {
  if (!file || !String(file.type || "").startsWith("image/")) {
    throw new Error("Choose a JPEG, PNG, WebP, or GIF image.");
  }
  const photoUrl = URL.createObjectURL(file);
  return saveMemberProfile({ photoUrl });
}

export async function resetLoginPassword() {
  throw new Error("Demo mode — password reset is not wired yet.");
}

export async function logoutAccount() {
  applySession(null);
}

export async function demoQuickLogin(kind) {
  if (kind === "admin") {
    await loginAccount("admin@demo.com", "demo123");
    return;
  }
  if (kind === "guest") {
    await registerAccount({
      name: "Demo Guest",
      preferredName: "Guest",
      phone: "(000) 555-0000",
      businessName: "Guest Business",
      helpDescription: "Previewing the networking app UX.",
      email: `guest-${Date.now()}@demo.local`,
      password: "demo123",
    });
  }
}

export async function demoRecordCheckIn() {
  if (!currentUser || !currentProfile) throw new Error("Sign in to check in.");
  const now = new Date();
  store.checkins.unshift({
    id: "ci-" + Date.now(),
    uid: currentUser.uid,
    memberName: displayName(currentProfile),
    businessName: currentProfile.businessName || "",
    checkedInAt: now.toISOString(),
    dateKey: dateKeyFromDate(now),
  });
  writeStore(store);
}

export async function demoLoadMembers() {
  return Object.values(store.members)
    .map((m) => normalizeMember(m.uid, m))
    .sort((a, b) => displayName(a).localeCompare(displayName(b)));
}

export async function demoLoadMyCheckins() {
  if (!currentUser) return [];
  return store.checkins.filter((c) => c.uid === currentUser.uid);
}

export async function demoLoadAdminData() {
  const members = await demoLoadMembers();
  const today = dateKeyFromDate(new Date());
  const todayCheckins = store.checkins.filter((c) => c.dateKey === today);
  const checkedUids = new Set(todayCheckins.map((c) => c.uid));
  const neverChecked = members.filter((m) => !checkedUids.has(m.uid));
  return { members, todayCheckins, neverChecked };
}

export function demoResetAll() {
  localStorage.removeItem(STORAGE_KEY);
  store = readStore();
  applySession(null);
}
