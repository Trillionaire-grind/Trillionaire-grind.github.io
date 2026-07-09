/* eslint-disable no-undef */
/* FCM background push — must live at site root (same scope as minorities.html). */
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.4.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBVQvjVADlwaS06syq9D4CWogSy2sC-4aU",
  authDomain: "the-minorities.firebaseapp.com",
  projectId: "the-minorities",
  storageBucket: "the-minorities.firebasestorage.app",
  messagingSenderId: "1037931201409",
  appId: "1:1037931201409:web:caf7850d07a29a0c969e80",
});

const messaging = firebase.messaging();
const DEFAULT_URL = "minorities.html";
const ICON = "minoritiesView/assets/graduation.svg";

messaging.onBackgroundMessage(function (payload) {
  const title = (payload.notification && payload.notification.title) || "The Minorities";
  const body = (payload.notification && payload.notification.body) || "";
  const data = payload.data || {};
  const url = data.url || DEFAULT_URL;

  return self.registration.showNotification(title, {
    body: body,
    icon: ICON,
    badge: ICON,
    tag: data.tag || "min-push",
    data: { url: url, tag: data.tag || "" },
  });
});

self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  const target = (event.notification.data && event.notification.data.url) || DEFAULT_URL;
  const absolute = new URL(target, self.location.origin).href;

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function (windowClients) {
      for (let i = 0; i < windowClients.length; i += 1) {
        const client = windowClients[i];
        if (client.url.indexOf("minorities") !== -1 && "focus" in client) {
          if (target.indexOf("#") !== -1) {
            client.navigate(absolute);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(absolute);
      }
      return undefined;
    }),
  );
});
