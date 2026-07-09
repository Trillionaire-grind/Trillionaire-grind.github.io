const ICON_PATH = "minoritiesView/assets/graduation.svg";

let seeded = false;
let enabled = false;
let currentRoute = { name: "register", id: null };

const snapshot = {
  postIds: new Set(),
  cardIds: new Set(),
  commentCounts: {},
  messageCounts: {},
};

function canNotify() {
  return enabled && typeof Notification !== "undefined" && Notification.permission === "granted";
}

function shouldNotifyForRoute(routeName, routeId, targetName, targetId) {
  if (document.hidden) return true;
  if (routeName !== targetName) return true;
  if (targetId && routeId !== targetId) return true;
  return false;
}

export function isNotificationSupported() {
  return typeof Notification !== "undefined";
}

export function getNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";
  return Notification.permission;
}

export function areNotificationsEnabled() {
  return enabled && getNotificationPermission() === "granted";
}

export async function requestNotificationPermission() {
  if (!isNotificationSupported()) return "unsupported";

  const result = await Notification.requestPermission();
  enabled = result === "granted";

  if (enabled) {
    try {
      localStorage.setItem("minNotificationsEnabled", "1");
    } catch (err) {
      /* ignore */
    }

    if (window.MIN_PUSH && window.MIN_PUSH.isPushConfigured && window.MIN_PUSH.isPushConfigured()) {
      try {
        await window.MIN_PUSH.registerPushToken();
      } catch (err) {
        console.warn("MIN_NOTIFY push registration failed", err);
        throw err;
      }
    }
  }

  return result;
}

export function setNotificationsEnabled(value) {
  enabled = Boolean(value) && getNotificationPermission() === "granted";
  try {
    if (enabled) localStorage.setItem("minNotificationsEnabled", "1");
    else localStorage.removeItem("minNotificationsEnabled");
  } catch (err) {
    /* ignore */
  }
}

export function initMinNotifications() {
  if (!isNotificationSupported()) return false;
  try {
    enabled = localStorage.getItem("minNotificationsEnabled") === "1" && Notification.permission === "granted";
  } catch (err) {
    enabled = Notification.permission === "granted";
  }
  return true;
}

export function setNotificationRoute(route) {
  currentRoute = route || { name: "register", id: null };
}

function showNotification(title, body, tag) {
  if (!canNotify()) return;

  try {
    const notification = new Notification(title, {
      body,
      icon: ICON_PATH,
      tag: tag || title,
    });

    notification.onclick = function () {
      window.focus();
      notification.close();
    };
  } catch (err) {
    console.warn("MIN_NOTIFY show failed", err);
  }
}

function seedFromAppState() {
  const posts = window.MIN_CONTENT && window.MIN_CONTENT.getPosts ? window.MIN_CONTENT.getPosts() : [];
  const cards =
    window.MIN_CONTENT && window.MIN_CONTENT.getContentCards ? window.MIN_CONTENT.getContentCards() : [];
  const chats = window.MIN_CHAT && window.MIN_CHAT.getChats ? window.MIN_CHAT.getChats() : [];

  snapshot.postIds = new Set(posts.map((post) => post.id));
  snapshot.cardIds = new Set(cards.map((card) => card.id));
  snapshot.commentCounts = {};
  snapshot.messageCounts = {};

  posts.forEach((post) => {
    snapshot.commentCounts[post.id] = post.comments || 0;
  });

  chats.forEach((chat) => {
    const messages =
      window.MIN_CHAT && window.MIN_CHAT.getMessages ? window.MIN_CHAT.getMessages(chat.id) : [];
    snapshot.messageCounts[chat.id] = messages.length;
  });

  seeded = true;
}

export function checkForUpdates() {
  if (!seeded) {
    seedFromAppState();
    return;
  }

  if (!canNotify()) return;

  const posts = window.MIN_CONTENT && window.MIN_CONTENT.getPosts ? window.MIN_CONTENT.getPosts() : [];
  const cards =
    window.MIN_CONTENT && window.MIN_CONTENT.getContentCards ? window.MIN_CONTENT.getContentCards() : [];
  const chats = window.MIN_CHAT && window.MIN_CHAT.getChats ? window.MIN_CHAT.getChats() : [];

  posts.forEach((post) => {
    if (!snapshot.postIds.has(post.id)) {
      snapshot.postIds.add(post.id);
      if (shouldNotifyForRoute(currentRoute.name, currentRoute.id, "posts", null)) {
        showNotification(
          "New community post",
          post.headline || post.body || "Someone shared a new post.",
          "min-post-" + post.id,
        );
      }
    }

    const previousCount = snapshot.commentCounts[post.id] || 0;
    const nextCount = post.comments || 0;
    if (nextCount > previousCount) {
      snapshot.commentCounts[post.id] = nextCount;
      if (shouldNotifyForRoute(currentRoute.name, currentRoute.id, "post", post.id)) {
        showNotification(
          "New comment",
          "New activity on " + (post.headline || post.body || "a post") + ".",
          "min-comment-" + post.id,
        );
      }
    }
  });

  cards.forEach((card) => {
    if (!snapshot.cardIds.has(card.id)) {
      snapshot.cardIds.add(card.id);
      if (shouldNotifyForRoute(currentRoute.name, currentRoute.id, "home", null)) {
        showNotification("New content", card.title || "Fresh content is live on The Minorities.", "min-card-" + card.id);
      }
    }
  });

  chats.forEach((chat) => {
    const messages =
      window.MIN_CHAT && window.MIN_CHAT.getMessages ? window.MIN_CHAT.getMessages(chat.id) : [];
    const previousCount = snapshot.messageCounts[chat.id] || 0;
    const nextCount = messages.length;

    if (nextCount > previousCount) {
      const latest = messages[messages.length - 1];
      snapshot.messageCounts[chat.id] = nextCount;

      if (latest && !latest.mine && shouldNotifyForRoute(currentRoute.name, currentRoute.id, "thread", chat.id)) {
        showNotification(
          chat.name || "New chat message",
          latest.text || "You have a new message.",
          "min-chat-" + chat.id,
        );
      }
    }
  });
}

export function resetNotificationSnapshot() {
  seeded = false;
  seedFromAppState();
}
