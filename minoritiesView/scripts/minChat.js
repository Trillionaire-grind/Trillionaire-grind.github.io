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

let db = null;
let roomsCache = [];
const messagesCache = new Map();
const listeners = new Set();

let roomsUnsub = null;
let messagesUnsub = null;
let activeRoomId = null;
let listenersStarted = false;

function notify() {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch (err) {
      console.error("MIN_CHAT listener error", err);
    }
  });
}

function staticChats() {
  return (window.MIN_DATA && window.MIN_DATA.chats) || [];
}

function staticMessages() {
  return (window.MIN_DATA && window.MIN_DATA.threadMessages) || {};
}

function formatPreview(text) {
  const trimmed = String(text || "").trim();
  if (!trimmed) return "";
  return trimmed.length > 80 ? trimmed.slice(0, 77) + "…" : trimmed;
}

function normalizeRoom(docSnap) {
  const data = docSnap.data();
  return {
    id: docSnap.id,
    name: data.name || "Chat",
    preview: data.preview || "",
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
  return listenersStarted;
}

export async function initMinChat() {
  const firebase = initMinFirebase();
  if (!firebase) return false;
  db = firebase.db;
  return true;
}

export function startChatListeners() {
  if (!db || listenersStarted) return;
  if (!(window.MIN_AUTH && window.MIN_AUTH.isSignedIn && window.MIN_AUTH.isSignedIn())) return;

  roomsUnsub = onSnapshot(
    query(collection(db, CHATROOMS_COLLECTION), orderBy("lastMessageAt", "desc"), limit(30)),
    (snap) => {
      roomsCache = snap.docs.map(normalizeRoom);
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
}

export function getChats() {
  const seen = new Set(roomsCache.map((room) => room.id));
  const merged = roomsCache.slice();

  staticChats().forEach((chat) => {
    if (!seen.has(chat.id)) {
      merged.push({
        id: chat.id,
        name: chat.name,
        preview: chat.preview || "",
        vip: Boolean(chat.vip),
        _firestore: false,
      });
    }
  });

  return merged;
}

export function getChatRoom(roomId) {
  return getChats().find((room) => room.id === roomId) || null;
}

export function getMessages(roomId) {
  if (messagesCache.has(roomId)) return messagesCache.get(roomId);

  const staticThread = staticMessages()[roomId];
  if (staticThread) {
    const uid = currentUid();
    return staticThread.map((message, index) => ({
      id: "static-" + index,
      text: message.text,
      mine: Boolean(message.mine),
      authorName: message.mine ? "You" : "Member",
      authorUid: message.mine ? uid : "",
      _firestore: false,
    }));
  }

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

  if (!db) {
    messagesCache.set(roomId, getMessages(roomId));
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
      notify();
    },
    (err) => {
      console.warn("MIN_CHAT messages listener failed", err);
      messagesCache.set(roomId, getMessages(roomId));
      notify();
    },
  );
}

export function stopWatchingRoom() {
  if (messagesUnsub) {
    messagesUnsub();
    messagesUnsub = null;
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

  const staticRoom = staticChats().find((chat) => chat.id === roomId);
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
    const tier = window.MIN_AUTH.getTier ? window.MIN_AUTH.getTier() : "free";
    if (tier !== "vip") throw new Error("Upgrade to V.I.P. to access this chat.");
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
