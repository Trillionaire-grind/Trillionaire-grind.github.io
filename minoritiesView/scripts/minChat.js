import {
  addDoc,
  collection,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { initMinFirebase } from "./minFirebase.js";

const CHATROOMS_COLLECTION = "chatrooms";

const DEFAULT_CHATROOMS = [
  {
    id: "general",
    name: "Member Chat",
    vip: false,
  },
  {
    id: "announcements",
    name: "Announcements",
    vip: false,
  },
  {
    id: "vlog-talk",
    name: "Vlog Talk",
    vip: false,
  },
  {
    id: "vip",
    name: "Owner Mastermind",
    vip: true,
  },
];

/** Legacy seed copy — hide so list rows don't flash fake previews. */
const LEGACY_PREVIEW_COPY = new Set([
  "Community lounge — no messages yet",
  "Drops and news — no messages yet",
  "Episode chat — no messages yet",
  "Owner members only — no messages yet",
  "No messages yet",
]);

let db = null;
let roomsCache = [];
const messagesCache = new Map();
const listeners = new Set();

let roomsUnsub = null;
let messagesUnsub = null;
let activeRoomId = null;
let listenersStarted = false;
let roomsLoaded = false;
const messagesLoadedRooms = new Set();

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("MIN_CHAT listener error", err);
    }
  });
}

function formatPreview(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  return trimmed.length > 80 ? trimmed.slice(0, 77) + "…" : trimmed;
}

function normalizePreview(preview) {
  const trimmed = String(preview || "").trim();
  if (!trimmed || LEGACY_PREVIEW_COPY.has(trimmed)) return "";
  return trimmed.length > 80 ? trimmed.slice(0, 77) + "…" : trimmed;
}

function normalizeRoom(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "Chat",
    preview: normalizePreview(data.preview),
    vip: Boolean(data.vip),
    _firestore: true,
  };
}

function normalizeMessage(docSnap, currentUid) {
  const data = docSnap.data();
  const authorUid = data.authorUid || "";
  return {
    id: docSnap.id,
    authorUid,
    authorName: data.authorName || "Member",
    text: data.text || "",
    mine: Boolean(currentUid && authorUid === currentUid),
    _firestore: true,
  };
}

function currentUid() {
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  return user ? user.uid : "";
}

export function onMinChatChange(fn) {
  listeners.add(fn);
  return function unsubscribe() {
    listeners.delete(fn);
  };
}

export function isChatReady() {
  return listenersStarted && roomsLoaded;
}

export function isRoomMessagesLoaded(roomId) {
  return Boolean(roomId && messagesLoadedRooms.has(roomId));
}

export async function initMinChat() {
  const firebase = initMinFirebase();
  if (!firebase) return false;
  db = firebase.db;
  return true;
}

export async function ensureDefaultChatrooms() {
  if (!db) return;
  if (!(window.MIN_AUTH && window.MIN_AUTH.isSignedIn && window.MIN_AUTH.isSignedIn())) return;
  const canSeed =
    (window.MIN_AUTH && window.MIN_AUTH.hasBenchAccess && window.MIN_AUTH.hasBenchAccess()) ||
    (window.MIN_AUTH && window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin());
  if (!canSeed) return;

  await Promise.all(
    DEFAULT_CHATROOMS.map(async (room) => {
      const roomRef = doc(db, CHATROOMS_COLLECTION, room.id);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) return;

      await setDoc(roomRef, {
        name: room.name,
        vip: Boolean(room.vip),
        preview: "",
        lastMessageAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    }),
  );

  notify();
}

export function startChatListeners() {
  if (!db || listenersStarted) return;
  if (!(window.MIN_AUTH && window.MIN_AUTH.isSignedIn && window.MIN_AUTH.isSignedIn())) return;

  ensureDefaultChatrooms().catch((err) => {
    console.warn("MIN_CHAT ensureDefaultChatrooms failed", err);
  });

  roomsUnsub = onSnapshot(
    query(collection(db, CHATROOMS_COLLECTION), orderBy("lastMessageAt", "desc"), limit(30)),
    (snap) => {
      roomsCache = snap.docs.map(normalizeRoom);
      roomsLoaded = true;
      notify();
    },
    (err) => {
      console.warn("MIN_CHAT rooms listener failed", err);
    },
  );

  listenersStarted = true;
}

export function stopChatListeners() {
  if (roomsUnsub) {
    roomsUnsub();
    roomsUnsub = null;
  }
  stopWatchingRoom();
  roomsCache = [];
  listenersStarted = false;
  roomsLoaded = false;
  messagesLoadedRooms.clear();
}

export function getChats() {
  return roomsCache.slice();
}

export function getChatRoom(roomId) {
  return getChats().find((room) => room.id === roomId) || null;
}

export function getMessages(roomId) {
  if (messagesCache.has(roomId)) return messagesCache.get(roomId);
  return [];
}

export function watchRoom(roomId) {
  if (!roomId) {
    stopWatchingRoom();
    return;
  }

  if (activeRoomId === roomId && messagesUnsub) return;

  stopWatchingRoom();
  activeRoomId = roomId;
  messagesLoadedRooms.delete(roomId);

  if (!db) {
    messagesCache.set(roomId, getMessages(roomId));
    messagesLoadedRooms.add(roomId);
    notify();
    return;
  }

  messagesUnsub = onSnapshot(
    query(
      collection(db, CHATROOMS_COLLECTION, roomId, "messages"),
      orderBy("createdAt", "asc"),
      limit(200),
    ),
    (snap) => {
      const uid = currentUid();
      messagesCache.set(roomId, snap.docs.map((docSnap) => normalizeMessage(docSnap, uid)));
      messagesLoadedRooms.add(roomId);
      notify();
    },
    (err) => {
      console.warn("MIN_CHAT messages listener failed", err);
      messagesCache.set(roomId, getMessages(roomId));
      messagesLoadedRooms.add(roomId);
      notify();
    },
  );
}

export function stopWatchingRoom() {
  if (messagesUnsub) {
    messagesUnsub();
    messagesUnsub = null;
  }
  if (activeRoomId) {
    messagesLoadedRooms.delete(activeRoomId);
  }
  activeRoomId = null;
}

async function ensureRoom(roomId, previewText) {
  const roomRef = doc(db, CHATROOMS_COLLECTION, roomId);
  const roomSnap = await getDoc(roomRef);

  if (roomSnap.exists()) {
    await updateDoc(roomRef, {
      preview: formatPreview(previewText),
      lastMessageAt: serverTimestamp(),
    });
    return;
  }

  const staticRoom = DEFAULT_CHATROOMS.find((chat) => chat.id === roomId);
  await setDoc(roomRef, {
    name: staticRoom ? staticRoom.name : roomId,
    vip: staticRoom ? Boolean(staticRoom.vip) : false,
    preview: formatPreview(previewText),
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function sendMessage(roomId, text) {
  if (!db) throw new Error("Chat is not connected yet.");

  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  const profile = window.MIN_AUTH && window.MIN_AUTH.getCurrentProfile();
  if (!user) throw new Error("Sign in to send messages.");

  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("Write a message first.");

  const room = getChatRoom(roomId);
  if (room && room.vip) {
    if (!(window.MIN_AUTH && window.MIN_AUTH.hasOwnerAccess && window.MIN_AUTH.hasOwnerAccess())) {
      throw new Error("Upgrade to Owner to access the mastermind chat.");
    }
  } else if (!(window.MIN_AUTH && window.MIN_AUTH.hasChatAccess && window.MIN_AUTH.hasChatAccess())) {
    throw new Error("Upgrade to Bench Player to access member chat.");
  }

  const authorName =
    (profile && (profile.displayName || profile.username)) || user.email || "Member";

  await ensureRoom(roomId, trimmed);

  await addDoc(collection(db, CHATROOMS_COLLECTION, roomId, "messages"), {
    authorUid: user.uid,
    authorName,
    text: trimmed,
    createdAt: serverTimestamp(),
  });
}
