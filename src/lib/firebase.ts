import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getMessaging, isSupported } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyCTpWcQKAzRukU6OOxvA56oyPkeNuGouz0",
  authDomain: "hrmanagement-ce348.firebaseapp.com",
  projectId: "hrmanagement-ce348",
  storageBucket: "hrmanagement-ce348.firebasestorage.app",
  messagingSenderId: "570469361006",
  appId: "1:570469361006:web:8871482af55ab2536c8d7f",
  measurementId: "G-MVBFML7J2T",
};

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Safe initializers — never crash at module load
function safeInit<T>(fn: () => T): T | null {
  try {
    return fn();
  } catch {
    return null;
  }
}

export const db = safeInit(() => getFirestore(app));
export const storage = safeInit(() => getStorage(app));
export const analytics = safeInit(() => getAnalytics(app));

export async function getFirebaseMessaging() {
  try {
    const supported = await isSupported();
    return supported ? getMessaging(app) : null;
  } catch {
    return null;
  }
}

export const messaging = getFirebaseMessaging;

export default app;