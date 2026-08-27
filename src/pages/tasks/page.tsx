import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { notify } from "@/lib/notify";
import EmployeeSearchSelect from "@/components/EmployeeSearchSelect";
import CheckInOutModal from "./CheckInOutModal";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { uploadMediaToS3, type MediaItem } from "@/lib/s3-storage";
import { getCurrentPosition } from "@/lib/geo";
import { loadGoogleMaps } from "@/lib/geocode";

// XLSX is lazy-loaded on demand (export only) to avoid adding ~900KB to the
// initial JS bundle, which was the primary cause of the 21s LCP.
const getXLSX = () => import("xlsx");

const fmtDuration = (from: string, to: string | null) => {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  if (ms < 0) return "—";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
};

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  avatar_url?: string;
  email: string;
  reports_to?: string | null;
  branch_id?: string | null;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  assigned_to: string;
  assigned_by: string;
  status: "todo" | "in_progress" | "blocked" | "done";
  priority: "low" | "medium" | "high" | "urgent";
  due_date: string | null;
  completed_at: string | null;
  created_at: string;
  is_outside_work: boolean;
  work_status: "checked_in" | "checked_out" | null;
  work_checked_in_at: string | null;
  work_checked_out_at: string | null;
  work_lat: number | null;
  work_lng: number | null;
  work_accuracy_m: number | null;
  work_address: string | null;
  work_image_url: string | null;
  work_check_out_lat: number | null;
  work_check_out_lng: number | null;
  work_check_out_accuracy_m: number | null;
  work_check_out_address: string | null;
  work_check_out_image_url: string | null;
  work_media_urls: MediaItem[] | null;
  work_check_out_media_urls: MediaItem[] | null;
  employees?: { first_name: string; last_name: string; department: string; avatar_url?: string } | null;
}

interface TaskActivity {
  id: string;
  task_id: string;
  actor_id: string | null;
  action: "created" | "status_changed" | "assigned" | "updated";
  field: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  employees?: { first_name: string; last_name: string; avatar_url: string | null } | null;
}

interface FormState {
  title: string;
  description: string;
  assigned_to: string;
  status: Task["status"];
  priority: Task["priority"];
  due_date: string;
  is_outside_work: boolean;
}

const STATUS_CONFIG: Record<
  Task["status"],
  { label: string; icon: string; headerBg: string; border: string; badge: string; accent: string }
> = {
  todo: {
    label: "To Do",
    icon: "ri-checkbox-blank-circle-line",
    headerBg: "bg-slate-50",
    border: "border-slate-200/80",
    badge: "bg-slate-100 text-slate-700",
    accent: "#64748B",
  },
  in_progress: {
    label: "In Progress",
    icon: "ri-progress-4-line",
    headerBg: "bg-sky-50/50",
    border: "border-sky-200/80",
    badge: "bg-sky-50 text-sky-700 border border-sky-200/60",
    accent: "#0284C7",
  },
  blocked: {
    label: "Blocked",
    icon: "ri-error-warning-line",
    headerBg: "bg-rose-50/50",
    border: "border-rose-200/80",
    badge: "bg-rose-50 text-rose-700 border border-rose-200/60",
    accent: "#E11D48",
  },
  done: {
    label: "Completed",
    icon: "ri-checkbox-circle-fill",
    headerBg: "bg-emerald-50/50",
    border: "border-emerald-200/80",
    badge: "bg-emerald-50 text-emerald-700 border border-emerald-200/60",
    accent: "#059669",
  },
};

const STATUS_COLUMNS: { key: Task["status"]; label: string }[] = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "blocked", label: "Blocked" },
  { key: "done", label: "Completed" },
];

const PRIORITY_META: Record<
  Task["priority"],
  { label: string; bg: string; text: string; border: string; icon: string }
> = {
  low: { label: "Low", bg: "bg-slate-100", text: "text-slate-600", border: "border-slate-200", icon: "ri-arrow-down-line" },
  medium: { label: "Medium", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200/70", icon: "ri-equal-line" },
  high: { label: "High", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200/80", icon: "ri-arrow-up-line" },
  urgent: { label: "Urgent", bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-300", icon: "ri-fire-line" },
};

// Local YYYY-MM-DD
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const isOverdue = (t: Task) => !!t.due_date && t.due_date < today() && t.status !== "done";

const prettyValue = (v: string | null) => (v ? v.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : "");

const formatRelative = (ts: string) => {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return "just now";
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatExact = (ts: string) =>
  new Date(ts).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });

const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0, 2).map((n) => n[0]).join("").toUpperCase();

const formatDueDate = (v: string | null) => {
  if (!v) return "";
  const d = new Date(`${v}T00:00:00`);
  if (isNaN(d.getTime())) return v;
  const todayStr = today();
  if (v === todayStr) return "Today";
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, "0")}-${String(tomorrow.getDate()).padStart(2, "0")}`;
  if (v === tomStr) return "Tomorrow";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const formatShortDate = (ts: string) =>
  new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

const ACTIVITY_ICON: Record<TaskActivity["action"], string> = {
  created: "ri-add-circle-line",
  status_changed: "ri-arrow-left-right-line",
  assigned: "ri-user-shared-line",
  updated: "ri-edit-line",
};

const ACTIVITY_COLOR: Record<TaskActivity["action"], string> = {
  created: "text-emerald-500",
  status_changed: "text-sky-500",
  assigned: "text-violet-500",
  updated: "text-gray-400",
};

const activityText = (a: TaskActivity) => {
  switch (a.action) {
    case "created":
      return "created this task";
    case "status_changed":
      return a.old_value
        ? `changed status from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
        : `moved task to ${prettyValue(a.new_value)}`;
    case "assigned":
      return a.old_value
        ? `reassigned task from ${a.old_value} to ${a.new_value || "an employee"}`
        : `assigned task to ${a.new_value || "an employee"}`;
    default:
      switch (a.field) {
        case "title":
          return "updated title";
        case "description":
          return "updated description";
        case "priority":
          return a.old_value
            ? `changed priority from ${prettyValue(a.old_value)} to ${prettyValue(a.new_value)}`
            : `set priority to ${prettyValue(a.new_value)}`;
        case "due_date":
          return a.new_value
            ? `changed deadline to ${formatDueDate(a.new_value)}`
            : "removed deadline";
        default:
          return `updated ${a.field.replace(/_/g, " ")}`;
      }
  }
};

const WORKABLE_STATUSES = ["active", "on_leave", "onboarding"];

const emptyForm: FormState = {
  title: "",
  description: "",
  assigned_to: "",
  status: "todo",
  priority: "medium",
  due_date: "",
  is_outside_work: false,
};

async function notifyTaskAssignees(params: {
  employeeIds: string[];
  employees: Employee[];
  actorUserId?: string | null;
  title: string;
  message: string;
  entityId?: string | null;
}) {
  const targets = params.employees.filter((e) => params.employeeIds.includes(e.id) && e.email);
  if (targets.length === 0) return;

  const emails = targets.map((e) => e.email as string);
  const { data: assignments } = await supabase
    .from("user_role_assignments")
    .select("email, user_id")
    .in("email", emails)
    .is("deleted_at", null);
  const userIdsByEmail = new Map(
    (assignments || [])
      .filter((a: any) => a.user_id)
      .map((a: any) => [String(a.email).toLowerCase(), a.user_id])
  );

  await Promise.all(
    targets.map((emp) => {
      const recipientUserId = userIdsByEmail.get((emp.email as string).toLowerCase());
      if (!recipientUserId || recipientUserId === params.actorUserId) return Promise.resolve(true);
      return notify({
        source: "tasks",
        type: "info",
        title: params.title,
        message: params.message,
        entityId: params.entityId,
        recipientUserId,
      });
    })
  );
}

export default function TasksPage() {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const { role, isAdmin, loading: permsLoading } = usePermissions();
  const canViewAll = isAdmin || !!role?.task_view_all_employees;
  const canViewOwnBranch = !canViewAll && !!role?.task_view_own_branch;
  const canManage = canViewAll || canViewOwnBranch;
  const canAssign = canManage;

  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignableEmployees, setAssignableEmployees] = useState<Employee[]>([]);
  const [myEmployee, setMyEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"board" | "list" | "report" | "my_report" | "admin_report">("board");
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterAssignee, setFilterAssignee] = useState<string>("all");
  const [filterQuickState, setFilterQuickState] = useState<"all" | "my_tasks" | "overdue" | "high_priority">("all");
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const [reportPreset, setReportPreset] = useState<"all" | "today" | "week" | "month" | "custom">("all");
  const [reportFrom, setReportFrom] = useState("");
  const [reportTo, setReportTo] = useState("");

  const [reportExportOpen, setReportExportOpen] = useState(false);
  const [myReportExportOpen, setMyReportExportOpen] = useState(false);
  const reportExportRef = useRef<HTMLDivElement>(null);
  const myReportExportRef = useRef<HTMLDivElement>(null);

  const [reportFilterEmpId, setReportFilterEmpId] = useState("");
  const [reportFilterOpen, setReportFilterOpen] = useState(false);
  const [reportFilterSearch, setReportFilterSearch] = useState("");
  const reportFilterRef = useRef<HTMLDivElement>(null);
  const [myReportFilterEmpId, setMyReportFilterEmpId] = useState("");

  const [adminReportSearch, setAdminReportSearch] = useState("");
  const [adminReportDeptFilter, setAdminReportDeptFilter] = useState<string>("all");
  const [adminReportExpandedEmpId, setAdminReportExpandedEmpId] = useState<string | null>(null);
  const [adminReportEmpExportOpen, setAdminReportEmpExportOpen] = useState<string | null>(null);
  const adminReportEmpExportRef = useRef<HTMLDivElement>(null);
  const [adminTaskActivities, setAdminTaskActivities] = useState<Record<string, TaskActivity[]>>({});
  const [myTaskActivities, setMyTaskActivities] = useState<Record<string, TaskActivity[]>>({});

  const [showModal, setShowModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [taskSearch, setTaskSearch] = useState("");
  const [taskOpen, setTaskOpen] = useState(false);
  const taskRef = useRef<HTMLDivElement>(null);
  const [saving, setSaving] = useState(false);
  const [activities, setActivities] = useState<TaskActivity[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState<"details" | "activity">("details");

  const [owTaskId, setOwTaskId] = useState<string | null>(null);
  const [owMode, setOwMode] = useState<"check_in" | "check_out">("check_in");
  const [owTick, setOwTick] = useState(0);

  const [owLocation, setOwLocation] = useState<{ lat: number; lng: number; accuracy: number | null; address: string | null } | null>(null);
  const [owFiles, setOwFiles] = useState<{ file: File; preview: string; type: "image" | "video" }[]>([]);
  const [owLocating, setOwLocating] = useState(false);
  const owFileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const interval = setInterval(() => setOwTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, []);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const closeModal = () => {
    setShowModal(false);
    setOwLocation(null);
    setOwFiles([]);
  };

  const openCheckInOut = (taskId: string, mode: "check_in" | "check_out") => {
    setOwTaskId(taskId);
    setOwMode(mode);
  };

  const handleOwCaptureLocation = async () => {
    setOwLocating(true);
    try {
      const pos = await getCurrentPosition();
      const loc = {
        lat: Number(pos.coords.latitude.toFixed(6)),
        lng: Number(pos.coords.longitude.toFixed(6)),
        accuracy: Math.round(pos.coords.accuracy),
        address: null as string | null,
      };
      setOwLocation(loc);
      try {
        await loadGoogleMaps();
        const geocoder = new (window as any).google.maps.Geocoder();
        const address = await new Promise<string>((resolve, reject) => {
          geocoder.geocode({ location: { lat: loc.lat, lng: loc.lng } }, (results: any[], status: string) => {
            if (status === "OK" && results?.[0]) resolve(results[0].formatted_address);
            else reject(new Error(status));
          });
        });
        setOwLocation((prev) => (prev ? { ...prev, address } : prev));
      } catch {}
    } catch (err: any) {
      showToast("error", err?.code === 1 ? "Location access denied." : "Couldn't get your location.");
    } finally {
      setOwLocating(false);
    }
  };

  const handleOwPickFiles = (inputFiles: FileList | undefined) => {
    if (!inputFiles) return;
    const next: { file: File; preview: string; type: "image" | "video" }[] = [];
    for (let i = 0; i < inputFiles.length; i++) {
      const f = inputFiles[i];
      if (!f.type.startsWith("image/") && !f.type.startsWith("video/")) continue;
      if (f.size > 50 * 1024 * 1024) { showToast("error", `"${f.name}" is too large (max 50MB).`); continue; }
      next.push({ file: f, preview: URL.createObjectURL(f), type: f.type.startsWith("video/") ? "video" : "image" });
    }
    setOwFiles((prev) => [...prev, ...next]);
  };

  const loadData = useCallback(async () => {
    if (!user?.email) return;
    setLoading(true);

    const { data: me } = await supabase
      .from("employees")
      .select("id, first_name, last_name, department, branch_id, avatar_url, email")
      .eq("email", user.email)
      .maybeSingle();
    setMyEmployee(me);
    if (!me) { setEmployees([]); setAssignableEmployees([]); setTasks([]); setLoading(false); return; }

    if (canViewAll) {
      const empQuery = me.branch_id
        ? supabase.from("employees").select("id, first_name, last_name, department, branch_id, avatar_url, email, reports_to").eq("status", "active").eq("branch_id", me.branch_id).order("first_name")
        : supabase.from("employees").select("id, first_name, last_name, department, branch_id, avatar_url, email, reports_to").eq("status", "active").order("first_name");
      const [{ data: emp }, { data: t }] = await Promise.all([
        empQuery,
        supabase.from("tasks").select("id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)").is("deleted_at", null).order("created_at", { ascending: false }).limit(300),
      ]);
      setEmployees(emp || []);
      setAssignableEmployees(emp || []);
      setTasks((t as any) || []);
      setLoading(false);
      return;
    }

    if (canViewOwnBranch) {
      const empRes = me.branch_id
        ? await supabase.from("employees").select("id, first_name, last_name, department, branch_id, avatar_url, email, reports_to").eq("status", "active").eq("branch_id", me.branch_id).eq("reports_to", me.id).order("first_name")
        : await supabase.from("employees").select("id, first_name, last_name, department, branch_id, avatar_url, email, reports_to").eq("status", "active").eq("reports_to", me.id).order("first_name");
      const team = empRes.data || [];
      setEmployees(team);
      const ids = team.map((e) => e.id);
      const { data: t } = ids.length
        ? await supabase.from("tasks").select("id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)").in("assigned_to", ids).is("deleted_at", null).order("created_at", { ascending: false }).limit(300)
        : { data: [] };
      setTasks((t as any) || []);
      setLoading(false);
      return;
    }

    setEmployees([me]);
    setAssignableEmployees([me]);
    const { data: t } = await supabase
      .from("tasks")
      .select("id, title, description, assigned_to, assigned_by, status, priority, due_date, completed_at, created_at, is_outside_work, work_status, work_checked_in_at, work_checked_out_at, work_lat, work_lng, work_accuracy_m, work_address, work_image_url, work_check_out_lat, work_check_out_lng, work_check_out_accuracy_m, work_check_out_address, work_check_out_image_url, work_media_urls, work_check_out_media_urls, employees!tasks_assigned_to_fkey(first_name, last_name, department, avatar_url)")
      .eq("assigned_to", me.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false }).limit(300);
    setTasks((t as any) || []);

    if (canAssign) {
      const assignEmpQuery = me.branch_id
        ? supabase.from("employees").select("id, first_name, last_name, department, branch_id, avatar_url, email, reports_to").eq("status", "active").eq("branch_id", me.branch_id).order("first_name")
        : supabase.from("employees").select("id, first_name, last_name, department, branch_id, avatar_url, email, reports_to").eq("status", "active").order("first_name");
      const { data: allEmp } = await assignEmpQuery;
      setEmployees(allEmp || []);
    }

    setLoading(false);
  }, [user?.email, canViewAll, canViewOwnBranch, canAssign]);

  useEffect(() => {
    if (permsLoading) return;
    loadData();
    const ch = supabase
      .channel("tasks-realtime")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "tasks" },
        (payload) => {
          const updated = payload.new as Task;
          if (updated?.deleted_at) {
            setTasks((prev) => prev.filter((t) => t.id !== updated.id));
          } else {
            setTasks((prev) => {
              const idx = prev.findIndex((t) => t.id === updated.id);
              if (idx === -1) return prev;
              const merged = { ...prev[idx], ...updated };
              const next = [...prev];
              next[idx] = merged;
              return next;
            });
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "tasks" },
        () => loadData()
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [permsLoading, loadData]);

  const loadActivities = useCallback(async (taskId: string) => {
    setActivityLoading(true);
    const { data } = await supabase
      .from("task_activities")
      .select("*, employees(first_name, last_name, avatar_url)")
      .eq("task_id", taskId)
      .order("created_at", { ascending: false });
    setActivities((data as TaskActivity[]) || []);
    setActivityLoading(false);
  }, []);

  useEffect(() => {
    if (!showModal || !editingTask) { setActivities([]); return; }
    loadActivities(editingTask.id);
    const ch = supabase
      .channel("task-activities-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "task_activities", filter: `task_id=eq.${editingTask.id}` },
        () => loadActivities(editingTask.id)
      )
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [showModal, editingTask, loadActivities]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (taskRef.current && !taskRef.current.contains(e.target as Node)) setTaskOpen(false);
      if (reportExportRef.current && !reportExportRef.current.contains(e.target as Node)) setReportExportOpen(false);
      if (myReportExportRef.current && !myReportExportRef.current.contains(e.target as Node)) setMyReportExportOpen(false);
      if (reportFilterRef.current && !reportFilterRef.current.contains(e.target as Node)) { setReportFilterOpen(false); setReportFilterSearch(""); }
      if (!(e.target as HTMLElement).closest('[data-admin-export]')) { setAdminReportEmpExportOpen(null); }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const openCreate = (initialStatus?: Task["status"]) => {
    setEditingTask(null);
    setForm({
      ...emptyForm,
      status: initialStatus || "todo",
      assigned_to: myEmployee?.id || "",
    });
    setAssignedToIds(myEmployee ? [myEmployee.id] : []);
    setActiveModalTab("details");
    setShowModal(true);
  };

  const openEdit = (t: Task) => {
    setEditingTask(t);
    setForm({
      title: t.title,
      description: t.description || "",
      assigned_to: t.assigned_to,
      status: t.status || "todo",
      priority: t.priority || "medium",
      due_date: t.due_date || "",
      is_outside_work: !!t.is_outside_work,
    });
    setActiveModalTab("details");
    setShowModal(true);
  };

  const handleSave = async () => {
    const assignerName = myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name}` : "a manager";

    const sendTaskNotifications = async (assignedEmpIds: string[], taskTitle: string, taskId?: string) => {
      const assignedEmps = employees.filter((e) => assignedEmpIds.includes(e.id));
      const emails = assignedEmps.map((e) => e.email).filter(Boolean);
      if (emails.length === 0) return;
      const { data: assignments } = emails.length > 0
        ? await supabase.from("user_role_assignments").select("email, user_id").in("email", emails).is("deleted_at", null)
        : { data: [] };
      const userIdsByEmail = new Map((assignments || [])
        .filter((a: any) => a.user_id)
        .map((a: any) => [a.email.toLowerCase(), a.user_id]));
      await Promise.all(assignedEmps.map((emp) => {
        const recipientUserId = userIdsByEmail.get(emp.email.toLowerCase());
        if (!recipientUserId) return Promise.resolve();
        return notify({
          source: "tasks",
          type: "info",
          title: "New Task Assigned",
          message: `${assignerName} assigned you "${taskTitle}".`,
          entityId: taskId || null,
          recipientUserId,
        });
      }));
    };

    if (editingTask) {
      if (!form.title.trim() || !form.assigned_to || !myEmployee) return;
      setSaving(true);
      const prevAssignedTo = editingTask.assigned_to;
      const { error } = await supabase.from("tasks").update({
        title: form.title.trim(),
        description: form.description || null,
        assigned_to: form.assigned_to,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        completed_at: form.status === "done" ? (editingTask.completed_at || new Date().toISOString()) : null,
        is_outside_work: form.is_outside_work,
        updated_at: new Date().toISOString(),
      }).eq("id", editingTask.id);
      setSaving(false);
      if (error) { showToast("error", "Couldn't update task."); return; }
      if (form.assigned_to !== prevAssignedTo) {
        await sendTaskNotifications([form.assigned_to], form.title.trim(), editingTask.id);
      }
      showToast("success", "Task updated successfully.");

      if (form.assigned_to !== editingTask.assigned_to) {
        notifyTaskAssignees({
          employeeIds: [form.assigned_to],
          employees: assignableEmployees,
          actorUserId: user?.id,
          title: "Task assigned to you",
          message: `"${form.title.trim()}" was assigned to you${form.due_date ? ` — due ${formatDueDate(form.due_date)}` : ""}.`,
          entityId: editingTask.id,
        });
      }
    } else {
      if (!form.title.trim() || assignedToIds.length === 0 || !myEmployee) return;
      setSaving(true);
      const payload = assignedToIds.map((empId) => ({
        title: form.title.trim(),
        description: form.description || null,
        assigned_to: empId,
        assigned_by: myEmployee.id,
        status: form.status,
        priority: form.priority,
        due_date: form.due_date || null,
        completed_at: form.status === "done" ? new Date().toISOString() : null,
        is_outside_work: form.is_outside_work,
      }));
      const { data: inserted, error } = await supabase.from("tasks").insert(payload).select("id");
      setSaving(false);
      if (error) { showToast("error", "Couldn't create task."); return; }

      if (form.is_outside_work && inserted?.[0]?.id && (owLocation || owFiles.length > 0)) {
        const taskId = inserted[0].id;
        const mediaItems: MediaItem[] = [];
        for (let i = 0; i < owFiles.length; i++) {
          const item = await uploadMediaToS3(owFiles[i].file, `outside-work/${taskId}/in`);
          mediaItems.push(item);
        }
        const checkInData: Record<string, any> = {};
        if (owLocation) {
          checkInData.work_lat = owLocation.lat;
          checkInData.work_lng = owLocation.lng;
          checkInData.work_accuracy_m = owLocation.accuracy;
          checkInData.work_address = owLocation.address;
        }
        if (mediaItems.length > 0) {
          checkInData.work_image_url = mediaItems[0].url;
          checkInData.work_media_urls = mediaItems;
        }
        checkInData.work_status = "checked_in";
        checkInData.work_checked_in_at = new Date().toISOString();
        await supabase.from("tasks").update(checkInData).eq("id", taskId);

        const todayStr = today();
        const now = new Date();
        const timeStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}:${String(now.getSeconds()).padStart(2, "0")}`;
        await supabase.from("attendance_records").upsert({
          employee_id: myEmployee.id,
          date: todayStr,
          clock_in: timeStr,
          status: "present",
          notes: `Outside work: check-in at ${owLocation?.address || "unknown location"}`,
        }, { onConflict: "employee_id,date" });

        setOwLocation(null);
        setOwFiles([]);
      }

      await sendTaskNotifications(assignedToIds, form.title.trim(), inserted?.[0]?.id);
      showToast("success", `${assignedToIds.length} task${assignedToIds.length === 1 ? "" : "s"} created successfully.`);

      notifyTaskAssignees({
        employeeIds: assignedToIds,
        employees: assignableEmployees,
        actorUserId: user?.id,
        title: "New task assigned",
        message: `"${form.title.trim()}" was assigned to you${form.due_date ? ` — due ${formatDueDate(form.due_date)}` : ""}.`,
      });
    }
    closeModal();
    loadData();
  };

  const handleStatusChange = async (t: Task, status: Task["status"]) => {
    const { error } = await supabase.from("tasks").update({
      status,
      completed_at: status === "done" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", t.id);
    if (error) showToast("error", "Couldn't update status.");
    else {
      setTasks((prev) =>
        prev.map((item) => (item.id === t.id ? { ...item, status, completed_at: status === "done" ? new Date().toISOString() : null } : item))
      );
    }
  };

  const handleDelete = async (t: Task) => {
    if (!confirm(`Delete "${t.title}"? It will be moved to the Recycle Bin and can be restored anytime.`)) return;
    const { error } = await supabase
      .from("tasks")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", t.id);
    if (error) showToast("error", "Couldn't delete task.");
    else {
      showToast("success", "Task moved to Recycle Bin.");
      closeModal();
      loadData();
    }
  };

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData("text/plain", taskId);
    setDraggedTaskId(taskId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: Task["status"]) => {
    e.preventDefault();
    const taskId = e.dataTransfer.getData("text/plain") || draggedTaskId;
    setDraggedTaskId(null);
    if (!taskId) return;
    const task = tasks.find((t) => t.id === taskId);
    if (!task || task.status === targetStatus) return;
    handleStatusChange(task, targetStatus);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (filterQuickState === "my_tasks" && myEmployee && t.assigned_to !== myEmployee.id) return false;
      if (filterQuickState === "overdue" && !isOverdue(t)) return false;
      if (filterQuickState === "high_priority" && !["high", "urgent"].includes(t.priority)) return false;

      if (filterPriority !== "all" && t.priority !== filterPriority) return false;

      if (filterAssignee !== "all" && t.assigned_to !== filterAssignee) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const empName = t.employees ? `${t.employees.first_name} ${t.employees.last_name}`.toLowerCase() : "";
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = (t.description || "").toLowerCase().includes(q);
        const matchEmp = empName.includes(q);
        const matchDept = (t.employees?.department || "").toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchEmp && !matchDept) return false;
      }

      return true;
    });
  }, [tasks, filterQuickState, filterPriority, filterAssignee, searchQuery, myEmployee]);

  const tasksByStatus = useMemo(() => {
    const map: Record<Task["status"], Task[]> = { todo: [], in_progress: [], blocked: [], done: [] };
    for (const t of filteredTasks) map[t.status]?.push(t);
    return map;
  }, [filteredTasks]);
  const tasksFor = (status: Task["status"]) => tasksByStatus[status];

  const totalOverdue = tasks.filter(isOverdue).length;
  const totalDone = tasks.filter((t) => t.status === "done").length;
  const totalInProgress = tasks.filter((t) => t.status === "in_progress").length;
  const totalBlocked = tasks.filter((t) => t.status === "blocked").length;

  const reportDateRange = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (reportPreset === "today") {
      const end = new Date(startOfDay);
      end.setDate(end.getDate() + 1);
      return { from: startOfDay.toISOString(), to: end.toISOString() };
    }
    if (reportPreset === "week") {
      const day = startOfDay.getDay();
      const start = new Date(startOfDay);
      start.setDate(start.getDate() - day);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (reportPreset === "month") {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      return { from: start.toISOString(), to: end.toISOString() };
    }
    if (reportPreset === "custom" && reportFrom && reportTo) {
      const from = new Date(reportFrom);
      const to = new Date(reportTo);
      to.setDate(to.getDate() + 1);
      return { from: from.toISOString(), to: to.toISOString() };
    }
    return null;
  }, [reportPreset, reportFrom, reportTo]);

  const report = useMemo(() => {
    const filteredTasks = reportDateRange
      ? tasks.filter((t) => {
          const d = t.created_at;
          return d >= reportDateRange.from && d < reportDateRange.to;
        })
      : tasks;
    const filteredEmployees = reportFilterEmpId
      ? employees.filter((e) => e.id === reportFilterEmpId)
      : employees;
    return filteredEmployees.map((e) => {
      const own = filteredTasks.filter((t) => t.assigned_to === e.id);
      const done = own.filter((t) => t.status === "done").length;
      const inProg = own.filter((t) => t.status === "in_progress").length;
      const blocked = own.filter((t) => t.status === "blocked").length;
      const overdue = own.filter(isOverdue).length;
      const completionRate = own.length ? Math.round((done / own.length) * 100) : 0;
      return { employee: e, total: own.length, done, inProg, blocked, overdue, completionRate };
    }).filter((r) => r.total > 0).sort((a, b) => b.total - a.total);
  }, [employees, tasks, reportDateRange, reportFilterEmpId]);

  const myReport = useMemo(() => {
    // If admin filtered to a specific employee, use that employee
    const targetEmp = myReportFilterEmpId
      ? employees.find((e) => e.id === myReportFilterEmpId) || myEmployee
      : myEmployee;
    if (!targetEmp) return null;
    const filteredTasks = reportDateRange
      ? tasks.filter((t) => {
          const d = t.created_at;
          return d >= reportDateRange.from && d < reportDateRange.to;
        })
      : tasks;

    const subordinateIds = new Set(
      employees.filter((e) => e.reports_to === targetEmp.id).map((e) => e.id)
    );

    const mine = filteredTasks.filter((t) =>
      t.assigned_to === targetEmp.id || subordinateIds.has(t.assigned_to)
    );

    const done = mine.filter((t) => t.status === "done").length;
    const inProg = mine.filter((t) => t.status === "in_progress").length;
    const todo = mine.filter((t) => t.status === "todo").length;
    const blocked = mine.filter((t) => t.status === "blocked").length;
    const overdue = mine.filter(isOverdue).length;
    const completionRate = mine.length ? Math.round((done / mine.length) * 100) : 0;
    return { total: mine.length, done, inProg, todo, blocked, overdue, completionRate, tasks: mine, subordinateCount: subordinateIds.size, targetEmployee: targetEmp };
  }, [myEmployee, employees, tasks, reportDateRange, myReportFilterEmpId]);

  // ─── ADMIN REPORT: per-employee detailed task lists ───────────────
  const adminReport = useMemo(() => {
    const filteredTasks = reportDateRange
      ? tasks.filter((t) => {
          const d = t.created_at;
          return d >= reportDateRange.from && d < reportDateRange.to;
        })
      : tasks;
    const q = adminReportSearch.toLowerCase().trim();
    const filteredEmployees = employees.filter((e) => {
      if (adminReportDeptFilter !== "all" && e.department !== adminReportDeptFilter) return false;
      if (q && !`${e.first_name} ${e.last_name} ${e.department || ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
    return filteredEmployees
      .map((e) => {
        const own = filteredTasks.filter((t) => t.assigned_to === e.id);
        const done = own.filter((t) => t.status === "done").length;
        const inProg = own.filter((t) => t.status === "in_progress").length;
        const blocked = own.filter((t) => t.status === "blocked").length;
        const todo = own.filter((t) => t.status === "todo").length;
        const overdue = own.filter(isOverdue).length;
        const completionRate = own.length ? Math.round((done / own.length) * 100) : 0;
        return { employee: e, total: own.length, done, inProg, blocked, todo, overdue, completionRate, tasks: own };
      })
      .filter((r) => r.total > 0)
      .sort((a, b) => b.total - a.total);
  }, [employees, tasks, reportDateRange, adminReportSearch, adminReportDeptFilter]);

  const adminReportDepartments = useMemo(() => {
    const depts = new Set(employees.map((e) => e.department).filter(Boolean));
    return Array.from(depts).sort();
  }, [employees]);

  // Fetch task activities when admin report is visible (for working time tracking)
  useEffect(() => {
    if (view !== "admin_report" || !canManage) return;
    const taskIds = adminReport.flatMap((r) => r.tasks.map((t) => t.id));
    if (taskIds.length === 0) { setAdminTaskActivities({}); return; }
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("task_activities")
        .select("task_id, action, old_value, new_value, created_at")
        .in("task_id", taskIds)
        .eq("action", "status_changed")
        .order("created_at", { ascending: true });
      const grouped: Record<string, TaskActivity[]> = {};
      (data || []).forEach((a: TaskActivity) => {
        if (!grouped[a.task_id]) grouped[a.task_id] = [];
        grouped[a.task_id].push(a);
      });
      setAdminTaskActivities(grouped);
    };
    fetchActivities();
  }, [view, canManage, adminReport]);

  // Fetch task activities when my_report is visible (for working time tracking)
  useEffect(() => {
    if (view !== "my_report" || !myReport) return;
    const taskIds = myReport.tasks.map((t) => t.id);
    if (taskIds.length === 0) { setMyTaskActivities({}); return; }
    const fetchActivities = async () => {
      const { data } = await supabase
        .from("task_activities")
        .select("task_id, action, old_value, new_value, created_at")
        .in("task_id", taskIds)
        .eq("action", "status_changed")
        .order("created_at", { ascending: true });
      const grouped: Record<string, TaskActivity[]> = {};
      (data || []).forEach((a: TaskActivity) => {
        if (!grouped[a.task_id]) grouped[a.task_id] = [];
        grouped[a.task_id].push(a);
      });
      setMyTaskActivities(grouped);
    };
    fetchActivities();
  }, [view, myReport]);

  // Compute working time from status_changed activities (in_progress → done)
  const getTaskWorkingTime = useCallback((task: Task, activityMap?: Record<string, TaskActivity[]>) => {
    const acts = (activityMap || adminTaskActivities)[task.id] || [];
    let startedAt: string | null = null;
    let endedAt: string | null = null;
    for (const a of acts) {
      if (a.new_value === "in_progress" && !startedAt) startedAt = a.created_at;
      if (a.new_value === "done" && !endedAt) endedAt = a.created_at;
    }
    return { startedAt, endedAt, duration: startedAt ? fmtDuration(startedAt, endedAt) : null };
  }, [adminTaskActivities]);

  // ─── EXPORT: Admin Report – Individual Employee CSV ─────────────────
  const exportAdminEmpCSV = (emp: Employee, empTasks: Task[]) => {
    if (empTasks.length === 0) { showToast("export", "No tasks to export", "warning"); return; }
    const headers = ["Title", "Description", "Priority", "Status", "Due Date", "Work Started", "Work Completed", "Duration"];
    const rows = empTasks.map((t) => {
      const wt = getTaskWorkingTime(t);
      return [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.priority, STATUS_CONFIG[t.status]?.label || t.status, t.due_date || "",
      wt.startedAt || "", wt.endedAt || "", wt.duration || "",
    ]; });
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `task_report_${emp.first_name}_${emp.last_name}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast("success", `Exported ${empTasks.length} tasks to CSV`);
  };

  // ─── EXPORT: Admin Report – Individual Employee XLSX ────────────────
  const exportAdminEmpXLSX = async (emp: Employee, empTasks: Task[]) => {
    if (empTasks.length === 0) { showToast("export", "No tasks to export"); return; }
    const data = empTasks.map((t) => {
      const wt = getTaskWorkingTime(t);
      return ({
      Title: t.title, Description: t.description || "", Priority: t.priority,
      Status: STATUS_CONFIG[t.status]?.label || t.status,
      "Due Date": t.due_date || "", "Work Started": wt.startedAt || "", "Work Completed": wt.endedAt || "", Duration: wt.duration || "",
    }); });
    const headers = Object.keys(data[0]);
    const aoa = [headers, ...data.map((r) => headers.map((h) => r[h as keyof typeof r]))];
    const XLSX = await getXLSX();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map((c) => ({ wch: Math.max(c.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Task Report");
    XLSX.writeFile(wb, `task_report_${emp.first_name}_${emp.last_name}_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("success", `Exported ${empTasks.length} tasks to Excel`);
  };

  // ─── EXPORT: Admin Report – Individual Employee PDF ─────────────────
  const exportAdminEmpPDF = (emp: Employee, empTasks: Task[]) => {
    if (empTasks.length === 0) { showToast("export", "No tasks to export", "warning"); return; }
    const headers = ["Title", "Description", "Priority", "Status", "Due Date", "Work Started", "Work Completed", "Duration"];
    const rows = empTasks.map((t) => {
      const wt = getTaskWorkingTime(t);
      return `<tr><td>${t.title}</td><td>${t.description || "—"}</td><td>${t.priority}</td><td>${STATUS_CONFIG[t.status]?.label || t.status}</td><td>${t.due_date || "—"}</td><td>${wt.startedAt ? formatExact(wt.startedAt) : "—"}</td><td>${wt.endedAt ? formatExact(wt.endedAt) : "—"}</td><td>${wt.duration || "—"}</td></tr>`;
    }).join("");
    const done = empTasks.filter((t) => t.status === "done").length;
    const inProg = empTasks.filter((t) => t.status === "in_progress").length;
    const todo = empTasks.filter((t) => t.status === "todo").length;
    const overdue = empTasks.filter(isOverdue).length;
    const rate = empTasks.length ? Math.round((done / empTasks.length) * 100) : 0;
    const html = `<!DOCTYPE html><html><head><title>Task Report – ${emp.first_name} ${emp.last_name}</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
      h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;padding:8px 10px;background:#253C7D;color:#fff;font-size:11px;text-transform:uppercase}
      td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
      .kpi{display:inline-block;margin-right:20px;padding:8px 16px;border:1px solid #e5e7eb;border-radius:8px;text-align:center}
      .kpi .num{font-size:22px;font-weight:800;margin-bottom:2px}.kpi .lbl{font-size:10px;color:#999;text-transform:uppercase}
    </style></head><body>
      <h1>HRM_OPS — Task Report: ${emp.first_name} ${emp.last_name}</h1>
      <p>Department: ${emp.department || "—"} · Generated: ${new Date().toLocaleString("en-US")} · ${empTasks.length} tasks</p>
      <div style="margin-bottom:20px">
        <div class="kpi"><div class="num">${empTasks.length}</div><div class="lbl">Total</div></div>
        <div class="kpi"><div class="num">${done}</div><div class="lbl">Done</div></div>
        <div class="kpi"><div class="num">${inProg}</div><div class="lbl">In Progress</div></div>
        <div class="kpi"><div class="num">${todo}</div><div class="lbl">To Do</div></div>
        <div class="kpi"><div class="num">${overdue}</div><div class="lbl">Overdue</div></div>
        <div class="kpi"><div class="num">${rate}%</div><div class="lbl">Completion</div></div>
      </div>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">HRM_OPS HRMS · Confidential</div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
    showToast("success", "PDF print dialog opened");
  };

  // ─── EXPORT: Admin Report – All Employees CSV ──────────────────────
  const exportAdminAllCSV = () => {
    if (adminReport.length === 0) { showToast("export", "No data to export", "warning"); return; }
    const headers = ["Employee", "Department", "Task", "Description", "Priority", "Status", "Due Date", "Work Started", "Work Completed", "Duration"];
    const rows = adminReport.flatMap((r) =>
      r.tasks.map((t) => {
        const wt = getTaskWorkingTime(t);
        return [
        `"${r.employee.first_name} ${r.employee.last_name}"`,
        `"${r.employee.department || ""}"`,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${(t.description || "").replace(/"/g, '""')}"`,
        t.priority, STATUS_CONFIG[t.status]?.label || t.status, t.due_date || "",
        wt.startedAt || "", wt.endedAt || "", wt.duration || "",
      ]; })
    );
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `admin_task_report_all_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast("success", `Exported all tasks to CSV`);
  };

  // ─── EXPORT: Admin Report – All Employees XLSX ─────────────────────
  const exportAdminAllXLSX = async () => {
    if (adminReport.length === 0) { showToast("export", "No data to export"); return; }
    const data = adminReport.flatMap((r) =>
      r.tasks.map((t) => {
        const wt = getTaskWorkingTime(t);
        return ({
        Employee: `${r.employee.first_name} ${r.employee.last_name}`,
        Department: r.employee.department || "",
        Task: t.title, Description: t.description || "", Priority: t.priority,
        Status: STATUS_CONFIG[t.status]?.label || t.status,
        "Due Date": t.due_date || "", "Work Started": wt.startedAt || "", "Work Completed": wt.endedAt || "", Duration: wt.duration || "",
      }); })
    );
    const headers = Object.keys(data[0]);
    const aoa = [headers, ...data.map((r) => headers.map((h) => r[h as keyof typeof r]))];
    const XLSX = await getXLSX();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map((c) => ({ wch: Math.max(c.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Admin Task Report");
    XLSX.writeFile(wb, `admin_task_report_all_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast("success", `Exported all tasks to Excel`);
  };

  // ─── EXPORT: Admin Report – All Employees PDF ──────────────────────
  const exportAdminAllPDF = () => {
    if (adminReport.length === 0) { showToast("export", "No data to export", "warning"); return; }
    const headers = ["Employee", "Department", "Task", "Description", "Priority", "Status", "Due Date", "Work Started", "Work Completed", "Duration"];
    const rows = adminReport.flatMap((r) =>
      r.tasks.map((t) => {
        const wt = getTaskWorkingTime(t);
        return `<tr><td>${r.employee.first_name} ${r.employee.last_name}</td><td>${r.employee.department || "—"}</td><td>${t.title}</td><td>${t.description || "—"}</td><td>${t.priority}</td><td>${STATUS_CONFIG[t.status]?.label || t.status}</td><td>${t.due_date || "—"}</td><td>${wt.startedAt ? formatExact(wt.startedAt) : "—"}</td><td>${wt.endedAt ? formatExact(wt.endedAt) : "—"}</td><td>${wt.duration || "—"}</td></tr>`;
      })
    ).join("");
    const html = `<!DOCTYPE html><html><head><title>Admin Task Report</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
      h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;padding:8px 10px;background:#253C7D;color:#fff;font-size:11px;text-transform:uppercase}
      td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
    </style></head><body>
      <h1>HRM_OPS — Admin Task Report</h1>
      <p>Generated: ${new Date().toLocaleString("en-US")} · ${adminReport.length} employees · ${adminReport.reduce((s, r) => s + r.tasks.length, 0)} tasks</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">HRM_OPS HRMS · Confidential</div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
    showToast("success", "PDF print dialog opened");
  };

  // ─── EXPORT: Team Report CSV ───────────────────────────────────────
  const exportTeamReportCSV = () => {
    if (report.length === 0) { toast("Export", "No data to export", "warning"); return; }
    const headers = ["Employee", "Department", "Total", "Done", "In Progress", "Blocked", "Overdue", "Completion %"];
    const rows = report.map((r) => [
      `"${r.employee.first_name} ${r.employee.last_name}"`,
      `"${r.employee.department || ""}"`,
      r.total, r.done, r.inProg, r.blocked, r.overdue, `${r.completionRate}%`,
    ]);
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `team_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast("Export Complete", `Exported ${report.length} rows to CSV`, "success");
  };

  // ─── EXPORT: Team Report XLSX ──────────────────────────────────────
  const exportTeamReportXLSX = () => {
    if (report.length === 0) { toast("Export", "No data to export", "warning"); return; }
    const data = report.map((r) => ({
      Employee: `${r.employee.first_name} ${r.employee.last_name}`,
      Department: r.employee.department || "",
      Total: r.total, Done: r.done, "In Progress": r.inProg, Blocked: r.blocked, Overdue: r.overdue, "Completion %": r.completionRate,
    }));
    const headers = Object.keys(data[0]);
    const aoa = [headers, ...data.map((r) => headers.map((h) => r[h]))];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map((c) => ({ wch: Math.max(c.length + 2, 12) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Team Report");
    XLSX.writeFile(wb, `team_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast("Export Complete", `Exported ${report.length} rows to Excel`, "success");
  };

  // ─── EXPORT: Team Report PDF ───────────────────────────────────────
  const exportTeamReportPDF = () => {
    if (report.length === 0) { toast("Export", "No data to export", "warning"); return; }
    const headers = ["Employee", "Department", "Total", "Done", "In Progress", "Blocked", "Overdue", "Completion"];
    const rows = report.map((r) =>
      `<tr><td>${r.employee.first_name} ${r.employee.last_name}</td><td>${r.employee.department || "—"}</td><td>${r.total}</td><td>${r.done}</td><td>${r.inProg}</td><td>${r.blocked}</td><td>${r.overdue}</td><td>${r.completionRate}%</td></tr>`
    ).join("");
    const html = `<!DOCTYPE html><html><head><title>Team Report</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
      h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;padding:8px 10px;background:#253C7D;color:#fff;font-size:11px;text-transform:uppercase}
      td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
    </style></head><body>
      <h1>HRM_OPS — Team Task Report</h1>
      <p>Generated: ${new Date().toLocaleString("en-US")} · ${report.length} employees</p>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">HRM_OPS HRMS · Confidential</div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
    toast("Export Ready", "PDF print dialog opened", "success");
  };

  // ─── EXPORT: My Report CSV ─────────────────────────────────────────
  const exportMyReportCSV = () => {
    if (!myReport || myReport.tasks.length === 0) { toast("Export", "No tasks to export", "warning"); return; }
    const headers = ["Title", "Description", "Priority", "Status", "Due Date", "Work Started", "Work Completed", "Duration", "Created"];
    const rows = myReport.tasks.map((t) => {
      const wt = getTaskWorkingTime(t, myTaskActivities);
      return [
      `"${t.title.replace(/"/g, '""')}"`,
      `"${(t.description || "").replace(/"/g, '""')}"`,
      t.priority, t.status, t.due_date || "", wt.startedAt || "", wt.endedAt || "", wt.duration || "", t.created_at.slice(0, 10),
    ]; });
    const csv = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");
    const a = document.createElement("a");
    a.setAttribute("href", encodeURI(csv));
    a.setAttribute("download", `my_report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    toast("Export Complete", `Exported ${myReport.tasks.length} tasks to CSV`, "success");
  };

  // ─── EXPORT: My Report XLSX ────────────────────────────────────────
  const exportMyReportXLSX = async () => {
    if (!myReport || myReport.tasks.length === 0) { toast("Export", "No tasks to export", "warning"); return; }
    const data = myReport.tasks.map((t) => {
      const wt = getTaskWorkingTime(t, myTaskActivities);
      return ({
      Title: t.title, Description: t.description || "", Priority: t.priority, Status: t.status,
      "Due Date": t.due_date || "", "Work Started": wt.startedAt || "", "Work Completed": wt.endedAt || "", Duration: wt.duration || "", Created: t.created_at.slice(0, 10),
    }); });
    const headers = Object.keys(data[0]);
    const aoa = [headers, ...data.map((r) => headers.map((h) => r[h as keyof typeof r]))];
    const XLSX = await getXLSX();
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws["!cols"] = headers.map((c) => ({ wch: Math.max(c.length + 2, 14) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "My Report");
    XLSX.writeFile(wb, `my_report_${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast("Export Complete", `Exported ${myReport.tasks.length} tasks to Excel`, "success");
  };

  // ─── EXPORT: My Report PDF ─────────────────────────────────────────
  const exportMyReportPDF = () => {
    if (!myReport || myReport.tasks.length === 0) { toast("Export", "No tasks to export", "warning"); return; }
    const headers = ["Title", "Description", "Priority", "Status", "Due Date", "Work Started", "Work Completed", "Duration", "Created"];
    const rows = myReport.tasks.map((t) => {
      const wt = getTaskWorkingTime(t, myTaskActivities);
      return `<tr><td>${t.title}</td><td>${t.description || "—"}</td><td>${t.priority}</td><td>${t.status}</td><td>${t.due_date || "—"}</td><td>${wt.startedAt ? formatExact(wt.startedAt) : "—"}</td><td>${wt.endedAt ? formatExact(wt.endedAt) : "—"}</td><td>${wt.duration || "—"}</td><td>${t.created_at.slice(0, 10)}</td></tr>`;
    }).join("");
    const html = `<!DOCTYPE html><html><head><title>My Report</title><style>
      body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
      h1{font-size:20px;margin-bottom:4px}p{font-size:12px;color:#666;margin-bottom:20px}
      table{width:100%;border-collapse:collapse}
      th{text-align:left;padding:8px 10px;background:#253C7D;color:#fff;font-size:11px;text-transform:uppercase}
      td{padding:6px 10px;border-bottom:1px solid #f0f0f0;font-size:12px}
      .footer{margin-top:20px;font-size:10px;color:#999;text-align:right}
      .kpi{display:inline-block;margin-right:20px;padding:8px 16px;border:1px solid #e5e7eb;border-radius:8px;text-align:center}
      .kpi .num{font-size:22px;font-weight:800;margin-bottom:2px}.kpi .lbl{font-size:10px;color:#999;text-transform:uppercase}
    </style></head><body>
      <h1>HRM_OPS — My Task Report</h1>
      <p>Generated: ${new Date().toLocaleString("en-US")} · ${myReport.tasks.length} tasks</p>
      <div style="margin-bottom:20px">
        <div class="kpi"><div class="num">${myReport.total}</div><div class="lbl">Total</div></div>
        <div class="kpi"><div class="num">${myReport.done}</div><div class="lbl">Done</div></div>
        <div class="kpi"><div class="num">${myReport.inProg}</div><div class="lbl">In Progress</div></div>
        <div class="kpi"><div class="num">${myReport.todo}</div><div class="lbl">To Do</div></div>
        <div class="kpi"><div class="num">${myReport.overdue}</div><div class="lbl">Overdue</div></div>
        <div class="kpi"><div class="num">${myReport.completionRate}%</div><div class="lbl">Completion</div></div>
      </div>
      <table><thead><tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr></thead>
      <tbody>${rows}</tbody></table>
      <div class="footer">HRM_OPS HRMS · Confidential</div>
    </body></html>`;
    const w = window.open("", "_blank");
    if (w) { w.document.write(html); w.document.close(); setTimeout(() => w.print(), 400); }
    toast("Export Ready", "PDF print dialog opened", "success");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8F9FB]">
        <div className="w-9 h-9 border-3 border-[#253C7D] border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-semibold text-gray-500">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] p-5 sm:p-7 lg:p-8 font-sans">
      {/* Floating Toast Notification */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-semibold text-white shadow-xl flex items-center gap-2 animate-in fade-in slide-in-from-top-3 ${
            toast.type === "success" ? "bg-[#253C7D]" : "bg-rose-600"
          }`}
        >
          <i className={toast.type === "success" ? "ri-checkbox-circle-fill text-emerald-300" : "ri-error-warning-fill"} />
          {toast.message}
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Workspace</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Task Management</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Tasks & Workflows
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
              Live Board
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {canManage
              ? "Coordinate assignments, monitor milestone delivery, and track team execution in real-time."
              : "Organize your daily responsibilities, update progress, and meet project deadlines."}
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => openCreate()}
            className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
          >
            <i className="ri-add-line text-base font-bold" />
            New Task
                </button>
              </div>
      </div>

      {/* Executive KPI Summary Cards (Interactive Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5 mb-6">
        {/* Total */}
        <div
          onClick={() => setFilterQuickState("all")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterQuickState === "all" ? "border-[#253C7D] ring-2 ring-[#253C7D]/10" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Total Tasks</span>
            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center">
              <i className="ri-task-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-gray-900 mt-2">{tasks.length}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Across all departments</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-[#253C7D]" />
        </div>

        {/* In Progress */}
        <div
          onClick={() => setFilterQuickState("all")}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-sky-600 uppercase tracking-wider">In Progress</span>
            <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
              <i className="ri-progress-4-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-sky-700 mt-2">{totalInProgress}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Active execution</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-sky-500" />
        </div>

        {/* Blocked */}
        <div
          onClick={() => setFilterQuickState("all")}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider">Blocked</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <i className="ri-error-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-700 mt-2">{totalBlocked}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">Awaiting resolution</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-amber-500" />
        </div>

        {/* Overdue */}
        <div
          onClick={() => setFilterQuickState(filterQuickState === "overdue" ? "all" : "overdue")}
          className={`bg-white border rounded-2xl p-4 transition-all cursor-pointer shadow-2xs hover:shadow-xs relative overflow-hidden group ${
            filterQuickState === "overdue" ? "border-rose-500 ring-2 ring-rose-500/10 bg-rose-50/20" : "border-gray-200/80"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider">Overdue</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <i className="ri-alarm-warning-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-rose-700 mt-2">{totalOverdue}</p>
          <p className="text-[11px] text-rose-500/80 mt-0.5 font-medium">Requires attention</p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500" />
        </div>

        {/* Completed */}
        <div
          onClick={() => setFilterQuickState("all")}
          className="bg-white border border-gray-200/80 rounded-2xl p-4 transition-all shadow-2xs hover:shadow-xs relative overflow-hidden group"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider">Completed</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <i className="ri-checkbox-circle-line text-sm" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-700 mt-2">{totalDone}</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            {tasks.length > 0 ? `${Math.round((totalDone / tasks.length) * 100)}% overall completion` : "0% completion"}
          </p>
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500" />
        </div>
      </div>

      {/* Productivity Control Bar: View Switcher, Live Search, & Filters */}
      <div className="bg-white rounded-2xl border border-gray-200/80 p-3.5 shadow-2xs mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Left: View Modes & Quick Pills */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200/60">
            <button
              onClick={() => setView("board")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                view === "board" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-layout-masonry-line text-sm" />
              Board
            </button>
            <button
              onClick={() => setView("list")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                view === "list" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-list-check-2 text-sm" />
              List
            </button>
            {canManage && (
              <button
                onClick={() => setView("report")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  view === "report" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-bar-chart-box-line text-sm" />
                Team Matrix
              </button>
            )}
            {canManage && (
              <button
                onClick={() => setView("admin_report")}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  view === "admin_report" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                <i className="ri-file-list-3-line text-sm" />
                Task Reports
              </button>
            )}
            <button
              onClick={() => setView("my_report")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                view === "my_report" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-800"
              }`}
            >
              <i className="ri-pie-chart-line text-sm" />
              My Report
            </button>
          </div>

          <div className="h-5 w-px bg-gray-200 hidden sm:block" />

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              onClick={() => setFilterQuickState("all")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border ${
                filterQuickState === "all"
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              All Tasks
            </button>
            <button
              onClick={() => setFilterQuickState(filterQuickState === "my_tasks" ? "all" : "my_tasks")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                filterQuickState === "my_tasks"
                  ? "bg-[#253C7D] text-white border-[#253C7D]"
                  : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
              }`}
            >
              <i className="ri-user-smile-line text-xs" />
              Assigned to Me
            </button>
            <button
              onClick={() => setFilterQuickState(filterQuickState === "high_priority" ? "all" : "high_priority")}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer border flex items-center gap-1 ${
                filterQuickState === "high_priority"
                  ? "bg-amber-600 text-white border-amber-600"
                  : "bg-white text-amber-700 border-amber-200 hover:bg-amber-50"
              }`}
            >
              <i className="ri-fire-line text-xs" />
              High / Urgent
            </button>
          </div>
        </div>

        {/* Right: Live Search & Dropdowns */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Search Box */}
          <div className="relative w-full sm:w-60">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search title, assignee..."
              className="w-full pl-8 pr-7 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
              >
                <i className="ri-close-circle-fill text-xs" />
              </button>
            )}
          </div>

          {/* Priority Select */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Assignee Select */}
          {canManage && employees.length > 0 && (
            <select
              value={filterAssignee}
              onChange={(e) => setFilterAssignee(e.target.value)}
              className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer max-w-[150px] truncate"
            >
              <option value="all">All Assignees</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.first_name} {e.last_name}
                </option>
              ))}
            </select>
          )}

          {/* Reset Filters */}
          {(searchQuery || filterPriority !== "all" || filterAssignee !== "all" || filterQuickState !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setFilterPriority("all");
                setFilterAssignee("all");
                setFilterQuickState("all");
              }}
              title="Reset all filters"
              className="px-2 py-1.5 text-xs text-gray-400 hover:text-rose-600 transition-colors cursor-pointer"
            >
              <i className="ri-refresh-line text-sm" />
            </button>
          )}
        </div>
      </div>

      {/* Main View Display */}

      {/* 1. KANBAN BOARD VIEW */}
      {view === "board" && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 items-start">
          {STATUS_COLUMNS.map((col) => {
            const colConfig = STATUS_CONFIG[col.key];
            const colTasks = tasksFor(col.key);

            return (
              <div
                key={col.key}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, col.key)}
                className={`bg-white rounded-2xl border ${colConfig.border} shadow-2xs overflow-hidden flex flex-col min-h-[580px] transition-all`}
              >
                {/* Column Header */}
                <div className={`px-4 py-3 border-b border-gray-100 ${colConfig.headerBg} flex items-center justify-between`}>
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: colConfig.accent }} />
                    <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">{col.label}</h3>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white border border-gray-200/80 text-gray-600 shadow-2xs">
                      {colTasks.length}
                    </span>
                  </div>

                  <button
                    onClick={() => openCreate(col.key)}
                    title={`Add task to ${col.label}`}
                    className="w-6 h-6 rounded-lg bg-white border border-gray-200/80 text-gray-500 hover:text-gray-900 hover:bg-gray-50 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <i className="ri-add-line text-xs font-bold" />
                  </button>
                </div>

                {/* Column Tasks List */}
                <div className="p-3 space-y-2.5 flex-1 overflow-y-auto max-h-[720px] no-scrollbar">
                  {colTasks.map((t) => {
                    const priorityMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                    const overdue = isOverdue(t);
                    const empName = t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned";

                    return (
                      <div
                        key={t.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, t.id)}
                        onClick={() => openEdit(t)}
                        className={`bg-white rounded-xl p-3.5 border transition-all cursor-pointer group hover:shadow-md ${
                          draggedTaskId === t.id ? "opacity-40 border-dashed border-[#253C7D]" : "border-gray-200/80 hover:border-[#253C7D]/40"
                        }`}
                      >
                        {/* Top: Priority Badge & Action Options */}
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-md border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border} uppercase tracking-wider shadow-2xs`}
                          >
                            <i className={`${priorityMeta.icon} text-xs`} />
                            {priorityMeta.label}
                          </span>

                          <div className="flex items-center gap-1">
                            {/* Fast status toggle button */}
                            {t.status !== "done" ? (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleStatusChange(t, "done");
                                }}
                                title="Mark as completed"
                                className="w-5 h-5 rounded-md text-gray-300 hover:text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition-colors cursor-pointer"
                              >
                                <i className="ri-checkbox-blank-circle-line text-sm" />
                              </button>
                            ) : (
                              <span className="text-emerald-600" title="Completed">
                                <i className="ri-checkbox-circle-fill text-sm" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <h4 className={`text-[13px] font-bold text-gray-900 leading-snug group-hover:text-[#253C7D] transition-colors ${
                          t.status === "done" ? "line-through text-gray-400" : ""
                        }`}>
                          {t.title}
                        </h4>

                        {t.description && (
                          <p className="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {t.description}
                          </p>
                        )}

                        {/* Bottom: Assignee & Deadline Info */}
                        <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between gap-2 text-xs">
                          {/* Assignee Avatar */}
                          <div className="flex items-center gap-1.5 min-w-0">
                            {t.employees?.avatar_url ? (
                              <img src={t.employees.avatar_url} alt="" className="w-5 h-5 rounded-full object-cover shrink-0" />
                            ) : (
                              <div className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-extrabold flex items-center justify-center shrink-0">
                                {initials(empName)}
                              </div>
                            )}
                            <span className="text-[11px] font-semibold text-gray-600 truncate">{empName}</span>
                          </div>

                          {/* Due Date Indicator */}
                          {t.due_date && (
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-semibold whitespace-nowrap px-1.5 py-0.5 rounded ${
                                overdue
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : t.due_date === today()
                                  ? "bg-amber-50 text-amber-700 font-bold"
                                  : "text-gray-500 bg-gray-50"
                              }`}
                            >
                              <i className={overdue ? "ri-error-warning-line text-rose-600" : "ri-calendar-event-line"} />
                              {formatDueDate(t.due_date)}
                            </span>
                          )}
                        </div>

                        {/* Outside Work: compact status indicator */}
                        {t.is_outside_work && (
                          <div className="mt-2.5 pt-2.5 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-[10px] font-semibold">
                              {t.work_status === "checked_in" ? (
                                <>
                                  <span className="relative flex h-1.5 w-1.5 shrink-0">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                                  </span>
                                  <span className="text-emerald-700">Checked in · {formatExact(t.work_checked_in_at!)}</span>
                                </>
                              ) : t.work_status === "checked_out" ? (
                                <>
                                  <i className="ri-check-double-line text-emerald-600" />
                                  <span className="text-gray-500">Session complete</span>
                                </>
                              ) : (
                                <>
                                  <i className="ri-map-pin-line text-amber-500" />
                                  <span className="text-amber-600">Outside work</span>
                                </>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {colTasks.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-48 border-2 border-dashed border-gray-200/80 rounded-xl text-gray-300">
                      <i className="ri-inbox-line text-2xl mb-1" />
                      <p className="text-xs font-semibold text-gray-400">No tasks in {col.label}</p>
                      <button
                        onClick={() => openCreate(col.key)}
                        className="mt-2 text-[11px] text-[#253C7D] font-bold hover:underline cursor-pointer"
                      >
                        + Create one
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* 2. HIGH-DENSITY LIST VIEW */}
      {view === "list" && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-200/80 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3 w-10 text-center">Status</th>
                  <th className="px-4 py-3">Task Title & Details</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Assignee</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((t) => {
                  const priorityMeta = PRIORITY_META[t.priority] || PRIORITY_META.medium;
                  const statusConf = STATUS_CONFIG[t.status];
                  const overdue = isOverdue(t);
                  const empName = t.employees ? `${t.employees.first_name} ${t.employees.last_name}` : "Unassigned";

                  return (
                    <tr
                      key={t.id}
                      onClick={() => openEdit(t)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                    >
                      <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleStatusChange(t, t.status === "done" ? "todo" : "done")}
                          title={t.status === "done" ? "Mark as To Do" : "Mark as Done"}
                          className={`cursor-pointer transition-colors ${
                            t.status === "done" ? "text-emerald-600" : "text-gray-300 hover:text-emerald-600"
                          }`}
                        >
                          <i className={t.status === "done" ? "ri-checkbox-circle-fill text-lg" : "ri-checkbox-blank-circle-line text-lg"} />
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`font-bold text-gray-900 group-hover:text-[#253C7D] transition-colors ${
                          t.status === "done" ? "line-through text-gray-400" : ""
                        }`}>
                          {t.title}
                        </p>
                        {t.description && (
                          <p className="text-[11px] text-gray-400 line-clamp-1 mt-0.5">{t.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${priorityMeta.bg} ${priorityMeta.text} ${priorityMeta.border} uppercase`}>
                          {priorityMeta.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[9px] font-bold flex items-center justify-center shrink-0">
                            {initials(empName)}
                          </div>
                          <span className="font-semibold text-gray-800">{empName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                        {t.employees?.department || "General"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        {t.due_date ? (
                          <span className={`font-semibold ${overdue ? "text-rose-600" : "text-gray-600"}`}>
                            {formatDueDate(t.due_date)}{overdue ? " (Overdue)" : ""}
                          </span>
                        ) : (
                          <span className="text-gray-300 font-mono">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={t.status}
                          onChange={(e) => handleStatusChange(t, e.target.value as Task["status"])}
                          className={`text-[11px] font-bold px-2 py-1 rounded-lg border focus:outline-none cursor-pointer ${statusConf.badge}`}
                        >
                          {STATUS_COLUMNS.map((s) => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}

                {filteredTasks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-16 text-center text-gray-400">
                      <i className="ri-file-search-line text-3xl mb-1 text-gray-300" />
                      <p className="text-sm font-semibold text-gray-600">No tasks match your filters</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. TEAM PERFORMANCE REPORT MATRIX */}
      {view === "report" && canManage && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-gray-200/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Team Execution & Completion Matrix</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reportDateRange
                    ? `Showing tasks created ${reportPreset === "today" ? "today" : reportPreset === "week" ? "this week" : reportPreset === "month" ? "this month" : `from ${reportFrom} to ${reportTo}`}`
                    : "All time — showing all tasks"}
                  {reportFilterEmpId && ` · Filtered by ${employees.find((e) => e.id === reportFilterEmpId)?.first_name || ""} ${employees.find((e) => e.id === reportFilterEmpId)?.last_name || ""}`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <div className="relative" ref={(el) => { reportFilterRef.current = el; }}>
                  <div className="flex items-center gap-1.5 h-8 px-2.5 bg-white border border-gray-200 rounded-lg text-xs cursor-pointer hover:border-[#253C7D]/40 transition-all" onClick={() => setReportFilterOpen(!reportFilterOpen)}>
                    <i className="ri-user-search-line text-gray-400" />
                    <span className={`font-semibold max-w-[120px] truncate ${reportFilterEmpId ? "text-[#253C7D]" : "text-gray-500"}`}>
                      {reportFilterEmpId ? employees.find((e) => e.id === reportFilterEmpId)?.first_name + " " + employees.find((e) => e.id === reportFilterEmpId)?.last_name : "All Staff"}
                    </span>
                    <i className="ri-arrow-down-s-line text-gray-400 ml-auto" />
                  </div>
                  {reportFilterOpen && (
                    <div className="absolute right-0 mt-1 w-64 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1 max-h-72 overflow-y-auto">
                      <input
                        type="text"
                        autoFocus
                        placeholder="Search employee..."
                        className="w-full px-3 py-2 border-b border-gray-100 text-xs focus:outline-none"
                        onChange={(e) => setReportFilterSearch(e.target.value)}
                      />
                      <button onClick={() => { setReportFilterEmpId(""); setReportFilterOpen(false); }} className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 font-semibold ${!reportFilterEmpId ? "text-[#253C7D] bg-[#253C7D]/5" : "text-gray-600"}`}>
                        <i className="ri-team-line" /> All Staff
                      </button>
                      {employees
                        .filter((e) => {
                          const q = reportFilterSearch.toLowerCase();
                          return !q || `${e.first_name} ${e.last_name} ${e.department || ""}`.toLowerCase().includes(q);
                        })
                        .map((e) => (
                          <button key={e.id} onClick={() => { setReportFilterEmpId(e.id); setReportFilterOpen(false); setReportFilterSearch(""); }} className={`w-full px-3 py-2 text-left text-xs hover:bg-slate-50 flex items-center gap-2 ${reportFilterEmpId === e.id ? "text-[#253C7D] bg-[#253C7D]/5 font-bold" : "text-gray-600"}`}>
                            <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[10px] flex items-center justify-center">{e.first_name?.[0]}{e.last_name?.[0]}</div>
                            <span className="font-semibold">{e.first_name} {e.last_name}</span>
                            <span className="text-gray-400 ml-auto text-[10px]">{e.department}</span>
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700">
                  {report.reduce((s, r) => s + r.total, 0)} Tasks · {report.length} Staff
                </span>
                <div className="relative" ref={(el) => { reportExportRef.current = el; }}>
                  <button onClick={() => { setReportExportOpen(!reportExportOpen); setMyReportExportOpen(false); }} className="h-8 px-3 bg-[#253C7D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#1c2e61] transition-all">
                    <i className="ri-download-2-line" /> Export
                  </button>
                  {reportExportOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
                      <button onClick={() => { exportTeamReportCSV(); setReportExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-text-line text-emerald-600" /> CSV Spreadsheet</button>
                      <button onClick={() => { exportTeamReportXLSX(); setReportExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-excel-2-line text-green-600" /> Excel Workbook</button>
                      <button onClick={() => { exportTeamReportPDF(); setReportExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-pdf-line text-red-500" /> PDF Document</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
              <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
                  <i className="ri-task-line text-sm" />
                </div>
                <div>
                  <p className="text-lg font-black text-gray-900 leading-tight">{report.reduce((s, r) => s + r.total, 0)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <i className="ri-loader-4-line text-sm" />
                </div>
                <div>
                  <p className="text-lg font-black text-sky-700 leading-tight">{report.reduce((s, r) => s + r.inProg, 0)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">In Progress</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <i className="ri-checkbox-circle-line text-sm" />
                </div>
                <div>
                  <p className="text-lg font-black text-emerald-700 leading-tight">{report.reduce((s, r) => s + r.done, 0)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Done</p>
                </div>
              </div>
              <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                  <i className="ri-alarm-warning-line text-sm" />
                </div>
                <div>
                  <p className="text-lg font-black text-rose-700 leading-tight">{report.reduce((s, r) => s + r.overdue, 0)}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase">Overdue</p>
                </div>
              </div>
            </div>

            {/* Date Filter Presets */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "today", "week", "month", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportPreset === p
                      ? "bg-[#253C7D] text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p === "all" ? "All Time" : p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "Date to Date"}
                </button>
              ))}
              {reportPreset === "custom" && (
                <div className="flex items-center gap-2 ml-1">
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
                  />
                  <span className="text-xs text-gray-400 font-bold">to</span>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
                  />
                </div>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                  <th className="px-5 py-3.5">Team Member</th>
                  <th className="px-5 py-3.5 text-center">Total Assigned</th>
                  <th className="px-5 py-3.5 text-center text-sky-600">In Progress</th>
                  <th className="px-5 py-3.5 text-center text-emerald-600">Completed</th>
                  <th className="px-5 py-3.5 text-center text-rose-600">Overdue</th>
                  <th className="px-5 py-3.5">Completion Progress</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {report.map(({ employee, total, done, inProg, overdue, completionRate }) => (
                  <tr key={employee.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        {employee.avatar_url ? (
                          <img src={employee.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover" />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-black text-xs flex items-center justify-center">
                            {initials(`${employee.first_name} ${employee.last_name}`)}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{employee.first_name} {employee.last_name}</p>
                          <p className="text-[11px] text-gray-400">{employee.department}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-center font-bold text-gray-800 text-sm">{total}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-sky-600">{inProg}</td>
                    <td className="px-5 py-3.5 text-center font-bold text-emerald-600">{done}</td>
                    <td className="px-5 py-3.5 text-center">
                      <span className={`font-bold px-2 py-0.5 rounded-full ${
                        overdue > 0 ? "bg-rose-50 text-rose-700 border border-rose-200" : "text-gray-300"
                      }`}>
                        {overdue}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3 max-w-xs">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              completionRate >= 80 ? "bg-emerald-500" : completionRate >= 40 ? "bg-[#253C7D]" : "bg-amber-500"
                            }`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 min-w-[36px]">{completionRate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {report.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-5 py-12 text-center text-gray-400">
                      <i className="ri-bar-chart-box-line text-2xl text-gray-300 mb-2 block" />
                      No tasks found for the selected period.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Personal Report View (All Users) */}
      {view === "my_report" && myReport && (
        <div className="space-y-5">
          {/* Header */}
          <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
            <div className="px-5 py-4 bg-slate-50 border-b border-gray-200/80">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">My Task Report</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {reportDateRange
                      ? `Tasks created ${reportPreset === "today" ? "today" : reportPreset === "week" ? "this week" : reportPreset === "month" ? "this month" : `from ${reportFrom} to ${reportTo}`}`
                      : "All time — your personal task summary"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700">
                    {myReport.total} Tasks {myReport.subordinateCount > 0 && `· ${myReport.subordinateCount} Reports`}
                  </span>
                  <div className="relative" ref={(el) => { myReportExportRef.current = el; }}>
                    <button onClick={() => { setMyReportExportOpen(!myReportExportOpen); setReportExportOpen(false); }} className="h-8 px-3 bg-[#253C7D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#1c2e61] transition-all">
                      <i className="ri-download-2-line" /> Export
                    </button>
                    {myReportExportOpen && (
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
                        <button onClick={() => { exportMyReportCSV(); setMyReportExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-text-line text-emerald-600" /> CSV Spreadsheet</button>
                        <button onClick={() => { exportMyReportXLSX(); setMyReportExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-excel-2-line text-green-600" /> Excel Workbook</button>
                        <button onClick={() => { exportMyReportPDF(); setMyReportExportOpen(false); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-pdf-line text-red-500" /> PDF Document</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mb-3">
                <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center">
                    <i className="ri-task-line text-sm" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-900 leading-tight">{myReport.total}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Total</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-gray-100 text-gray-500 flex items-center justify-center">
                    <i className="ri-file-list-3-line text-sm" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-gray-700 leading-tight">{myReport.todo}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">To Do</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                    <i className="ri-loader-4-line text-sm" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-sky-700 leading-tight">{myReport.inProg}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">In Progress</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <i className="ri-checkbox-circle-line text-sm" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-emerald-700 leading-tight">{myReport.done}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Done</p>
                  </div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200/60 px-3 py-2.5 flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
                    <i className="ri-alarm-warning-line text-sm" />
                  </div>
                  <div>
                    <p className="text-lg font-black text-rose-700 leading-tight">{myReport.overdue}</p>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Overdue</p>
                  </div>
                </div>
              </div>

              {/* Completion Bar */}
              <div className="bg-white rounded-xl border border-gray-200/60 px-4 py-3 mb-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-gray-700">Completion Rate</span>
                  <span className={`text-xs font-black ${myReport.completionRate >= 80 ? "text-emerald-600" : myReport.completionRate >= 40 ? "text-[#253C7D]" : "text-amber-600"}`}>
                    {myReport.completionRate}%
                  </span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      myReport.completionRate >= 80 ? "bg-emerald-500" : myReport.completionRate >= 40 ? "bg-[#253C7D]" : "bg-amber-500"
                    }`}
                    style={{ width: `${myReport.completionRate}%` }}
                  />
                </div>
              </div>

              {/* Date Filter Presets */}
              <div className="flex items-center gap-2 flex-wrap">
                {(["all", "today", "week", "month", "custom"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setReportPreset(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      reportPreset === p
                        ? "bg-[#253C7D] text-white shadow-xs"
                        : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {p === "all" ? "All Time" : p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "Date to Date"}
                  </button>
                ))}
                {reportPreset === "custom" && (
                  <div className="flex items-center gap-2 ml-1">
                    <input
                      type="date"
                      value={reportFrom}
                      onChange={(e) => setReportFrom(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
                    />
                    <span className="text-xs text-gray-400 font-bold">to</span>
                    <input
                      type="date"
                      value={reportTo}
                      onChange={(e) => setReportTo(e.target.value)}
                      className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Task List Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-gray-200/80 text-[11px] font-bold text-gray-400 uppercase tracking-wider bg-gray-50/50">
                    <th className="px-5 py-3.5">Task</th>
                    {myReport.subordinateCount > 0 && <th className="px-5 py-3.5">Assignee</th>}
                    <th className="px-5 py-3.5 text-center">Priority</th>
                    <th className="px-5 py-3.5 text-center">Status</th>
                    <th className="px-5 py-3.5 text-center">Due Date</th>
                    <th className="px-5 py-3.5 text-center">Work Started</th>
                    <th className="px-5 py-3.5 text-center">Work Completed</th>
                    <th className="px-5 py-3.5 text-center">Duration</th>
                    <th className="px-5 py-3.5 text-center">Created</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {myReport.tasks.map((t) => {
                    const assignee = employees.find((e) => e.id === t.assigned_to);
                    return (
                    <tr key={t.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-5 py-3.5">
                        <p className="font-bold text-gray-900 text-sm">{t.title}</p>
                        {t.description && <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1">{t.description}</p>}
                      </td>
                      {myReport.subordinateCount > 0 && (
                        <td className="px-5 py-3.5">
                          {assignee ? (
                            <div className="flex items-center gap-2">
                              <div className="w-6 h-6 rounded-full bg-[#253C7D]/10 text-[#253C7D] text-[10px] font-black flex items-center justify-center shrink-0">
                                {initials(`${assignee.first_name} ${assignee.last_name}`)}
                              </div>
                              <span className="text-xs font-semibold text-gray-700 whitespace-nowrap">{assignee.first_name}</span>
                            </div>
                          ) : <span className="text-xs text-gray-400">—</span>}
                        </td>
                      )}
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                          t.priority === "urgent" ? "bg-rose-50 text-rose-700 border border-rose-200"
                            : t.priority === "high" ? "bg-amber-50 text-amber-700 border border-amber-200"
                            : t.priority === "medium" ? "bg-sky-50 text-sky-700 border border-sky-200"
                            : "bg-gray-50 text-gray-500 border border-gray-200"
                        }`}>
                          {t.priority}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${STATUS_CONFIG[t.status]?.badge}`}>
                          {STATUS_CONFIG[t.status]?.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        {t.due_date ? formatShortDate(t.due_date) : "—"}
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        {(() => { const wt = getTaskWorkingTime(t, myTaskActivities); return wt.startedAt ? formatExact(wt.startedAt) : "—"; })()}
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        {(() => { const wt = getTaskWorkingTime(t, myTaskActivities); return wt.endedAt ? formatExact(wt.endedAt) : "—"; })()}
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600 font-semibold">
                        {(() => { const wt = getTaskWorkingTime(t, myTaskActivities); return wt.duration || "—"; })()}
                      </td>
                      <td className="px-5 py-3.5 text-center text-gray-600">
                        {formatShortDate(t.created_at)}
                      </td>
                    </tr>
                    );
                  })}
                  {myReport.tasks.length === 0 && (
                    <tr>
                      <td colSpan={myReport.subordinateCount > 0 ? 9 : 8} className="px-5 py-12 text-center text-gray-400">
                        <i className="ri-pie-chart-line text-2xl text-gray-300 mb-2 block" />
                        No tasks found for the selected period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {view === "my_report" && !myReport && !loading && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="px-5 py-12 text-center">
            <i className="ri-user-line text-3xl text-gray-300 mb-3 block" />
            <p className="text-sm font-bold text-gray-500">No employee profile found</p>
            <p className="text-xs text-gray-400 mt-1">Your account is not linked to an employee record. Contact your administrator.</p>
          </div>
        </div>
      )}

      {/* 4. ADMIN TASK REPORTS – view all task reports per employee, search, export */}
      {view === "admin_report" && canManage && (
        <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
          <div className="px-5 py-4 bg-slate-50 border-b border-gray-200/80">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wider">Admin Task Reports</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {reportDateRange
                    ? `Showing tasks created ${reportPreset === "today" ? "today" : reportPreset === "week" ? "this week" : reportPreset === "month" ? "this month" : `from ${reportFrom} to ${reportTo}`}`
                    : "All time — complete task report for every employee"}
                  {adminReportDeptFilter !== "all" && ` · ${adminReportDeptFilter}`}
                  {adminReportSearch && ` · \"${adminReportSearch}\"`}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold px-3 py-1 bg-white border border-gray-200 rounded-lg text-gray-700">
                  {adminReport.reduce((s, r) => s + r.total, 0)} Tasks · {adminReport.length} Staff
                </span>
                <div className="relative" data-admin-export>
                  <button onClick={() => setAdminReportEmpExportOpen(adminReportEmpExportOpen === "_all" ? null : "_all")} className="h-8 px-3 bg-[#253C7D] text-white rounded-lg text-xs font-bold flex items-center gap-1.5 hover:bg-[#1c2e61] transition-all">
                    <i className="ri-download-2-line" /> Export All
                  </button>
                  {adminReportEmpExportOpen === "_all" && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
                      <button onClick={() => { exportAdminAllCSV(); setAdminReportEmpExportOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-text-line text-emerald-600" /> CSV Spreadsheet</button>
                      <button onClick={() => { exportAdminAllXLSX(); setAdminReportEmpExportOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-excel-2-line text-green-600" /> Excel Workbook</button>
                      <button onClick={() => { exportAdminAllPDF(); setAdminReportEmpExportOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-pdf-line text-red-500" /> PDF Document</button>
                    </div>
                  )}
                </div>
              </div>
            </div>



            {/* Search + Department Filter + Date Presets */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 flex-wrap">
              {/* Employee Search */}
              <div className="relative w-full sm:w-64">
                <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                <input
                  type="text"
                  value={adminReportSearch}
                  onChange={(e) => setAdminReportSearch(e.target.value)}
                  placeholder="Search employee name..."
                  className="w-full pl-8 pr-7 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20 transition-all"
                />
                {adminReportSearch && (
                  <button
                    onClick={() => setAdminReportSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-circle-fill text-xs" />
                  </button>
                )}
              </div>

              {/* Department Filter */}
              <select
                value={adminReportDeptFilter}
                onChange={(e) => setAdminReportDeptFilter(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                <option value="all">All Departments</option>
                {adminReportDepartments.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <div className="h-5 w-px bg-gray-200 hidden sm:block" />

              {/* Date Filter Presets */}
              {(["all", "today", "week", "month", "custom"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setReportPreset(p)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    reportPreset === p
                      ? "bg-[#253C7D] text-white shadow-xs"
                      : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p === "all" ? "All Time" : p === "today" ? "Today" : p === "week" ? "This Week" : p === "month" ? "This Month" : "Date to Date"}
                </button>
              ))}
              {reportPreset === "custom" && (
                <div className="flex items-center gap-2 ml-1">
                  <input
                    type="date"
                    value={reportFrom}
                    onChange={(e) => setReportFrom(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
                  />
                  <span className="text-xs text-gray-400 font-bold">to</span>
                  <input
                    type="date"
                    value={reportTo}
                    onChange={(e) => setReportTo(e.target.value)}
                    className="px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/30"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Employee Cards – each shows employee info + their task titles + export */}
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {adminReport.map(({ employee, tasks: empTasks }) => {
              return (
                <div key={employee.id} className="bg-white border border-gray-200/80 rounded-2xl overflow-hidden hover:shadow-md transition-shadow">
                  {/* Employee Header */}
                  <div className="px-4 py-3 border-b border-gray-100 bg-slate-50/50 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      {employee.avatar_url ? (
                        <img src={employee.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-black text-[10px] flex items-center justify-center shrink-0">
                          {initials(`${employee.first_name} ${employee.last_name}`)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-gray-900 text-[13px] truncate">{employee.first_name} {employee.last_name}</p>
                        <p className="text-[11px] text-gray-400 truncate">{employee.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                        {empTasks.length} task{empTasks.length !== 1 ? "s" : ""}
                      </span>
                      <div className="relative" data-admin-export>
                        <button onClick={() => setAdminReportEmpExportOpen(adminReportEmpExportOpen === employee.id ? null : employee.id)} className="w-7 h-7 rounded-lg bg-[#253C7D] text-white flex items-center justify-center hover:bg-[#1c2e61] transition-all cursor-pointer" title="Export tasks">
                          <i className="ri-download-2-line text-xs" />
                        </button>
                        {adminReportEmpExportOpen === employee.id && (
                          <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl border border-gray-200 shadow-lg z-50 py-1">
                            <button onClick={() => { exportAdminEmpCSV(employee, empTasks); setAdminReportEmpExportOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-text-line text-emerald-600" /> CSV</button>
                            <button onClick={() => { exportAdminEmpXLSX(employee, empTasks); setAdminReportEmpExportOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-excel-2-line text-green-600" /> Excel</button>
                            <button onClick={() => { exportAdminEmpPDF(employee, empTasks); setAdminReportEmpExportOpen(null); }} className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50 flex items-center gap-2"><i className="ri-file-pdf-line text-red-500" /> PDF</button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Titles List */}
                  <div className="divide-y divide-gray-50">
                    {empTasks.map((t) => (
                      <div key={t.id} className="px-4 py-3 hover:bg-slate-50/50 transition-colors">
                        <div className="flex items-start gap-3">
                          {/* Status indicator */}
                          <span className="shrink-0 mt-0.5">
                            <i className={`${STATUS_CONFIG[t.status]?.icon || "ri-checkbox-blank-circle-line"} text-sm`} style={{ color: STATUS_CONFIG[t.status]?.accent || "#94a3b8" }} />
                          </span>
                          {/* Title & details */}
                          <div className="flex-1 min-w-0">
                            <p className={`text-[13px] font-semibold leading-snug truncate ${t.status === "done" ? "line-through text-gray-400" : "text-gray-900"}`}>{t.title}</p>
                            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                              <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${STATUS_CONFIG[t.status]?.badge}`}>
                                {STATUS_CONFIG[t.status]?.label}
                              </span>
                              {t.due_date && (
                                <span className={`text-[10px] font-semibold ${isOverdue(t) ? "text-rose-600" : "text-gray-400"}`}>
                                  {formatDueDate(t.due_date)}{isOverdue(t) ? " (Overdue)" : ""}
                                </span>
                              )}
                            </div>
                            {/* Working Time Info – from status changes */}
                            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                              {(() => {
                                const wt = getTaskWorkingTime(t);
                                return (
                                  <>
                                    {/* Start time: when moved to In Progress */}
                                    {wt.startedAt && (
                                      <span className="text-[10px] text-sky-600 flex items-center gap-1">
                                        <i className="ri-play-circle-line text-[10px]" />
                                        Started {formatExact(wt.startedAt)}
                                      </span>
                                    )}
                                    {/* End time: when moved to Done */}
                                    {wt.endedAt && (
                                      <span className="text-[10px] text-emerald-600 flex items-center gap-1">
                                        <i className="ri-checkbox-circle-line text-[10px]" />
                                        Completed {formatExact(wt.endedAt)}
                                      </span>
                                    )}
                                    {/* Active timer: in_progress but not yet done */}
                                    {wt.startedAt && !wt.endedAt && (
                                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <span className="relative flex h-1.5 w-1.5"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" /></span>
                                        Working for {fmtDuration(wt.startedAt, null)}
                                      </span>
                                    )}
                                    {/* Duration badge */}
                                    {wt.duration && (
                                      <span className="text-[10px] font-semibold text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                                        <i className="ri-time-line text-[10px]" />
                                        {wt.duration}
                                      </span>
                                    )}
                                    {/* No activity yet hint */}
                                    {!wt.startedAt && t.status === "todo" && (
                                      <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                        <i className="ri-hourglass-line text-[10px]" />
                                        Not started yet
                                      </span>
                                    )}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                          {/* Priority badge */}
                          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_META[t.priority]?.bg} ${PRIORITY_META[t.priority]?.text} ${PRIORITY_META[t.priority]?.border}`}>
                            {PRIORITY_META[t.priority]?.label}
                          </span>
                        </div>
                      </div>
                    ))}
                    {empTasks.length === 0 && (
                      <div className="px-4 py-6 text-center text-gray-400">
                        <i className="ri-inbox-line text-xl text-gray-300 mb-1 block" />
                        <p className="text-[11px] font-semibold">No tasks found</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {adminReport.length === 0 && (
              <div className="col-span-full px-5 py-12 text-center text-gray-400">
                <i className="ri-file-list-3-line text-2xl text-gray-300 mb-2 block" />
                No tasks found for the selected filters.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modern Enterprise Slide-over / Modal for Task Creation & Edit */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/40 backdrop-blur-xs overflow-y-auto no-scrollbar"
          onClick={() => { if (!saving) closeModal(); }}
        >
          <div
            className="bg-white rounded-3xl w-full max-w-xl shadow-2xl border border-gray-100/80 overflow-hidden max-h-[92vh] flex flex-col animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 bg-white flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center font-bold text-sm shrink-0">
                  <i className={editingTask ? "ri-file-list-3-line text-base" : "ri-add-line text-base"} />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900 truncate">
                      {editingTask ? "Task Details" : "Create New Task"}
                    </h3>
                    {editingTask && (
                      <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_CONFIG[form.status]?.badge}`}>
                        {STATUS_CONFIG[form.status]?.label}
                      </span>
                    )}
                  </div>
                  {editingTask && (
                    <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                      Created {formatRelative(editingTask.created_at)} · Updated {formatRelative(editingTask.completed_at || editingTask.created_at)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                {editingTask && (
                  <div className="flex items-center bg-gray-100/90 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setActiveModalTab("details")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        activeModalTab === "details" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      Details
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveModalTab("activity")}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                        activeModalTab === "activity" ? "bg-white text-[#253C7D] shadow-xs" : "text-gray-500 hover:text-gray-900"
                      }`}
                    >
                      <span>Activity</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold leading-none ${
                        activeModalTab === "activity" ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-200 text-gray-600"
                      }`}>
                        {activities.length}
                      </span>
                    </button>
                  </div>
                )}
                <div className="h-5 w-px bg-gray-200 hidden sm:block" />
                <button
                  type="button"
                  onClick={() => closeModal()}
                  className="w-8 h-8 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 flex items-center justify-center transition-colors cursor-pointer"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-4.5 no-scrollbar">
              {activeModalTab === "details" ? (
                <>
                  {/* Task Title */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Task Title <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                      placeholder="What needs to be done? e.g. Finalize Q3 Employee Review"
                      className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 transition-all"
                    />
                  </div>

                  {/* Status Selection */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Status Stage
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value as Task["status"] })}
                      className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                    >
                      {STATUS_COLUMNS.map((s) => (
                        <option key={s.key} value={s.key}>{STATUS_CONFIG[s.key].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Priority Level */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Priority Level
                    </label>
                    <select
                      value={form.priority}
                      onChange={(e) => setForm({ ...form, priority: e.target.value as Task["priority"] })}
                      className="w-full px-3 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] cursor-pointer"
                    >
                      {(["low", "medium", "high", "urgent"] as Task["priority"][]).map((p) => (
                        <option key={p} value={p}>{PRIORITY_META[p].label}</option>
                      ))}
                    </select>
                  </div>

                  {/* Assignee & Due Date Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Assignee Section */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        {editingTask ? "Assignee" : "Assign To"}
                      </label>
                      {canAssign ? (
                        editingTask ? (
                          <EmployeeSearchSelect
                            employees={assignableEmployees}
                            value={form.assigned_to}
                            onChange={(id) => setForm({ ...form, assigned_to: id })}
                          />
                        ) : (
                          <div className="relative" ref={taskRef}>
                            <div
                              onClick={() => setTaskOpen(true)}
                              className="relative w-full min-h-[38px] flex flex-wrap items-center gap-1.5 pl-2.5 pr-8 py-1.5 bg-gray-50/70 border border-gray-200 rounded-xl focus-within:bg-white focus-within:border-[#253C7D] transition-all cursor-text"
                            >
                              {assignedToIds.map((id) => {
                                const emp = assignableEmployees.find((e) => e.id === id);
                                if (!emp) return null;
                                return (
                                  <span
                                    key={id}
                                    className="inline-flex items-center gap-1 pl-2 pr-1 py-1 rounded-lg bg-[#253C7D]/10 text-[#253C7D] text-[11px] font-bold whitespace-nowrap"
                                  >
                                    {emp.first_name} {emp.last_name}
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setAssignedToIds((prev) => prev.filter((pid) => pid !== id));
                                      }}
                                      title={`Remove ${emp.first_name} ${emp.last_name}`}
                                      className="w-3.5 h-3.5 rounded-full hover:bg-[#253C7D]/20 flex items-center justify-center cursor-pointer"
                                    >
                                      <i className="ri-close-line text-xs" />
                                    </button>
                                  </span>
                                );
                              })}
                              <input
                                type="text"
                                value={taskSearch}
                                onChange={(e) => { setTaskSearch(e.target.value); setTaskOpen(true); }}
                                onFocus={() => setTaskOpen(true)}
                                placeholder={assignedToIds.length === 0 ? "Search employees..." : "Add more..."}
                                className="flex-1 min-w-[90px] bg-transparent text-xs font-semibold text-gray-900 focus:outline-none py-0.5"
                              />
                              <i className="ri-arrow-down-s-line absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            </div>

                            {taskOpen && (
                              <div className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-2xl shadow-xl max-h-56 overflow-y-auto p-1.5 no-scrollbar">
                                <button
                                  type="button"
                                  onClick={() => {
                                    const allIds = assignableEmployees.map((e) => e.id);
                                    const allSelected = allIds.length > 0 && allIds.every((id) => assignedToIds.includes(id));
                                    setAssignedToIds(allSelected ? [] : allIds);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-[#253C7D] hover:bg-slate-50 rounded-lg transition-colors cursor-pointer mb-1 border-b border-gray-100"
                                >
                                  <i className="ri-checkbox-multiple-line text-sm" />
                                  {assignedToIds.length === assignableEmployees.length ? "Deselect All" : `Select All (${assignableEmployees.length})`}
                                </button>
                                {assignableEmployees
                                  .filter((e) => `${e.first_name} ${e.last_name} ${e.department}`.toLowerCase().includes(taskSearch.toLowerCase()))
                                  .map((emp) => {
                                    const checked = assignedToIds.includes(emp.id);
                                    return (
                                      <label
                                        key={emp.id}
                                        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                                          checked ? "bg-[#253C7D]/10" : "hover:bg-gray-50"
                                        }`}
                                      >
                                        <input
                                          type="checkbox"
                                          checked={checked}
                                          onChange={() => {
                                            setAssignedToIds((prev) =>
                                              prev.includes(emp.id) ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                                            );
                                          }}
                                          className="rounded text-[#253C7D] focus:ring-0 cursor-pointer"
                                        />
                                        <span className="w-5 h-5 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[9px] flex items-center justify-center shrink-0">
                                          {initials(`${emp.first_name} ${emp.last_name}`)}
                                        </span>
                                        <div className="flex-1 min-w-0">
                                          <p className="text-xs font-semibold text-gray-900 leading-none">{emp.first_name} {emp.last_name}</p>
                                          <p className="text-[10px] text-gray-400 mt-0.5 truncate">{emp.department}</p>
                                        </div>
                                      </label>
                                    );
                                  })}
                              </div>
                            )}
                          </div>
                        )
                      ) : (
                        <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700">
                          {myEmployee ? `${myEmployee.first_name} ${myEmployee.last_name}` : "—"}
                        </div>
                      )}
                    </div>

                    {/* Due Date & Shortcuts */}
                    <div>
                      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={form.due_date}
                        onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                        className="w-full px-3 py-2 bg-gray-50/70 border border-gray-200 rounded-xl text-xs font-semibold text-gray-800 focus:bg-white focus:outline-none focus:border-[#253C7D] transition-all"
                      />
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setForm({ ...form, due_date: today() })}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer"
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 1);
                            const tm = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                            setForm({ ...form, due_date: tm });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer"
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const d = new Date();
                            d.setDate(d.getDate() + 7);
                            const nw = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
                            setForm({ ...form, due_date: nw });
                          }}
                          className="px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer"
                        >
                          +7 Days
                        </button>
                        {form.due_date && (
                          <button
                            type="button"
                            onClick={() => setForm({ ...form, due_date: "" })}
                            className="px-2 py-0.5 rounded text-[10px] font-bold text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Task Description */}
                  <div>
                    <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                      Description & Context
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm({ ...form, description: e.target.value })}
                      rows={3}
                      placeholder="Add detailed task scope, requirements, or documentation links..."
                      className="w-full px-4 py-2.5 bg-gray-50/70 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder:text-gray-400 focus:bg-white focus:outline-none focus:border-[#253C7D] focus:ring-2 focus:ring-[#253C7D]/10 resize-none transition-all"
                    />
                  </div>

                  {/* Outside Work Toggle */}
                  <div className="rounded-2xl border border-gray-200 overflow-hidden">
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, is_outside_work: !form.is_outside_work })}
                      className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-gray-50/60"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${form.is_outside_work ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-100 text-gray-400"}`}>
                          <i className="ri-map-pin-user-line text-base" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-gray-900">Outside Work</p>
                          <p className="text-[11px] text-gray-400 mt-0.5">
                            {form.is_outside_work
                              ? editingTask
                                ? "Check in with location when you arrive; check out with a photo"
                                : "Check in with location, check out with a photo when done"
                              : "Enable if this task is performed off-site"}
                          </p>
                        </div>
                      </div>
                      <div className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${form.is_outside_work ? "bg-[#253C7D]" : "bg-gray-300"}`}>
                        <span className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${form.is_outside_work ? "left-[22px]" : "left-[3px]"}`} />
                      </div>
                    </button>

                    {/* Check-in capture for NEW tasks with outside work */}
                    {form.is_outside_work && !editingTask && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/30 space-y-3">
                        {/* Location Capture */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <i className="ri-map-pin-2-fill text-emerald-600" />
                            Current Location
                          </label>
                          {owLocation ? (
                            <div className="p-2.5 bg-emerald-50 border border-emerald-200/60 rounded-xl space-y-1">
                              <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                                <i className="ri-check-line" /> Location captured
                              </p>
                              {owLocation.address && (
                                <p className="text-[11px] text-emerald-600">{owLocation.address}</p>
                              )}
                              {!owLocation.address && (
                                <p className="text-[11px] text-emerald-600">{owLocation.lat}, {owLocation.lng}</p>
                              )}
                              {owLocation.accuracy != null && (
                                <p className="text-[10px] text-emerald-500">±{owLocation.accuracy}m accuracy</p>
                              )}
                              <button type="button" onClick={() => setOwLocation(null)} className="text-[10px] font-bold text-emerald-700 hover:underline cursor-pointer">
                                Recapture
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={handleOwCaptureLocation}
                              disabled={owLocating}
                              className="w-full py-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-600 text-[11px] font-bold hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
                            >
                              {owLocating ? (
                                <>
                                  <div className="w-3.5 h-3.5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                                  Getting location...
                                </>
                              ) : (
                                <>
                                  <i className="ri-map-pin-user-line text-sm" />
                                  Capture Current Location
                                </>
                              )}
                            </button>
                          )}
                        </div>

                        {/* Media Capture */}
                        <div>
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                            <i className="ri-camera-line text-[#253C7D]" />
                            Photos / Videos
                            <span className="text-gray-300 font-normal normal-case">(optional)</span>
                          </label>
                          <input
                            ref={owFileRef}
                            type="file"
                            accept="image/*,video/*"
                            multiple
                            className="hidden"
                            onChange={(e) => handleOwPickFiles(e.target.files)}
                          />
                          {owFiles.length > 0 && (
                            <div className="grid grid-cols-3 gap-1.5 mb-2">
                              {owFiles.map((f, i) => (
                                <div key={i} className="relative group">
                                  {f.type === "video" ? (
                                    <video src={f.preview} preload="metadata" className="w-full aspect-video object-cover rounded-lg border border-gray-200 bg-black" />
                                  ) : (
                                    <img src={f.preview} alt="" className="w-full aspect-video object-cover rounded-lg border border-gray-200" />
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => {
                                      URL.revokeObjectURL(f.preview);
                                      setOwFiles((prev) => prev.filter((_, idx) => idx !== i));
                                    }}
                                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  >
                                    <i className="ri-close-line" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => owFileRef.current?.click()}
                            className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 text-[11px] font-bold hover:bg-gray-50 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <i className="ri-camera-line text-sm" />
                            {owFiles.length > 0 ? "Add More" : "Add Photos / Videos"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Full Session Display when editing an outside-work task */}
                    {editingTask?.is_outside_work && (
                      <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/30 space-y-3">
                        {/* Session status badge */}
                        <div className="flex items-center justify-between">
                          <span className={`text-[11px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                            editingTask.work_status === "checked_in"
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                              : editingTask.work_status === "checked_out"
                              ? "bg-gray-100 text-gray-600 border border-gray-200"
                              : "bg-amber-50 text-amber-700 border border-amber-200/60"
                          }`}>
                            {editingTask.work_status === "checked_in" && <span className="relative flex h-2 w-2"><span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" /></span>}
                            {editingTask.work_status === "checked_in" ? "Active Session" : editingTask.work_status === "checked_out" ? "Session Complete" : "Not Checked In"}
                          </span>
                          {editingTask.work_checked_in_at && editingTask.work_checked_out_at && (
                            <span className="text-[11px] font-bold text-gray-500">
                              {fmtDuration(editingTask.work_checked_in_at, editingTask.work_checked_out_at)}
                            </span>
                          )}
                        </div>

                        {/* Check-in details */}
                        {(editingTask.work_media_urls?.length || editingTask.work_image_url) && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                              <i className="ri-login-circle-line text-emerald-600" />
                              Check-in
                              {editingTask.work_checked_in_at && (
                                <span className="text-gray-400 font-medium normal-case ml-1">
                                  · {formatExact(editingTask.work_checked_in_at)}
                                </span>
                              )}
                            </label>
                            {editingTask.work_media_urls && editingTask.work_media_urls.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1.5">
                                {editingTask.work_media_urls.map((m, i) => (
                                  m.type === "video" ? (
                                    <video key={i} src={m.url} controls preload="metadata" className="w-full aspect-video object-cover rounded-lg border border-gray-200 bg-black" />
                                  ) : (
                                    <img key={i} src={m.url} alt={m.name} className="w-full aspect-video object-cover rounded-lg border border-gray-200" />
                                  )
                                ))}
                              </div>
                            ) : editingTask.work_image_url ? (
                              <img src={editingTask.work_image_url} alt="Check-in proof" className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                            ) : null}
                            <div className="mt-1.5 space-y-0.5">
                              {editingTask.work_address && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-emerald-600" />
                                  {editingTask.work_address}
                                </p>
                              )}
                              {!editingTask.work_address && editingTask.work_lat != null && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-emerald-600" />
                                  {editingTask.work_lat}, {editingTask.work_lng}
                                </p>
                              )}
                              {editingTask.work_accuracy_m != null && (
                                <p className="text-[10px] text-gray-400">±{editingTask.work_accuracy_m}m accuracy</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Check-out details */}
                        {(editingTask.work_check_out_media_urls?.length || editingTask.work_check_out_image_url) && (
                          <div>
                            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
                              <i className="ri-logout-circle-r-line text-[#253C7D]" />
                              Check-out
                              {editingTask.work_checked_out_at && (
                                <span className="text-gray-400 font-medium normal-case ml-1">
                                  · {formatExact(editingTask.work_checked_out_at)}
                                </span>
                              )}
                            </label>
                            {editingTask.work_check_out_media_urls && editingTask.work_check_out_media_urls.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1.5">
                                {editingTask.work_check_out_media_urls.map((m, i) => (
                                  m.type === "video" ? (
                                    <video key={i} src={m.url} controls preload="metadata" className="w-full aspect-video object-cover rounded-lg border border-gray-200 bg-black" />
                                  ) : (
                                    <img key={i} src={m.url} alt={m.name} className="w-full aspect-video object-cover rounded-lg border border-gray-200" />
                                  )
                                ))}
                              </div>
                            ) : editingTask.work_check_out_image_url ? (
                              <img src={editingTask.work_check_out_image_url} alt="Check-out proof" className="w-full h-36 object-cover rounded-xl border border-gray-200" />
                            ) : null}
                            <div className="mt-1.5 space-y-0.5">
                              {editingTask.work_check_out_address && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-[#253C7D]" />
                                  {editingTask.work_check_out_address}
                                </p>
                              )}
                              {!editingTask.work_check_out_address && editingTask.work_check_out_lat != null && (
                                <p className="text-[11px] text-gray-600 flex items-center gap-1">
                                  <i className="ri-map-pin-2-fill text-[#253C7D]" />
                                  {editingTask.work_check_out_lat}, {editingTask.work_check_out_lng}
                                </p>
                              )}
                              {editingTask.work_check_out_accuracy_m != null && (
                                <p className="text-[10px] text-gray-400">±{editingTask.work_check_out_accuracy_m}m accuracy</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* No session yet hint */}
                        {!editingTask.work_image_url && (!editingTask.work_media_urls || editingTask.work_media_urls.length === 0) && (
                          <p className="text-[11px] text-gray-400 text-center py-2">
                            No check-in data yet — use the Check In button on the task card.
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Activity Feed Tab */
                <div className="space-y-3">
                  {activityLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <div className="w-6 h-6 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
                    </div>
                  ) : activities.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                      <i className="ri-history-line text-3xl mb-1 text-gray-300" />
                      <p className="text-xs font-semibold">No activity recorded yet</p>
                      <p className="text-[11px] text-gray-400">Status and assignment updates will appear here automatically.</p>
                    </div>
                  ) : (
                    activities.map((a, i) => {
                      const name = a.employees ? `${a.employees.first_name} ${a.employees.last_name}` : "System";
                      const showValueChip = a.action === "status_changed" || (a.action === "updated" && a.field === "priority");

                      return (
                        <div key={a.id} className="flex gap-3 p-3.5 bg-slate-50/70 rounded-2xl border border-gray-100">
                          <div className="w-7 h-7 rounded-full bg-[#253C7D]/10 text-[#253C7D] font-bold text-[10px] flex items-center justify-center shrink-0">
                            {initials(name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-gray-800 font-medium leading-snug">
                              <span className="font-bold text-gray-900">{name}</span> {activityText(a)}
                              {showValueChip && a.new_value && (
                                <span className={`ml-1.5 text-[10px] font-bold px-2 py-0.5 rounded-md capitalize ${
                                  a.action === "status_changed"
                                    ? STATUS_CONFIG[a.new_value as Task["status"]]?.badge || "bg-gray-100 text-gray-700"
                                    : PRIORITY_META[a.new_value as Task["priority"]]?.bg || "bg-gray-100 text-gray-700"
                                }`}>
                                  {prettyValue(a.new_value)}
                                </span>
                              )}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1.5">
                              <i className={`${ACTIVITY_ICON[a.action]} ${ACTIVITY_COLOR[a.action]} text-xs`} />
                              <span>{formatRelative(a.created_at)}</span>
                              <span>·</span>
                              <span>{formatExact(a.created_at)}</span>
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-slate-50/80 border-t border-gray-100 flex items-center justify-between gap-3">
              {editingTask ? (
                <button
                  type="button"
                  onClick={() => handleDelete(editingTask)}
                  title="Move to Recycle Bin"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-3 py-2 rounded-xl transition-colors cursor-pointer"
                >
                  <i className="ri-delete-bin-line text-sm" />
                  Move to Recycle Bin
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                   onClick={() => closeModal()}
                   disabled={saving}
                   className="px-4 py-2 rounded-xl border border-gray-200 bg-white text-gray-700 text-xs font-bold hover:bg-gray-50 cursor-pointer disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving || !form.title.trim() || (!editingTask && form.is_outside_work && !owLocation)}
                  className="px-5 py-2 rounded-xl bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-bold transition-all shadow-xs hover:shadow-md cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingTask ? "Save Changes" : assignedToIds.length > 1 ? `Create ${assignedToIds.length} Tasks` : "Create Task"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {owTaskId && (
        <CheckInOutModal
          taskId={owTaskId}
          employeeId={myEmployee?.id || ""}
          mode={owMode}
          onDone={() => { setOwTaskId(null); loadData(); }}
          onClose={() => setOwTaskId(null)}
          showToast={showToast}
        />
      )}
    </div>
  );
}
