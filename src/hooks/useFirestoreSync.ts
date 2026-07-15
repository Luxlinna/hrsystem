import { useEffect, useCallback } from "react";
import { collection, doc, setDoc, deleteDoc, getFirestore } from "firebase/firestore";
import app from "@/lib/firebase";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

const EMPLOYEES_COLLECTION = "employees";
const BRANCHES_COLLECTION = "branches";

export function useFirestoreSync() {
  const { user } = useAuth();

  const db = user ? getFirestore(app) : null;

  const syncEmployees = useCallback(async () => {
    if (!db || !user) return;
    try {
      const { data } = await supabase.from("employees").select("*");
      if (!data) return;
      const batch = data.map((emp) =>
        setDoc(doc(db, EMPLOYEES_COLLECTION, String(emp.id)), {
          ...emp,
          syncedAt: new Date().toISOString(),
        })
      );
      await Promise.all(batch);
    } catch {
      // Silent fail — Firestore sync is best-effort
    }
  }, [db, user]);

  const syncBranches = useCallback(async () => {
    if (!db || !user) return;
    try {
      const { data } = await supabase.from("branches").select("*");
      if (!data) return;
      const batch = data.map((b) =>
        setDoc(doc(db, BRANCHES_COLLECTION, String(b.id)), {
          ...b,
          syncedAt: new Date().toISOString(),
        })
      );
      await Promise.all(batch);
    } catch {
      // Silent fail
    }
  }, [db, user]);

  useEffect(() => {
    if (!db || !user) return;

    syncEmployees();
    syncBranches();

    const empChannel = supabase
      .channel("employees-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "employees" },
        async (payload) => {
          try {
            if (payload.eventType === "DELETE" && payload.old.id) {
              await deleteDoc(doc(db, EMPLOYEES_COLLECTION, String(payload.old.id)));
            } else if (payload.new.id) {
              await setDoc(doc(db, EMPLOYEES_COLLECTION, String(payload.new.id)), {
                ...payload.new,
                syncedAt: new Date().toISOString(),
              });
            }
          } catch {
            // Silent fail
          }
        }
      )
      .subscribe();

    const branchChannel = supabase
      .channel("branches-sync")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "branches" },
        async (payload) => {
          try {
            if (payload.eventType === "DELETE" && payload.old.id) {
              await deleteDoc(doc(db, BRANCHES_COLLECTION, String(payload.old.id)));
            } else if (payload.new.id) {
              await setDoc(doc(db, BRANCHES_COLLECTION, String(payload.new.id)), {
                ...payload.new,
                syncedAt: new Date().toISOString(),
              });
            }
          } catch {
            // Silent fail
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(empChannel);
      supabase.removeChannel(branchChannel);
    };
  }, [user, db, syncEmployees, syncBranches]);
}