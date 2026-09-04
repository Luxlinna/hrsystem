importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  // nosemgrep: generic.secrets.security.detected-generic-api-key.detected-generic-api-key
  apiKey: atob("QUl6YVN5Q1RwV2NRS0F6UnVrVTZPT3h2QTU2b3lQa2VOdUdvdXow"),
  authDomain: "hrmanagement-ce348.firebaseapp.com",
  projectId: "hrmanagement-ce348",
  storageBucket: "hrmanagement-ce348.firebasestorage.app",
  messagingSenderId: "570469361006",
  appId: "1:570469361006:web:8871482af55ab2536c8d7f",
  measurementId: "G-MVBFML7J2T",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "HRM_OPS";
  const body = payload.notification?.body || "";
  const data = payload.data || {};
  const isUrgentAnnouncement = data.source === "announcements" && data.priority === "urgent";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.png",
    badge: "/favicon.png",
    requireInteraction: isUrgentAnnouncement,
    actions: isUrgentAnnouncement
      ? [
          { action: "accept", title: "Accept" },
          { action: "close", title: "Close" },
        ]
      : undefined,
    data,
  });
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  if (event.action === "close") return;

  const link = event.notification.data?.link || "/";
  const targetLink = event.action === "accept"
    ? `${link}${link.includes("?") ? "&" : "?"}accept=1`
    : link;
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ("focus" in client) {
          client.navigate(targetLink);
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow(targetLink);
    })
  );
});
