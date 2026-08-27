import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { useMyEmployee } from "@/hooks/useMyEmployee";
import { useUnreadNotifications } from "@/hooks/useUnreadNotifications";
import { getNotificationTarget, canSeeNotification } from "@/lib/notificationRoutes";
import { toast } from "@/components/Toast";
import type { NotificationRow, SearchResult } from "./types";
import { MODULE_SEARCH_RESULTS, pathToModule } from "./constants";

/**
 * Encapsulates ALL state, effects, and handlers for the TopBar.
 * The four sub-components (MobileDrawer, GlobalSearch, NotificationDropdown,
 * ProfileDropdown) receive only the props they need — each memoized with
 * React.memo — so the component tree re-renders as little as possible.
 */
export function useTopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can, isAdmin, role } = usePermissions();
  const { employee: myEmployee } = useMyEmployee();
  const { unreadCount, dismissUnread } = useUnreadNotifications();

  // ── Derived identity ────────────────────────────────────────────────────────
  const canOpenRecycleBin = isAdmin || /manager/i.test(role?.name ?? "");

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

    supabase
      .from("notifications")
      .select("*")
      .or(`recipient_user_id.is.null,recipient_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(40)
      .then(({ data }) => setNotifs(data ?? []));

    const channel = supabase
      .channel("topbar-notifs")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const row = payload.new as NotificationRow;
          if (row.recipient_user_id && row.recipient_user_id !== user.id) return;
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
  }, [user?.id]);

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
    const target = getNotificationTarget(n.source, n.entity_id);
    if (target && can(target.module)) navigate(target.path);
  }, [markRead, can, navigate]);

  // ── Auth ────────────────────────────────────────────────────────────────────
  const handleLogout = useCallback(async () => {
    await logout();
    setProfileOpen(false);
    navigate("/login", { replace: true });
  }, [logout, navigate]);

  // ── Global Search ───────────────────────────────────────────────────────────
  const [searchQuery,   setSearchQuery]   = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchOpen,    setSearchOpen]    = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    const query = q.trim().toLowerCase();
    if (!query || query.length < 2) {
      setSearchResults([]);
      setSearchOpen(false);
      return;
    }
    setSearchLoading(true);

    const [empRes, candRes] = await Promise.all([
      supabase
        .from("employees")
        .select("id, first_name, last_name, role, department, status")
        .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,role.ilike.%${query}%,department.ilike.%${query}%`)
        .limit(5),
      supabase
        .from("candidates")
        .select("id, full_name, email, stage, job_postings(title)")
        .is("deleted_at", null)
        .or(`full_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(4),
    ]);

    const results: SearchResult[] = [];

    (empRes.data ?? []).forEach((e: any) => {
      results.push({
        id: `emp-${e.id}`,
        label: `${e.first_name} ${e.last_name}`,
        sublabel: `${e.role} · ${e.department}`,
        icon: "ri-user-line",
        path: `/employees/${e.id}`,
        category: "Employee",
      });
    });

    (candRes.data ?? []).forEach((c: any) => {
      results.push({
        id: `cand-${c.id}`,
        label: c.full_name,
        sublabel: `${c.job_postings?.title ?? "Candidate"} · ${c.stage}`,
        icon: "ri-briefcase-line",
        path: `/hire/candidate/${c.id}`,
        category: "Candidate",
      });
    });

    const matchedModules = MODULE_SEARCH_RESULTS
      .filter((m) => can(pathToModule(m.path)) &&
        (m.label.toLowerCase().includes(query) || m.sublabel.toLowerCase().includes(query)))
      .slice(0, 4);
    results.push(...matchedModules);

    setSearchResults(results);
    setSearchOpen(results.length > 0);
    setSearchLoading(false);
  }, [can]);

  useEffect(() => {
    const timer = setTimeout(() => runSearch(searchQuery), 280);
    return () => clearTimeout(timer);
  }, [searchQuery, runSearch]);

  const handleSelectResult = useCallback((result: SearchResult) => {
    navigate(result.path);
    setSearchQuery("");
    setSearchOpen(false);
  }, [navigate]);

  const clearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchOpen(false);
  }, []);

  return {
    // Auth / identity
    user,
    displayName,
    avatarUrl,
    can,
    isAdmin,
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
    searchQuery, setSearchQuery,
    searchResults,
    searchOpen, setSearchOpen,
    searchLoading,
    handleSelectResult,
    clearSearch,
  };
}
