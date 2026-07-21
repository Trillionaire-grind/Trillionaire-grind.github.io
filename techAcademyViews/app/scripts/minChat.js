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

const TIER_RANK = {
  free: 0,
  guide: 1,
  vip: 2,
};

/**
 * Default rooms:
 * - general — every signed-in member
 * - help-desk / announcements — NO B.S. Guide or higher
 * - vip — VIP Experience only
 */
const DEFAULT_CHATROOMS = [
  {
    id: "general",
    name: "General Chat",
    minTier: "free",
    vip: false,
  },
  {
    id: "help-desk",
    name: "I.T. Help Desk",
    minTier: "guide",
    vip: false,
  },
  {
    id: "announcements",
    name: "Announcements",
    minTier: "guide",
    vip: false,
  },
  {
    id: "vip",
    name: "VIP Mastermind",
    minTier: "vip",
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

function inferMinTier(roomId, data) {
  if (data && typeof data.minTier === "string" && TIER_RANK[data.minTier] != null) {
    return data.minTier;
  }
  if (data && data.vip) return "vip";
  const seeded = DEFAULT_CHATROOMS.find((room) => room.id === roomId);
  if (seeded) return seeded.minTier;
  // Custom / unknown rooms require Guide or higher.
  return "guide";
}

function normalizeRoom(docSnap) {
  const data = docSnap.data();
  const minTier = inferMinTier(docSnap.id, data);
  return {
    id: docSnap.id,
    name: data.name || "Chat",
    preview: normalizePreview(data.preview),
    vip: Boolean(data.vip) || minTier === "vip",
    minTier,
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

function currentRank() {
  if (window.MIN_AUTH && window.MIN_AUTH.getSubscriptionRank) {
    return window.MIN_AUTH.getSubscriptionRank() || 0;
  }
  return 0;
}

function canAccessChatFirestore() {
  if (!(window.MIN_AUTH && window.MIN_AUTH.isSignedIn && window.MIN_AUTH.isSignedIn())) {
    return false;
  }
  return true;
}

/** True if the signed-in member meets a room's minimum tier (or is admin). */
export function canAccessRoom(room) {
  if (!room) return false;
  if (!(window.MIN_AUTH && window.MIN_AUTH.isSignedIn && window.MIN_AUTH.isSignedIn())) {
    return false;
  }
  if (window.MIN_AUTH.isAdmin && window.MIN_AUTH.isAdmin()) return true;

  const minTier = room.minTier || inferMinTier(room.id, room);
  const need = TIER_RANK[minTier] != null ? TIER_RANK[minTier] : TIER_RANK.guide;
  return currentRank() >= need;
}

export function getDefaultChatrooms() {
  return DEFAULT_CHATROOMS.slice();
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
  if (!canAccessChatFirestore()) return;

  await Promise.all(
    DEFAULT_CHATROOMS.map(async (room) => {
      // Only seed rooms this member can use (avoids free members writing VIP docs).
      if (!canAccessRoom(room)) return;

      const roomRef = doc(db, CHATROOMS_COLLECTION, room.id);
      const roomSnap = await getDoc(roomRef);
      if (roomSnap.exists()) {
        const existing = roomSnap.data() || {};
        if (!existing.minTier) {
          await updateDoc(roomRef, {
            minTier: room.minTier,
            vip: Boolean(room.vip),
          }).catch(() => {});
        }
        return;
      }

      await setDoc(roomRef, {
        name: room.name,
        vip: Boolean(room.vip),
        minTier: room.minTier,
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
  if (!canAccessChatFirestore()) return;
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
    minTier: staticRoom ? staticRoom.minTier : "guide",
    preview: formatPreview(previewText),
    lastMessageAt: serverTimestamp(),
    createdAt: serverTimestamp(),
  });
}

export async function sendMessage(roomId, text) {
  if (!db) throw new Error("Chat is not connected yet. Check your internet and try again.");

  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  const profile = window.MIN_AUTH && window.MIN_AUTH.getCurrentProfile();
  if (!user) throw new Error("Please sign in to send messages.");

  const trimmed = String(text || "").trim();
  if (!trimmed) throw new Error("Type a message first, then tap Send.");

  const room =
    getChatRoom(roomId) ||
    DEFAULT_CHATROOMS.find((entry) => entry.id === roomId) ||
    { id: roomId, minTier: "guide", vip: false };

  if (!canAccessRoom(room)) {
    if (room.vip || room.minTier === "vip") {
      throw new Error("The VIP Mastermind chat is for VIP Experience members only.");
    }
    if (room.minTier === "guide") {
      throw new Error("The NO B.S. Guide (or VIP) is needed to use this chatroom.");
    }
    throw new Error("You do not have access to this chatroom.");
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
