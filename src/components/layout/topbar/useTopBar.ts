import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useBranchScope } from "@/context/BranchContext";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { getNotificationTarget, canSeeNotification } from "@/lib/notificationRoutes";
import { toast } from "@/components/Toast";
import type { NotificationRow } from "./types";
import { useGlobalSearch } from "./useGlobalSearch";

/**
 * Encapsulates ALL state, effects, and handlers for the TopBar.
 * The four sub-components (MobileDrawer, GlobalSearch, NotificationDropdown,
 * ProfileDropdown) receive only the props they need — each memoized with
 * React.memo — so the component tree re-renders as little as possible.
 */
export function useTopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can, isAdmin, isBranchAdmin, role } = usePermissions();
  const { userBranchId } = useBranchScope();
  const { employee: myEmployee } = useMyEmployee();
  const { unreadCount, dismissUnread } = useUnreadNotifications();

  // ── Derived identity ────────────────────────────────────────────────────────
  const canOpenRecycleBin = Boolean(user);

  // Prefer the HR employee record (source of truth) over Supabase Auth metadata,
  // which can drift (e.g. invite flow setting display_name to a role title).
  const displayName =
    (myEmployee && `${myEmployee.first_name} ${myEmployee.last_name}`.trim()) ||
    (user?.user_metadata?.display_name as string) ||
    user?.email?.split("@")[0] ||
    "HR Admin";

  const avatarUrl =
    myEmployee?.avatar_url ?? (user?.user_metadata?.avatar_url as string | undefined);

  // ── Dropdown open/close state ───────────────────────────────────────────────
  const [menuOpen,    setMenuOpen]    = useState(false);
  const [notifOpen,   setNotifOpen]   = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  // ── Notifications ───────────────────────────────────────────────────────────
  const [notifs, setNotifs] = useState<NotificationRow[]>([]);

  // usePermissions() creates a new `can` function identity each render; closing
  // over it in the realtime callback below would recreate the subscription
  // constantly. A ref lets the callback always read the latest value without
  // listing it as a dependency.
  const canRef = useRef(can);
  canRef.current = can;

  useEffect(() => {
    if (!user?.id) return;

    let q = supabase
      .from("notifications")
      .select("*")
      .or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(40);

    if (userBranchId) {
      q = q.or(`branch_id.is.null,branch_id.eq.${userBranchId}`);
    } else {
      q = q.is("branch_id", null);
    }

    q.then(({ data }) => setNotifs(data ?? []));

    const channel = supabase
      .channel("topbar-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.recipient_user_id && row.recipient_user_id !== user.id) return;
          if (row.branch_id !== null && row.branch_id !== userBranchId) return;
          setNotifs((prev) => [row, ...prev].slice(0, 40));
          if (row.recipient_user_id === user.id || canSeeNotification(row.source, canRef.current)) {
            toast(row.title, row.message, row.type);
          }
        }
      )
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.recipient_user_id && row.recipient_user_id !== user.id) return;
          setNotifs((prev) => prev.map((n) => (n.id === row.id ? row : n)));
        }
      )
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "notifications" },
        (payload) => {
          const old = payload.old as NotificationRow;
          if (old.recipient_user_id && old.recipient_user_id !== user.id) return;
          setNotifs((prev) => prev.filter((n) => n.id !== old.id));
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user?.id, userBranchId]);

  const visibleNotifs = useMemo(
    () => notifs.filter((n) => n.recipient_user_id === user?.id || canSeeNotification(n.source, can)),
    [notifs, can, user?.id]
  );
  const previewNotifs = useMemo(() => visibleNotifs.slice(0, 6), [visibleNotifs]);

  const markRead = useCallback(async (id: string) => {
    dismissUnread(id);
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  }, [dismissUnread]);

  const openNotification = useCallback((n: NotificationRow) => {
    if (!n.is_read) markRead(n.id);
    setNotifOpen(false);
    const target = getNotificationTarget(n.source, n.entity_id, n.title, n.message);
    if (target && (target.module === "leave" || can(target.module))) navigate(target.path);
  }, [markRead, can, navigate]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await logout();
    setProfileOpen(false);
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // ── Global Search ───────────────────────────────────────────────────────────
  const search = useGlobalSearch(can);

  return {
    // Auth / identity
    user,
    displayName,
    avatarUrl,
    can,
    isAdmin,
    isBranchAdmin,
    canOpenRecycleBin,
    handleLogout,
    // Dropdown toggles
    menuOpen, setMenuOpen,
    notifOpen, setNotifOpen,
    profileOpen, setProfileOpen,
    // Notifications
    previewNotifs,
    unreadCount,
    markRead,
    openNotification,
    // Search
    ...search,
  };
}
