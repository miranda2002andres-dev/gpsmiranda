/* eslint-disable no-restricted-globals */
/* eslint-disable no-undef */

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js"
);

const firebaseConfig = {
  apiKey: "AIzaSyAUDQYICaCg2cL-0rKfmbqFLFLFDdow",
  authDomain: "interpáridisimos-gps.firebaseapp.com",
  databaseURL: "https://interrapidisimos-gps-default-rtdb.firebaseio.com",
  projectId: "interpáridisimos-gps",
  storageBucket: "interpáridisimos-gps.firebasestorage.app",
  messagingSenderId: "691863318955",
  appId: "1:691863318955:web:7135a9126f37519e75e2ee",
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("📢 Mensaje en background:", payload);

  const notificationTitle = payload.notification?.title || "INTERRAPIDISIMOS";
  const notificationOptions = {
    body: payload.notification?.body || "Tienes una nueva notificación",
    icon: "/icon-192x192.png",
    badge: "/icon-96x96.png",
    vibrate: [200, 100, 200],
    data: payload.data || {},
    requireInteraction: true,
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const urlToOpen = event.notification.data?.url || "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if (client.url === urlToOpen && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});
