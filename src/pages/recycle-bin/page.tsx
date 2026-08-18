import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { toast } from "@/components/Toast";

interface BinItem {
  table: string;
  id: string | number;
  label: string;
  detail: string;
  deleted_at: string;
  deleted_by: string | null;
  raw?: any;
}

interface ModuleConfig {
  table: string;
  name: string;
  icon: string;
  select: string;
  label: (r: any) => string;
  detail: (r: any) => string;
}

// Business records that are soft-deleted (hidden from their module pages)
// land here. Ephemeral / config data (notifications, roles, infra tokens)
// is still hard-deleted and never shows up in the Recycle Bin.
const MODULES: ModuleConfig[] = [
  { table: "disciplinary_records", name: "Disciplinary", icon: "ri-alert-line", select: "id, title, severity, deleted_at, deleted_by, created_by", label: (r) => r.title, detail: (r) => `Disciplinary · severity ${r.severity}` },
  { table: "documents", name: "Documents", icon: "ri-folder-line", select: "id, title, category, file_url, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `Document · ${r.category}` },
  { table: "announcements", name: "Announcements", icon: "ri-megaphone-line", select: "id, title, category, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `Announcement · ${r.category}` },
  { table: "tasks", name: "Tasks", icon: "ri-checkbox-multiple-line", select: "id, title, priority, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `Task · ${r.priority}` },
  { table: "it_assets", name: "IT Assets", icon: "ri-computer-line", select: "id, name, asset_tag, deleted_at, deleted_by", label: (r) => r.name, detail: (r) => `IT Asset · ${r.asset_tag || "no tag"}` },
  { table: "it_tickets", name: "IT Tickets", icon: "ri-ticket-line", select: "id, title, category, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `IT Ticket · ${r.category}` },
  { table: "expense_records", name: "Expenses", icon: "ri-bank-line", select: "id, category, amount, description, deleted_at, deleted_by", label: (r) => `${r.category} — $${Number(r.amount || 0).toLocaleString()}`, detail: (r) => r.description || "Expense record" },
  { table: "job_postings", name: "Job Postings", icon: "ri-briefcase-line", select: "id, title, department, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `Job Posting · ${r.department || "—"}` },
  { table: "candidates", name: "Candidates", icon: "ri-user-search-line", select: "id, full_name, stage, job_postings(title), deleted_at, deleted_by", label: (r) => r.full_name, detail: (r) => `Candidate · ${r.job_postings?.title || "—"} · ${r.stage}` },
  { table: "interviews", name: "Interviews", icon: "ri-calendar-event-line", select: "id, scheduled_at, deleted_at, deleted_by", label: (r) => `Interview · ${r.scheduled_at ? new Date(r.scheduled_at).toLocaleString() : "—"}`, detail: (r) => "Scheduled interview" },
  { table: "training_courses", name: "Training Courses", icon: "ri-graduation-cap-line", select: "id, title, category, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `Course · ${r.category}` },
  { table: "training_enrollments", name: "Training Enrollments", icon: "ri-bookmark-line", select: "id, status, training_courses(title), deleted_at, deleted_by", label: (r) => r.training_courses?.title || `Enrollment #${r.id}`, detail: (r) => `Enrollment · ${r.status}` },
  { table: "room_bookings", name: "Room Bookings", icon: "ri-door-open-line", select: "id, title, date, deleted_at, deleted_by", label: (r) => r.title, detail: (r) => `Room Booking · ${r.date}` },
  { table: "onboarding_requests", name: "Onboarding Requests", icon: "ri-user-star-line", select: "id, stage, status, deleted_at, deleted_by, employees(first_name, last_name)", label: (r) => `${r.employees?.first_name || ""} ${r.employees?.last_name || ""}`.trim() || "Candidate", detail: (r) => `Onboarding · stage ${r.stage}` },
  { table: "onboarding_checklist_tasks", name: "Onboarding Checklist", icon: "ri-task-line", select: "id, task_name, category, deleted_at, deleted_by", label: (r) => r.task_name, detail: (r) => `Checklist Task · ${r.category}` },
  { table: "employees", name: "Employees", icon: "ri-team-line", select: "id, first_name, last_name, email, role, department, deleted_at, deleted_by", label: (r) => `${r.first_name} ${r.last_name}`, detail: (r) => `${r.role || "Employee"} · ${r.department || "No department"} · ${r.email}` },
  { table: "user_role_assignments", name: "User Roles & Accounts", icon: "ri-user-settings-line", select: "id, email, display_name, deleted_at, deleted_by, app_roles(name)", label: (r) => r.display_name ? `${r.display_name} (${r.email})` : r.email, detail: (r) => `User Account · ${r.app_roles?.name || "No role"}` },
  { table: "shifts", name: "Shifts", icon: "ri-time-line", select: "id, name, department, shift_date, start_time, end_time, deleted_at, deleted_by", label: (r) => `${r.name} (${r.shift_date})`, detail: (r) => `Shift · ${r.start_time} - ${r.end_time} · ${r.department}` },
  { table: "shift_assignments", name: "Shift Assignments", icon: "ri-calendar-schedule-line", select: "id, status, employee:employees(first_name, last_name), deleted_at, deleted_by", label: (r) => `${r.employee?.first_name || "?"} ${r.employee?.last_name || "?"}`, detail: (r) => `Shift Assignment · ${r.status}` },
  { table: "leave_requests", name: "Leave Requests", icon: "ri-calendar-event-line", select: "id, leave_type, start_date, end_date, days, deleted_at, deleted_by, employees(first_name, last_name)", label: (r) => `${r.employees?.first_name || ""} ${r.employees?.last_name || ""} (${r.leave_type})`, detail: (r) => `Leave · ${r.start_date} to ${r.end_date} (${r.days} days)` },
  { table: "work_logs", name: "Daily Work Logs", icon: "ri-file-list-3-line", select: "id, activity, log_date, deleted_at, deleted_by", label: (r) => r.activity, detail: (r) => `Work Log · ${r.log_date}` },
];

export default function RecycleBinPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<BinItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [confirming, setConfirming] = useState<BinItem | null>(null);
  const [working, setWorking] = useState(false);

  const loadItems = useCallback(async () => {
    setLoading(true);
    const results = await Promise.all(
      MODULES.map((m) =>
        supabase
          .from(m.table)
          .select(m.select)
          .not("deleted_at", "is", null)
          .order("deleted_at", { ascending: false })
      )
    );
    const flat: BinItem[] = [];
    results.forEach((res, i) => {
      const cfg = MODULES[i];
      (res.data || []).forEach((r: any) => {
        flat.push({
          table: cfg.table,
          id: r.id,
          label: cfg.label(r),
          detail: cfg.detail(r),
          deleted_at: r.deleted_at,
          deleted_by: r.deleted_by || null,
          raw: r,
        });
      });
    });
    flat.sort((a, b) => (a.deleted_at < b.deleted_at ? 1 : -1));
    setItems(flat);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const restore = async (item: BinItem) => {
    setWorking(true);
    let error: any = null;

    if (item.table === "user_role_assignments") {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: "restore_assignment",
            assignment_id: item.id,
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || result.error) throw new Error(result.error || "Failed to restore user");
      } catch (err) {
        const { error: dbErr } = await supabase
          .from("user_role_assignments")
          .update({ deleted_at: null, deleted_by: null })
          .eq("id", item.id);
        error = dbErr;
      }
    } else if (item.table === "onboarding_requests") {
      const [{ error: dbErr }] = await Promise.all([
        supabase.from("onboarding_requests").update({ deleted_at: null, deleted_by: null }).eq("id", item.id),
        supabase.from("onboarding_checklist_tasks").update({ deleted_at: null, deleted_by: null }).eq("onboarding_request_id", item.id),
      ]);
      error = dbErr;
    } else {
      const { error: dbErr } = await supabase
        .from(item.table)
        .update({ deleted_at: null, deleted_by: null })
        .eq("id", item.id);
      error = dbErr;
    }

    setWorking(false);
    if (error) { toast("Error", "Failed to restore item", "error"); return; }
    toast("Restored", `"${item.label}" is back in ${MODULES.find((m) => m.table === item.table)?.name}.`, "success");
    setConfirming(null);
    loadItems();
  };

  const deleteForever = async (item: BinItem) => {
    setWorking(true);
    let error: any = null;

    if (item.table === "user_role_assignments") {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${import.meta.env.VITE_PUBLIC_SUPABASE_URL}/functions/v1/manage-user-role`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${session?.access_token}`,
            "apikey": import.meta.env.VITE_PUBLIC_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            action: "delete_user_forever",
            assignment_id: item.id,
          }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || result.error) throw new Error(result.error || "Failed to delete user permanently");
      } catch (err) {
        const { error: dbErr } = await supabase.from("user_role_assignments").delete().eq("id", item.id);
        error = dbErr;
      }
    } else if (item.table === "onboarding_requests") {
      const [{ error: dbErr }] = await Promise.all([
        supabase.from("onboarding_checklist_tasks").delete().eq("onboarding_request_id", item.id),
        supabase.from("onboarding_documents").delete().eq("onboarding_request_id", item.id),
        supabase.from("onboarding_requests").delete().eq("id", item.id),
      ]);
      error = dbErr;
    } else {
      const { error: dbErr } = await supabase.from(item.table).delete().eq("id", item.id);
      error = dbErr;
      if (!error && item.table === "documents" && item.raw?.file_url) {
        const filePath = item.raw.file_url.split("/documents/")[1];
        if (filePath) await supabase.storage.from("documents").remove([filePath]);
      }
    }

    setWorking(false);
    if (error) { toast("Error", "Failed to delete item", "error"); return; }
    toast("Deleted forever", `"${item.label}" was permanently erased.`, "success");
    setConfirming(null);
    loadItems();
  };

  const filtered = filter === "all" ? items : items.filter((i) => i.table === filter);
  const counts = MODULES.map((m) => ({
    ...m,
    count: items.filter((i) => i.table === m.table).length,
  })).filter((m) => m.count > 0);

  return (
    <div className="min-h-screen bg-[#F8F8F6] p-6">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
            Recycle Bin
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Deleted items are kept here so they can be restored. Deleting them forever cannot be undone.
          </p>
        </div>
        <button
          onClick={loadItems}
          disabled={working}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer whitespace-nowrap disabled:opacity-50"
        >
          <i className="ri-refresh-line" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{items.length}</p>
          <p className="text-xs text-gray-500">Items in Recycle Bin</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100">
          <p className="text-2xl font-bold text-gray-900">{counts.length}</p>
          <p className="text-xs text-gray-500">Modules with deleted items</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 col-span-2">
          <p className="text-sm text-gray-600 leading-relaxed">
            Deleted records are hidden from their module pages but kept in the database until you permanently delete them here.
          </p>
        </div>
      </div>

      {/* Module filter */}
      <div className="flex flex-wrap gap-2 mb-5">
        <button
          onClick={() => setFilter("all")}
          className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${filter === "all" ? "bg-[#253C7D] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
        >
          All ({items.length})
        </button>
        {counts.map((m) => (
          <button
            key={m.table}
            onClick={() => setFilter(m.table)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${filter === m.table ? "bg-[#253C7D] text-white" : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
          >
            <i className={m.icon} />
            {m.name} ({m.count})
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-3">
        {loading ? (
          <div className="text-center py-12 text-gray-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-100">
            <i className="ri-delete-bin-7-line text-4xl text-gray-200" />
            <p className="text-gray-400 mt-2 text-sm">The Recycle Bin is empty.</p>
          </div>
        ) : (
          filtered.map((item) => {
            const cfg = MODULES.find((m) => m.table === item.table)!;
            return (
              <div key={`${item.table}-${item.id}`} className="bg-white rounded-xl border border-gray-100 p-4 flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                  <i className="ri-delete-bin-line text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-0.5">
                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 flex items-center gap-1">
                      <i className={cfg.icon} />{cfg.name}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 truncate">{item.label}</p>
                  <p className="text-xs text-gray-500 truncate">{item.detail}</p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-gray-500">
                    Deleted {new Date(item.deleted_at).toLocaleString()}
                    {item.deleted_by ? ` by ${item.deleted_by}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => restore(item)}
                    disabled={working}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <i className="ri-refresh-line" />
                    Restore
                  </button>
                  <button
                    onClick={() => setConfirming(item)}
                    disabled={working}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 cursor-pointer whitespace-nowrap disabled:opacity-50"
                  >
                    <i className="ri-delete-bin-2-line" />
                    Delete forever
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {confirming && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="permanent-delete-title"
          onMouseDown={() => !working && setConfirming(null)}
        >
          <div
            className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600">
              <i className="ri-alert-line text-xl" />
            </div>
            <h2 id="permanent-delete-title" className="text-lg font-semibold text-gray-900">Delete forever?</h2>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Are you sure you want to permanently delete <span className="font-semibold text-gray-900">&ldquo;{confirming.label}&rdquo;</span>? This action cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setConfirming(null)}
                disabled={working}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => deleteForever(confirming)}
                disabled={working}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                <i className="ri-delete-bin-2-line" />
                {working ? "Deleting..." : "Delete forever"}
              </button>
            </div>
          </div>
        </div>
      )}

      <p className="text-xs text-gray-400 mt-6">
        Note: personal notifications and system configuration are permanently deleted by design and never appear here.
      </p>
    </div>
  );
}
