import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface LeaveRequest {
  id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  status: string;
  reason: string;
  created_at: string;
}

interface Props {
  employeeId: string;
}

const STATUS_COLOR: Record<string, string> = {
  approved: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  rejected: "bg-red-50 text-red-700",
};

const LEAVE_TYPES = ["vacation", "sick", "personal", "maternity", "paternity", "bereavement", "unpaid"];

const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && bStart <= aEnd;

export default function LeaveTab({ employeeId }: Props) {
  const [requests, setRequests] = useState<LeaveRequest[]>([]);
  const [entitlement, setEntitlement] = useState(18);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [form, setForm] = useState({ leave_type: "vacation", start_date: "", end_date: "", reason: "" });

  const fetchLeave = async () => {
    if (!employeeId) return;
    setLoading(true);
    const { data } = await supabase
      .from("leave_requests")
      .select("id, leave_type, start_date, end_date, days, status, reason, created_at")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false });
    setRequests(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchLeave();
  }, [employeeId]);

  useEffect(() => {
    if (!employeeId) return;
    supabase
      .from("employees")
      .select("annual_leave_days")
      .eq("id", employeeId)
      .maybeSingle()
      .then(({ data }) => setEntitlement(data?.annual_leave_days ?? 18));
  }, [employeeId]);

  // Real-time subscription: live status updates without refresh
  useEffect(() => {
    if (!employeeId) return;
    const channel = supabase
      .channel(`leave-status-${employeeId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "leave_requests", filter: `employee_id=eq.${employeeId}` },
        (payload) => {
          const updated = payload.new as LeaveRequest;
          setRequests((prev) =>
            prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r))
          );
          if (updated.status === "approved" || updated.status === "rejected") {
            setToast(
              updated.status === "approved"
                ? "Your leave request was approved!"
                : "Your leave request was rejected."
            );
            setTimeout(() => setToast(null), 4000);
          }
        }
      )
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "leave_requests", filter: `employee_id=eq.${employeeId}` },
        (payload) => {
          const newReq = payload.new as LeaveRequest;
          setRequests((prev) => [newReq, ...prev]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [employeeId]);

  const calcDays = (from: string, to: string) => {
    if (!from || !to) return 0;
    const d1 = new Date(from), d2 = new Date(to);
    return Math.max(1, Math.ceil((d2.getTime() - d1.getTime()) / 86400000) + 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.start_date || !form.end_date) return;
    if (form.end_date < form.start_date) {
      setToast("End date must be on or after start date.");
      setTimeout(() => setToast(null), 3000);
      return;
    }
    const conflict = requests.find(
      (r) =>
        (r.status === "pending" || r.status === "approved") &&
        rangesOverlap(form.start_date, form.end_date, r.start_date, r.end_date)
    );
    if (conflict) {
      setToast(
        `This overlaps your ${conflict.status} ${conflict.leave_type} request (${conflict.start_date} → ${conflict.end_date}).`
      );
      setTimeout(() => setToast(null), 4000);
      return;
    }
    setSubmitting(true);
    const days = calcDays(form.start_date, form.end_date);
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: employeeId,
      leave_type: form.leave_type,
      start_date: form.start_date,
      end_date: form.end_date,
      days,
      reason: form.reason,
      status: "pending",
    });
    setSubmitting(false);
    if (error) { setToast("Failed to submit. Please try again."); setTimeout(() => setToast(null), 3000); return; }
    setToast("Leave request submitted successfully!");
    setTimeout(() => setToast(null), 3000);
    setShowForm(false);
    setForm({ leave_type: "vacation", start_date: "", end_date: "", reason: "" });
    fetchLeave();
  };

  const currentYear = new Date().getFullYear();
  const totalApproved = requests.filter((r) => r.status === "approved").reduce((s, r) => s + r.days, 0);
  const totalPending = requests.filter((r) => r.status === "pending").length;
  // "Remaining" is entitlement minus what's already spoken for this year —
  // approved AND pending, so a still-undecided request counts against the
  // balance too (otherwise it reads as bookable twice over while it waits).
  const vacationCommittedDays = requests
    .filter(
      (r) =>
        r.leave_type === "vacation" &&
        (r.status === "approved" || r.status === "pending") &&
        new Date(r.start_date).getFullYear() === currentYear
    )
    .reduce((s, r) => s + r.days, 0);
  const remainingDays = Math.max(0, entitlement - vacationCommittedDays);

  if (loading) return <div className="flex items-center justify-center h-40"><div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-5">
      {toast && (
        <div className="fixed top-4 left-4 right-4 sm:top-5 sm:right-5 sm:left-auto sm:max-w-sm z-50 bg-gray-900 text-white text-sm px-4 py-3 rounded-xl shadow-lg">
          {toast}
        </div>
      )}

      {/* Stats + action — an explicit stacked layout on phones (stats grid
          on top, full-width button below) reads cleaner than letting the
          button wrap and float beside a two-row stat grid. Sits side by
          side from sm: up. */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 flex-1 min-w-0">
          {[
            { label: "Days Remaining", value: remainingDays, highlight: true },
            { label: "Total Requests", value: requests.length },
            { label: "Days Approved", value: totalApproved },
            { label: "Pending", value: totalPending },
          ].map((s) => (
            <div
              key={s.label}
              className={`rounded-xl p-4 text-center border ${
                s.highlight
                  ? "bg-[#253C7D]/5 border-[#253C7D]/20"
                  : "bg-white border-gray-100"
              }`}
            >
              <p className={`text-2xl font-bold ${s.highlight ? "text-[#253C7D]" : "text-gray-900"}`}>
                {s.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[#253C7D] text-white rounded-xl text-sm font-semibold hover:bg-[#1F336A] transition-colors cursor-pointer whitespace-nowrap shrink-0"
        >
          <i className={`${showForm ? "ri-close-line" : "ri-add-line"}`} />
          {showForm ? "Cancel" : "New Request"}
        </button>
      </div>

      {/* Submit Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="bg-[#253C7D]/5 border border-[#253C7D]/20 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-gray-900">Submit Leave Request</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Leave Type</label>
              <select
                value={form.leave_type}
                onChange={(e) => setForm((p) => ({ ...p, leave_type: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
              >
                {LEAVE_TYPES.map((t) => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
              </select>
            </div>
            <div />
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">Start Date</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={(e) => setForm((p) => ({ ...p, start_date: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1.5 block">
                End Date
                {form.start_date && form.end_date && (
                  <span className="text-[#253C7D] ml-2">({calcDays(form.start_date, form.end_date)} days)</span>
                )}
              </label>
              <input
                type="date"
                required
                min={form.start_date}
                value={form.end_date}
                onChange={(e) => setForm((p) => ({ ...p, end_date: e.target.value }))}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
              />
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1.5 block">Reason (optional)</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
              maxLength={500}
              rows={3}
              placeholder="Brief description of your leave request..."
              className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 resize-none"
            />
            <p className="text-xs text-gray-400 text-right mt-0.5">{form.reason.length}/500</p>
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={submitting} className="flex items-center gap-2 px-5 py-2 bg-[#253C7D] text-white rounded-lg text-sm hover:bg-[#1F336A] disabled:opacity-60 transition-colors cursor-pointer whitespace-nowrap">
              {submitting ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <i className="ri-send-plane-line" />}
              Submit Request
            </button>
          </div>
        </form>
      )}

      {/* Leave List */}
      {requests.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-calendar-event-line text-3xl mb-2" />
          <p className="text-sm">No leave requests yet</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
          <div className="divide-y divide-gray-50">
            {requests.map((r) => (
              <div key={r.id} className="flex items-center gap-4 px-5 py-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-50 shrink-0">
                  <i className={`text-lg ${
                    r.status === "approved" ? "ri-checkbox-circle-line text-emerald-500" :
                    r.status === "rejected" ? "ri-close-circle-line text-red-400" :
                    "ri-time-line text-amber-500"
                  }`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 capitalize">{r.leave_type} Leave</p>
                  <p className="text-xs text-gray-500 mt-0.5">{r.start_date} → {r.end_date} · {r.days} day{r.days !== 1 ? "s" : ""}</p>
                  {r.reason && <p className="text-xs text-gray-400 mt-0.5 truncate">{r.reason}</p>}
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1.5 justify-end">
                    {r.status === "pending" && (
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                    )}
                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_COLOR[r.status] || "bg-gray-100 text-gray-600"}`}>{r.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-400 mt-1">{new Date(r.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}