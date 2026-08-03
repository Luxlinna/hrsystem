import { useEffect } from "react";
import { getToken, onMessage } from "firebase/messaging";
import { getFirebaseMessaging } from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY as string | undefined;

export function useFCM() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user || !VAPID_KEY) return;

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
        const title = payload.notification?.title || "HRM_OPS";
        const body = payload.notification?.body || "";
        const link = payload.data?.link;
        if (Notification.permission === "granted") {
          const n = new Notification(title, { body, icon: "/favicon.png" });
          if (link) n.onclick = () => { window.focus(); window.location.href = link; };
        }
      });
    };

    init();

    return () => {
      if (unsub) unsub();
    };
  }, [user]);
}