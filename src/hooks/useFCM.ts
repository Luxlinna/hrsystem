import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const VAPID_KEY = "BPLrP9vKZn3v1f3n2v9KZn3v1f3n2v9KZn3v1f3n2v9KZn3v1f3n2v9KZn3v1f3n2v9KZn3v1f3n2"; // placeholder

export function useFCM() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let unsub: (() => void) | null = null;

    const init = async () => {
      const msg = await getFirebaseMessaging();
      if (!msg) return;

      try {
        const token = await getToken(msg, { vapidKey: VAPID_KEY });
        if (token) {
          await supabase.from("fcm_tokens").upsert(
            { user_id: user.id, token, device_type: "web" },
            { onConflict: "user_id, token" }
          );
        }
      } catch {
        // FCM token not available (permissions denied or not supported)
      }

      unsub = onMessage(msg, (payload) => {
        const title = payload.notification?.title || "HR Nexus";
        const body = payload.notification?.body || "";
        if (Notification.permission === "granted") {
          new Notification(title, { body, icon: "/favicon.ico" });
        }
      });
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, [user]);
}