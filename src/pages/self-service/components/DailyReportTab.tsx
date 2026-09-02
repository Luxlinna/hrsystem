import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { DailyReportSummaryCards } from "./daily-report/DailyReportSummaryCards";
import { DailyReportToolbar } from "./daily-report/DailyReportToolbar";
import { DailyReportEntryRow, type WorkLog } from "./daily-report/DailyReportEntryRow";
import { DailyReportModal } from "./daily-report/DailyReportModal";

interface Props {
  employeeId: string;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const hoursBetween = (start: string | null, end: string | null) => {
  if (!start || !end) return 0;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const mins = eh * 60 + em - (sh * 60 + sm);
  return mins > 0 ? mins / 60 : 0;
};

const fmtDateLabel = (ymd: string) =>
  new Date(`${ymd}T00:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

const emptyForm = { log_date: toYMD(new Date()), start_time: "08:00", end_time: "12:00", activity: "", notes: "" };

export default function DailyReportTab({ employeeId }: Props) {
  const { user } = useAuth();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const [logs, setLogs] = useState<WorkLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"day" | "week" | "month" | "year">("day");
  const [anchor, setAnchor] = useState(new Date());
  const [toast, setToast] = useState<{ type: string; message: string } | null>(null);

  const [showModal, setShowModal] = useState(false);
  const [editingLog, setEditingLog] = useState<WorkLog | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const showToast = (type: string, message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const year = anchor.getFullYear();

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from("work_logs")
      .select("*")
      .eq("employee_id", employeeId)
      .is("deleted_at", null)
      .gte("log_date", `${year}-01-01`)
      .lte("log_date", `${year}-12-31`)
      .order("log_date", { ascending: true })
      .order("start_time", { ascending: true });
    setLogs(data || []);
    setLoading(false);
  }, [employeeId, year]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const shift = (delta: number) => {
    const d = new Date(anchor);
    if (view === "day") d.setDate(d.getDate() + delta);
    else if (view === "week") d.setDate(d.getDate() + delta * 7);
    else if (view === "month") d.setMonth(d.getMonth() + delta, 1);
    else d.setFullYear(d.getFullYear() + delta);
    setAnchor(d);
  };

  const openAdd = (date?: string) => {
    setEditingLog(null);
    setForm({ ...emptyForm, log_date: date || toYMD(anchor) });
    setShowModal(true);
  };

  const openEdit = (log: WorkLog) => {
    setEditingLog(log);
    setForm({
      log_date: log.log_date,
      start_time: log.start_time || "",
      end_time: log.end_time || "",
      activity: log.activity || "",
      notes: log.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.activity.trim()) {
      showToast("error", "Activity is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        employee_id: employeeId,
        log_date: form.log_date,
        start_time: form.start_time || null,
        end_time: form.end_time || null,
        activity: form.activity.trim(),
        notes: form.notes.trim() || null,
      };

      if (editingLog) {
        const { error } = await supabase.from("work_logs").update(payload).eq("id", editingLog.id);
        if (error) throw error;
        showToast("success", "Entry updated");
      } else {
        const { error } = await supabase.from("work_logs").insert(payload);
        if (error) throw error;
        showToast("success", "Entry added");
      }
      setShowModal(false);
      loadLogs();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingLog) return;
    if (!confirm("Delete this entry?")) return;
    setSaving(true);
    try {
      const { error } = await supabase.from("work_logs").update({ deleted_at: new Date().toISOString() }).eq("id", editingLog.id);
      if (error) throw error;
      showToast("success", "Entry deleted");
      setShowModal(false);
      loadLogs();
    } catch (err: any) {
      showToast("error", err?.message || "Failed to delete");
    } finally {
      setSaving(false);
    }
  };

  const todayStr = toYMD(new Date());
  const todayLogs = logs.filter((l) => l.log_date === todayStr);
  const todayHours = todayLogs.reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0);

  const startOfWeek = new Date(anchor);
  startOfWeek.setDate(anchor.getDate() - anchor.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return toYMD(d);
  });
  const weekLogs = logs.filter((l) => weekDays.includes(l.log_date));
  const weekHours = weekLogs.reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0);

  const currentYMD = toYMD(anchor);
  const dayLogs = logs.filter((l) => l.log_date === currentYMD);

  const monthPrefix = `${year}-${String(anchor.getMonth() + 1).padStart(2, "0")}`;
  const monthDays = Array.from(new Set(logs.filter((l) => l.log_date.startsWith(monthPrefix)).map((l) => l.log_date))).sort();

  const monthSummary = MONTHS.map((name, i) => {
    const pfx = `${year}-${String(i + 1).padStart(2, "0")}`;
    const mLogs = logs.filter((l) => l.log_date.startsWith(pfx));
    const hours = mLogs.reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0);
    return { label: name, entries: mLogs.length, hours: Math.round(hours * 10) / 10 };
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20 text-gray-400">
        <i className="ri-loader-4-line text-2xl animate-spin mr-2" /> Loading reports...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {toast && (
        <div
          className={`p-3 rounded-xl text-[13px] font-medium flex items-center gap-2 ${
            toast.type === "error" ? "bg-red-50 text-red-700 border border-red-200" : "bg-emerald-50 text-emerald-700 border border-emerald-200"
          }`}
        >
          <i className={toast.type === "error" ? "ri-error-warning-line" : "ri-checkbox-circle-line"} />
          <span>{toast.message}</span>
        </div>
      )}

      {/* Summary KPI Cards */}
      <DailyReportSummaryCards
        todayCount={todayLogs.length}
        todayHours={todayHours}
        weekCount={weekLogs.length}
        weekHours={weekHours}
      />

      {/* Toolbar & View Toggles */}
      <DailyReportToolbar
        view={view}
        setView={setView}
        anchor={anchor}
        shift={shift}
        setAnchor={setAnchor}
        weekDays={weekDays}
        openAdd={() => openAdd()}
      />

      {/* Day View */}
      {view === "day" && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[110px_1.2fr_1fr] gap-3 px-4 py-2 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            <span>Time</span>
            <span>Activity</span>
            <span className="hidden sm:block">Notes</span>
          </div>
          {dayLogs.length ? (
            dayLogs.map((l) => <DailyReportEntryRow key={l.id} log={l} onEdit={openEdit} />)
          ) : (
            <p className="text-center py-10 text-gray-400 text-[13px]">No entries for this day yet.</p>
          )}
        </div>
      )}

      {/* Week View */}
      {view === "week" && (
        <div className="space-y-3">
          {weekDays.map((ymd) => {
            const dayEntries = logs.filter((l) => l.log_date === ymd);
            return (
              <div key={ymd} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                  <span className="text-[12px] font-semibold text-gray-700">{fmtDateLabel(ymd)}</span>
                  <button onClick={() => openAdd(ymd)} className="text-[#253C7D] text-[11px] font-semibold hover:underline cursor-pointer">
                    + Add
                  </button>
                </div>
                {dayEntries.length ? (
                  dayEntries.map((l) => <DailyReportEntryRow key={l.id} log={l} onEdit={openEdit} />)
                ) : (
                  <p className="text-center py-4 text-gray-300 text-[12px]">No entries</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Month View */}
      {view === "month" && (
        <div className="space-y-3">
          {monthDays.length === 0 && (
            <p className="text-center py-10 text-gray-400 text-[13px] bg-white border border-gray-100 rounded-xl">
              No entries this month yet.
            </p>
          )}
          {monthDays.map((ymd) => {
            const dayEntries = logs.filter((l) => l.log_date === ymd);
            return (
              <div key={ymd} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-[12px] font-semibold text-gray-700">{fmtDateLabel(ymd)}</div>
                {dayEntries.map((l) => (
                  <DailyReportEntryRow key={l.id} log={l} onEdit={openEdit} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {/* Year View */}
      {view === "year" && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-gray-100 text-left text-[11px] text-gray-500 uppercase tracking-wide">
                <th className="px-4 py-3">Month</th>
                <th className="px-4 py-3">Entries</th>
                <th className="px-4 py-3">Hours Logged</th>
              </tr>
            </thead>
            <tbody>
              {monthSummary.map((m) => (
                <tr key={m.label} className="border-b border-gray-50 last:border-0">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{m.label}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.entries}</td>
                  <td className="px-4 py-2.5 text-gray-600">{m.hours}h</td>
                </tr>
              ))}
              <tr className="bg-gray-50 font-semibold">
                <td className="px-4 py-2.5 text-gray-900">Total</td>
                <td className="px-4 py-2.5 text-gray-900">{monthSummary.reduce((s, m) => s + m.entries, 0)}</td>
                <td className="px-4 py-2.5 text-gray-900">{Math.round(monthSummary.reduce((s, m) => s + m.hours, 0) * 10) / 10}h</td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {/* Add / Edit Modal */}
      <DailyReportModal
        showModal={showModal}
        setShowModal={setShowModal}
        saving={saving}
        editingLog={editingLog}
        form={form}
        setForm={setForm}
        handleSave={handleSave}
        handleDelete={handleDelete}
      />
    </div>
  );
}
