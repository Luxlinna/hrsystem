importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyCTpWcQKAzRukU6OOxvA56oyPkeNuGouz0",
  authDomain: "hrmanagement-ce348.firebaseapp.com",
  projectId: "hrmanagement-ce348",
  storageBucket: "hrmanagement-ce348.firebasestorage.app",
  messagingSenderId: "570469361006",
  appId: "1:570469361006:web:8871482af55ab2536c8d7f",
  measurementId: "G-MVBFML7J2T",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || "HR Nexus";
  const body = payload.notification?.body || "";
  self.registration.showNotification(title, {
    body,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
  });
});