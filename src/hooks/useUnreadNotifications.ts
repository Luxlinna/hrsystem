import { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { canSeeNotification } from "@/lib/notificationRoutes";

/** Only what the badge needs — the full row is fetched by whoever renders a list. */
interface UnreadRow {
  id: string;
  source: string;
  recipient_user_id: string | null;
  branch_id: string | null;
}

// ---------------------------------------------------------------------------
// Shared store. The sidebar, top bar and bottom nav are all mounted at once,
// so a per-component subscription would mean three realtime channels racing to
// show three different numbers. One store, one channel, one number.
// ---------------------------------------------------------------------------
let sharedRows: UnreadRow[] = [];
let sharedUserId: string | null = null;
let sharedBranchId: string | null = null;
let channel: ReturnType<typeof supabase.channel> | null = null;
let subscriberCount = 0;
const listeners = new Set<(rows: UnreadRow[]) => void>();

function publish(next: UnreadRow[]) {
  sharedRows = next;
  listeners.forEach((notify) => notify(sharedRows));
}

export function clearAllUnreadNotifications() {
  publish([]);
}

export function refreshUnreadNotifications() {
  if (sharedUserId) {
    loadUnread(sharedUserId, sharedBranchId);
  }
}

/**
 * Fetches only unread rows, so the count covers the whole backlog rather than
 * whatever fits in a capped page of recent notifications.
 */
async function loadUnread(userId: string, branchId: string | null) {
  let q = supabase
    .from("notifications")
    .select("id, source, recipient_user_id, branch_id")
    .or(`recipient_user_id.is.null,recipient_user_id.eq.${userId}`)
    .eq("is_read", false);

  if (branchId) {
    q = q.or(`branch_id.is.null,branch_id.eq.${branchId}`);
  }

  const { data, error } = await q;
  if (error) {
    console.error("loadUnread error:", error);
    return;
  }
  if (sharedUserId !== userId) return; // signed-in user changed mid-flight
  publish((data || []) as UnreadRow[]);
}

// Realtime can drop frames while the tab is backgrounded; re-sync on return so
// the badge never sits on a stale number.
function handleVisibility() {
  if (document.visibilityState === "visible" && sharedUserId) loadUnread(sharedUserId, sharedBranchId);
}

function disconnect() {
  if (channel) {
    supabase.removeChannel(channel);
    channel = null;
  }
  document.removeEventListener("visibilitychange", handleVisibility);
  sharedUserId = null;
  sharedBranchId = null;
  publish([]);
}

function connect(userId: string, branchId: string | null) {
  if (sharedUserId === userId && sharedBranchId === branchId && channel) return;
  disconnect();
  sharedUserId = userId;
  sharedBranchId = branchId;

  const upsert = (row: UnreadRow) =>
    publish([row, ...sharedRows.filter((n) => n.id !== row.id)]);
  const remove = (id: string) => publish(sharedRows.filter((n) => n.id !== id));

  channel = supabase
    .channel("shared-unread-notifs")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "notifications" },
      (payload) => {
        const row = payload.new as UnreadRow & { is_read: boolean };
        if (row.recipient_user_id && row.recipient_user_id !== userId) return;
        if (row.branch_id !== null && row.branch_id !== branchId) return;
        if (!row.is_read) upsert(row);
      }
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "notifications" },
      (payload) => {
        const row = payload.new as UnreadRow & { is_read: boolean };
        if (row.recipient_user_id && row.recipient_user_id !== userId) return;
        if (row.branch_id !== null && row.branch_id !== branchId) return;
        // Handles both directions: marking read drops it, marking unread
        // brings it back.
        if (row.is_read) remove(row.id);
        else upsert(row);
      }
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "notifications" },
      (payload) => {
        const old = payload.old as { id?: string };
        if (old.id) remove(old.id);
      }
    )
    .subscribe();

  document.addEventListener("visibilitychange", handleVisibility);
  loadUnread(userId, branchId);
}

/**
 * The single source of truth for the unread bell badge, so the sidebar, top bar
 * and bottom nav can never disagree with each other or with the Notifications
 * page. Two rules decide whether a notification counts, matching that page:
 *
 *  1. Recipient scope — a personal notification (recipient_user_id set) counts
 *     only for that user; broadcasts (null) are candidates for everyone.
 *  2. Module access — a broadcast about a module this role can't open is noise
 *     it can't act on, so it doesn't count. Personal ones always count.
 */
export function useUnreadNotifications() {
  const { user } = useAuth();
  const { can, loading: permsLoading } = usePermissions();
  const { targetBranch } = useBranchScope();
  const [rows, setRows] = useState<UnreadRow[]>(sharedRows);

  useEffect(() => {
    const userId = user?.id;
    if (!userId) {
      setRows([]);
      return;
    }

    listeners.add(setRows);
    subscriberCount++;
    connect(userId, targetBranch || null);
    setRows(sharedRows);

    return () => {
      listeners.delete(setRows);
      subscriberCount--;
      if (subscriberCount === 0) disconnect();
    };
  }, [user?.id, targetBranch]);

  const unreadCount = useMemo(() => {
    // Until permissions resolve, `can` denies everything — showing 0 briefly
    // beats flashing a wrong number that then jumps.
    if (permsLoading) return 0;
    return rows.filter(
      (n) => n.recipient_user_id === user?.id || canSeeNotification(n.source, can)
    ).length;
  }, [rows, can, permsLoading, user?.id]);

  /**
   * Drop one notification from the badge right away, for callers that just
   * marked it read. The realtime UPDATE reconciles this anyway — this only
   * removes the round-trip delay.
   */
  const dismissUnread = useCallback((id: string) => {
    publish(sharedRows.filter((n) => n.id !== id));
  }, []);

  return { unreadCount, dismissUnread };
}
