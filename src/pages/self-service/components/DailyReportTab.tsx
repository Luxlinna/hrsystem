import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";

interface Props {
  employeeId: string;
}

interface WorkLog {
  id: string;
  log_date: string;
  start_time: string | null;
  end_time: string | null;
  activity: string;
  notes: string | null;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const toYMD = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const fmtTime = (t: string | null) => (t ? new Date(`2000-01-01T${t}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "--");

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

  useEffect(() => { loadLogs(); }, [loadLogs]);

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
      activity: log.activity,
      notes: log.notes || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.activity.trim() || !form.log_date) return;
    setSaving(true);
    const payload = {
      employee_id: employeeId,
      log_date: form.log_date,
      start_time: form.start_time || null,
      end_time: form.end_time || null,
      activity: form.activity.trim(),
      notes: form.notes || null,
    };
    const { error } = editingLog
      ? await supabase.from("work_logs").update(payload).eq("id", editingLog.id)
      : await supabase.from("work_logs").insert(payload);
    setSaving(false);
    if (error) { showToast("error", "Couldn't save entry."); return; }
    showToast("success", editingLog ? "Entry updated." : "Entry added.");
    setShowModal(false);
    loadLogs();
  };

  const handleDelete = async () => {
    if (!editingLog) return;
    if (!confirm("Delete this entry? It will be moved to the Recycle Bin and can be restored later.")) return;
    const { error } = await supabase
      .from("work_logs")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", editingLog.id);
    if (error) { showToast("error", "Couldn't delete entry."); return; }
    showToast("success", "Entry moved to Recycle Bin.");
    setShowModal(false);
    loadLogs();
  };

  // ── Derived groupings ──
  const dayYMD = toYMD(anchor);
  const dayLogs = logs.filter((l) => l.log_date === dayYMD);

  const weekStart = new Date(anchor);
  weekStart.setDate(weekStart.getDate() - weekStart.getDay());
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return toYMD(d);
  });

  const monthDays = Array.from(
    new Set(logs.filter((l) => l.log_date.startsWith(`${year}-${String(anchor.getMonth() + 1).padStart(2, "0")}`)).map((l) => l.log_date))
  ).sort();

  const monthSummary = MONTHS.map((label, i) => {
    const monthLogs = logs.filter((l) => Number(l.log_date.slice(5, 7)) === i + 1);
    const hours = monthLogs.reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0);
    return { label, entries: monthLogs.length, hours: Math.round(hours * 10) / 10 };
  });

  const weekLogsCount = logs.filter((l) => weekDays.includes(l.log_date)).length;
  const weekHours = logs.filter((l) => weekDays.includes(l.log_date)).reduce((s, l) => s + hoursBetween(l.start_time, l.end_time), 0);

  const renderEntryRow = (l: WorkLog) => (
    <div
      key={l.id}
      onClick={() => openEdit(l)}
      className="grid grid-cols-[110px_1fr] sm:grid-cols-[110px_1.2fr_1fr] gap-3 px-4 py-2.5 border-t border-gray-50 hover:bg-gray-50 cursor-pointer text-[13px]"
    >
      <span className="text-gray-500">{fmtTime(l.start_time)} – {fmtTime(l.end_time)}</span>
      <span className="text-gray-900 font-medium">{l.activity}</span>
      <span className="hidden sm:block text-gray-400 truncate">{l.notes}</span>
    </div>
  );

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-5">
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl text-[13px] font-semibold text-white shadow-lg ${toast.type === "success" ? "bg-[#253C7D]" : "bg-red-500"}`}>
          {toast.message}
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xl font-bold text-gray-900">{dayLogs.length}</p>
          <p className="text-[11px] text-gray-500">Entries today</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xl font-bold text-gray-900">{weekLogsCount}</p>
          <p className="text-[11px] text-gray-500">Entries this week</p>
        </div>
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <p className="text-xl font-bold text-gray-900">{Math.round(weekHours * 10) / 10}h</p>
          <p className="text-[11px] text-gray-500">Hours this week</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg p-1">
          {(["day", "week", "month", "year"] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`px-3 py-1.5 rounded-md text-[12px] font-semibold capitalize cursor-pointer ${view === v ? "bg-gray-900 text-white" : "text-gray-500 hover:text-gray-700"}`}
            >
              {v}
            </button>
          ))}
        </div>
        <button onClick={() => shift(-1)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer">
          <i className="ri-arrow-left-s-line" />
        </button>
        <p className="text-[13px] font-semibold text-gray-800 min-w-[160px]">
          {view === "day" && anchor.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
          {view === "week" && `${fmtDateLabel(weekDays[0])} – ${fmtDateLabel(weekDays[6])}`}
          {view === "month" && `${MONTHS[anchor.getMonth()]} ${year}`}
          {view === "year" && year}
        </p>
        <button onClick={() => shift(1)} className="w-8 h-8 flex items-center justify-center border border-gray-200 rounded-lg hover:bg-gray-100 cursor-pointer">
          <i className="ri-arrow-right-s-line" />
        </button>
        <button onClick={() => setAnchor(new Date())} className="text-[#253C7D] text-[12px] font-medium hover:underline cursor-pointer">
          Today
        </button>
        <button
          onClick={() => openAdd()}
          className="ml-auto inline-flex items-center gap-2 bg-[#253C7D] text-white px-4 py-2 rounded-lg text-[12px] font-semibold hover:bg-[#1F336A] cursor-pointer"
        >
          <i className="ri-add-line" /> Add Entry
        </button>
      </div>

      {view === "day" && (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="grid grid-cols-[110px_1fr] sm:grid-cols-[110px_1.2fr_1fr] gap-3 px-4 py-2 bg-gray-50 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
            <span>Time</span><span>Activity</span><span className="hidden sm:block">Notes</span>
          </div>
          {dayLogs.length ? dayLogs.map(renderEntryRow) : (
            <p className="text-center py-10 text-gray-400 text-[13px]">No entries for this day yet.</p>
          )}
        </div>
      )}

      {view === "week" && (
        <div className="space-y-3">
          {weekDays.map((ymd) => {
            const dayEntries = logs.filter((l) => l.log_date === ymd);
            return (
              <div key={ymd} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2 bg-gray-50">
                  <span className="text-[12px] font-semibold text-gray-700">{fmtDateLabel(ymd)}</span>
                  <button onClick={() => openAdd(ymd)} className="text-[#253C7D] text-[11px] font-semibold hover:underline cursor-pointer">+ Add</button>
                </div>
                {dayEntries.length ? dayEntries.map(renderEntryRow) : (
                  <p className="text-center py-4 text-gray-300 text-[12px]">No entries</p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === "month" && (
        <div className="space-y-3">
          {monthDays.length === 0 && (
            <p className="text-center py-10 text-gray-400 text-[13px] bg-white border border-gray-100 rounded-xl">No entries this month yet.</p>
          )}
          {monthDays.map((ymd) => {
            const dayEntries = logs.filter((l) => l.log_date === ymd);
            return (
              <div key={ymd} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-4 py-2 bg-gray-50 text-[12px] font-semibold text-gray-700">{fmtDateLabel(ymd)}</div>
                {dayEntries.map(renderEntryRow)}
              </div>
            );
          })}
        </div>
      )}

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

      {showModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => !saving && setShowModal(false)}>
          <div className="bg-white rounded-2xl w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-4">{editingLog ? "Edit Entry" : "Add Work Entry"}</h3>

            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Date</label>
            <input
              type="date"
              value={form.log_date}
              onChange={(e) => setForm({ ...form, log_date: e.target.value })}
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
            />

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Start</label>
                <input
                  type="time"
                  value={form.start_time}
                  onChange={(e) => setForm({ ...form, start_time: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">End</label>
                <input
                  type="time"
                  value={form.end_time}
                  onChange={(e) => setForm({ ...form, end_time: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
                />
              </div>
            </div>

            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Work Activity</label>
            <input
              type="text"
              value={form.activity}
              onChange={(e) => setForm({ ...form, activity: e.target.value })}
              placeholder="e.g. Reviewed onboarding documents"
              className="w-full mt-1 mb-3 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D]"
            />

            <label className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Optional detail..."
              className="w-full mt-1 mb-4 px-3 py-2 border border-gray-200 rounded-lg text-[13px] focus:outline-none focus:border-[#253C7D] resize-none"
            />

            <div className="flex gap-2">
              {editingLog && (
                <button onClick={handleDelete} className="px-4 py-2.5 border border-red-200 text-red-600 rounded-lg text-[13px] font-semibold hover:bg-red-50 cursor-pointer">
                  <i className="ri-delete-bin-line" />
                </button>
              )}
              <button
                onClick={() => setShowModal(false)}
                disabled={saving}
                className="flex-1 border border-gray-200 text-gray-700 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-50 cursor-pointer disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 bg-[#253C7D] text-white py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] cursor-pointer disabled:opacity-60"
              >
                {saving ? "Saving..." : editingLog ? "Save Changes" : "Add Entry"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
