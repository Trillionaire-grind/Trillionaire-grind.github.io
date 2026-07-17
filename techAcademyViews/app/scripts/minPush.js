import { getMessaging, getToken, onMessage, deleteToken, isSupported } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging.js";
import { doc, serverTimestamp, setDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
import { initMinFirebase } from "./minFirebase.js";
import {
  isMinFcmConfigured,
  minFcmVapidKey,
  minFirebaseConfig,
} from "./minFirebaseConfig.js";

const SW_PATH = "firebase-messaging-sw.js";
const ICON_PATH = "techAcademyViews/assets/desk.png";

let messaging = null;
let swRegistration = null;
let currentToken = null;
let foregroundBound = false;

function tokenDocId(token) {
  let hash = 0;
  for (let i = 0; i < token.length; i += 1) {
    hash = (hash << 5) - hash + token.charCodeAt(i);
    hash |= 0;
  }
  return "t_" + Math.abs(hash).toString(36);
}

function canUsePush() {
  return (
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "Notification" in window &&
    isSupported()
  );
}

async function ensureServiceWorker() {
  const registration = await navigator.serviceWorker.register(SW_PATH, { scope: "./" });
  await navigator.serviceWorker.ready;
  swRegistration = registration;
  return registration;
}

function bindForegroundMessages() {
  if (foregroundBound || !messaging) return;
  foregroundBound = true;

  onMessage(messaging, function (payload) {
    const data = payload.data || {};
    const title =
      data.title ||
      (payload.notification && payload.notification.title) ||
      "Tech Academy";
    const body = data.body || (payload.notification && payload.notification.body) || "";

    if (typeof Notification === "undefined" || Notification.permission !== "granted") {
      return;
    }

    try {
      const notification = new Notification(title, {
        body: body,
        icon: ICON_PATH,
        tag: data.tag || "min-fcm-foreground",
      });
      notification.onclick = function () {
        window.focus();
        if (data.url) {
          const url = data.url;
          if (url.indexOf("#") === 0) {
            window.location.hash = url.slice(1);
          } else {
            window.location.assign(url);
          }
        }
        notification.close();
      };
    } catch (err) {
      console.warn("MIN_PUSH foreground notification failed", err);
    }
  });
}

async function saveTokenToFirestore(token) {
  const firebase = initMinFirebase();
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!firebase?.db || !user) return;

  const tier = window.MIN_AUTH.getTier ? window.MIN_AUTH.getTier() : "free";
  const tokenRef = doc(firebase.db, "users", user.uid, "fcmTokens", tokenDocId(token));

  await setDoc(
    tokenRef,
    {
      token: token,
      tier: tier,
      userAgent: navigator.userAgent.slice(0, 200),
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

export function isPushSupported() {
  return canUsePush();
}

export function isPushConfigured() {
  return isMinFcmConfigured();
}

export async function initMinPush() {
  if (!canUsePush() || !isMinFcmConfigured()) return false;

  try {
    const firebase = initMinFirebase();
    if (!firebase?.app) return false;
    const registration = await ensureServiceWorker();
    messaging = getMessaging(firebase.app, { serviceWorkerRegistration: registration });
    bindForegroundMessages();
    return true;
  } catch (err) {
    console.warn("MIN_PUSH init failed", err);
    return false;
  }
}

export async function registerPushToken() {
  if (!canUsePush() || !isMinFcmConfigured()) {
    throw new Error("Push notifications are not configured yet.");
  }

  if (!messaging) {
    await initMinPush();
  }
  if (!messaging) {
    throw new Error("Push messaging is not available.");
  }

  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!user) {
    throw new Error("Sign in to enable push notifications.");
  }

  const registration = swRegistration || (await ensureServiceWorker());

  const token = await getToken(messaging, {
    vapidKey: minFcmVapidKey,
    serviceWorkerRegistration: registration,
  });

  if (!token) {
    throw new Error("Could not get a push token. Try again.");
  }

  currentToken = token;
  await saveTokenToFirestore(token);
  return token;
}

export async function clearPushToken() {
  if (messaging && currentToken) {
    try {
      await deleteToken(messaging);
    } catch (err) {
      console.warn("MIN_PUSH deleteToken failed", err);
    }
  }

  const firebase = initMinFirebase();
  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (firebase?.db && user && currentToken) {
    try {
      await deleteDoc(doc(firebase.db, "users", user.uid, "fcmTokens", tokenDocId(currentToken)));
    } catch (err) {
      console.warn("MIN_PUSH token doc delete failed", err);
    }
  }

  currentToken = null;
}

export async function refreshPushTokenTier() {
  if (!currentToken) return;
  await saveTokenToFirestore(currentToken);
}

/** Re-register FCM token when permission is already granted (e.g. iOS PWA reopen). */
export async function syncPushTokenIfPermitted() {
  if (!canUsePush() || !isMinFcmConfigured()) return false;
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return false;

  const user = window.MIN_AUTH && window.MIN_AUTH.getCurrentUser();
  if (!user) return false;

  if (!messaging) {
    const ok = await initMinPush();
    if (!ok) return false;
  }

  try {
    await registerPushToken();
    return true;
  } catch (err) {
    console.warn("MIN_PUSH syncPushTokenIfPermitted failed", err);
    return false;
  }
}

export function isStandalonePwa() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true
  );
}

export function isIosDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

export function getMessagingSenderId() {
  return minFirebaseConfig.messagingSenderId || "";
}
