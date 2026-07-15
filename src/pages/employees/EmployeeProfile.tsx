import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import app from "@/lib/firebase";
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  branch_id: string;
  status: string;
  join_date: string;
  avatar_url: string | null;
  reports_to: string | null;
  branches?: { name: string } | null;
}

interface ReportEntry {
  first_name: string;
  last_name: string;
  role: string;
  id: string;
}

export default function EmployeeProfile() {
  const { id } = useParams<{ id: string }>();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [manager, setManager] = useState<ReportEntry | null>(null);
  const [reports, setReports] = useState<ReportEntry[]>([]);
  const [interviews, setInterviews] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [payrollRecords, setPayrollRecords] = useState<any[]>([]);
  const [form, setForm] = useState<Partial<Employee>>();
  const [allEmployees, setAllEmployees] = useState<ReportEntry[]>([]);

  useEffect(() => {
    if (!id) return;
    loadEmployee(id);
  }, [id]);

  const loadEmployee = async (empId: string) => {
    setLoading(true);
    const { data: emp } = await supabase
      .from("employees")
      .select("*, branches(name)")
      .eq("id", empId)
      .maybeSingle();

    if (!emp) {
      toast("Not found", "Employee not found", "error");
      setLoading(false);
      return;
    }

    setEmployee(emp as Employee);
    setForm(emp as Employee);

    // Load manager
    if (emp.reports_to) {
      const { data: mgr } = await supabase
        .from("employees")
        .select("id, first_name, last_name, role")
        .eq("id", emp.reports_to)
        .maybeSingle();
      if (mgr) setManager(mgr);
    }

    // Load direct reports
    const { data: reps } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role")
      .eq("reports_to", empId);
    setReports(reps || []);

    // Load all employees for manager dropdown
    const { data: all } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role");
    setAllEmployees((all || []).filter((e: any) => e.id !== empId));

    // Load interviews as interviewer
    const { data: ivs } = await supabase
      .from("interviews")
      .select("*, candidates(full_name, job_postings(title))")
      .eq("interviewer_id", empId)
      .order("scheduled_at", { ascending: false });
    setInterviews(ivs || []);

    // Load leave requests
    const { data: leaves } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", empId)
      .order("created_at", { ascending: false })
      .limit(5);
    setLeaveRequests(leaves || []);

    // Load payroll
    const { data: pay } = await supabase
      .from("payroll_records")
      .select("*")
      .eq("employee_id", empId)
      .order("created_at", { ascending: false })
      .limit(5);
    setPayrollRecords(pay || []);

    setLoading(false);
  };

  const saveChanges = async () => {
    if (!id || !employee) return;
    setSaving(true);
    const { error } = await supabase
      .from("employees")
      .update({
        first_name: form.first_name,
        last_name: form.last_name,
        email: form.email,
        phone: form.phone,
        role: form.role,
        department: form.department,
        branch_id: form.branch_id,
        status: form.status,
        join_date: form.join_date,
        reports_to: form.reports_to,
      })
      .eq("id", id);

    if (error) {
      toast("Error", error.message, "error");
    } else {
      toast("Saved", "Employee profile updated successfully", "success");
      setEditing(false);
      loadEmployee(id);
    }
    setSaving(false);
  };

  const uploadAvatar = async (file: File) => {
    if (!id) return;
    setUploadingAvatar(true);
    try {
      const firebaseStorage = getStorage(app);
      const storageRef = ref(firebaseStorage, `avatars/${id}_${Date.now()}_${file.name}`);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      await supabase.from("employees").update({ avatar_url: url }).eq("id", id);
      setEmployee((prev) => (prev ? { ...prev, avatar_url: url } : prev));
      toast("Avatar updated", "Profile picture saved", "success");
    } catch {
      toast("Upload failed", "Could not upload avatar", "error");
    }
    setUploadingAvatar(false);
  };

  const initials = `${employee?.first_name?.[0] || ""}${employee?.last_name?.[0] || ""}`;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="p-10 text-center">
        <i className="ri-user-search-line text-4xl text-gray-300 mb-3 block" />
        <p className="text-gray-500">Employee not found</p>
        <Link to="/employees" className="text-[13px] text-[#0D7377] hover:underline mt-2 inline-block">
          Back to Directory
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-[#FAFAF8]">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-6 text-[12px] text-gray-500">
        <Link to="/" className="hover:text-[#0D7377]">Dashboard</Link>
        <i className="ri-arrow-right-s-line" />
        <Link to="/employees" className="hover:text-[#0D7377]">Directory</Link>
        <i className="ri-arrow-right-s-line" />
        <span className="text-gray-900 font-medium">{employee.first_name} {employee.last_name}</span>
      </div>

      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6 md:p-8 mb-6">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Avatar */}
          <div className="relative shrink-0">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={employee.first_name}
                className="w-24 h-24 rounded-2xl object-cover border border-gray-100"
              />
            ) : (
              <div className="w-24 h-24 rounded-2xl bg-[#0D7377] flex items-center justify-center text-white text-3xl font-bold">
                {initials}
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-8 h-8 bg-[#0D7377] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#0a5c60] transition-colors">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) uploadAvatar(file);
                }}
              />
              <i className="ri-camera-line text-white text-sm" />
            </label>
            {uploadingAvatar && (
              <div className="absolute inset-0 bg-black/30 rounded-2xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex flex-col md:flex-row md:items-center gap-3 md:gap-4">
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">
                {employee.first_name} {employee.last_name}
              </h1>
              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-3 py-1 rounded-full w-fit ${
                employee.status === "active"
                  ? "bg-green-50 text-green-700"
                  : "bg-amber-50 text-amber-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${employee.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                {employee.status}
              </span>
            </div>
            <p className="text-[14px] text-gray-600 mt-1">{employee.role}</p>
            <div className="flex flex-wrap gap-3 mt-3 text-[12px] text-gray-500">
              <span className="flex items-center gap-1"><i className="ri-building-line" />{employee.department}</span>
              <span className="flex items-center gap-1"><i className="ri-map-pin-line" />{employee.branches?.name || "Headquarters"}</span>
              <span className="flex items-center gap-1"><i className="ri-mail-line" />{employee.email}</span>
              <span className="flex items-center gap-1"><i className="ri-phone-line" />{employee.phone || "—"}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setEditing(!editing)}
              className="px-4 py-2 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors"
            >
              <i className={`ri-${editing ? "close" : "edit"}-line mr-1`} />
              {editing ? "Cancel" : "Edit Profile"}
            </button>
            <Link
              to="/org-chart"
              className="px-4 py-2 border border-gray-200 text-gray-700 text-[13px] font-semibold rounded-lg hover:bg-gray-50 transition-colors"
            >
              <i className="ri-organization-chart mr-1" />
              Org Chart
            </Link>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Profile Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info Card */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-[#1A1A1A]">Profile Information</h2>
              {editing && (
                <button
                  onClick={saveChanges}
                  disabled={saving}
                  className="px-4 py-2 bg-[#0D7377] text-white text-[12px] font-semibold rounded-lg hover:bg-[#0a5c60] disabled:opacity-60"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">First Name</label>
                {editing ? (
                  <input
                    value={form.first_name || ""}
                    onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900 font-medium">{employee.first_name}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Last Name</label>
                {editing ? (
                  <input
                    value={form.last_name || ""}
                    onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900 font-medium">{employee.last_name}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Email</label>
                {editing ? (
                  <input
                    type="email"
                    value={form.email || ""}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900">{employee.email}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Phone</label>
                {editing ? (
                  <input
                    value={form.phone || ""}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900">{employee.phone || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Role</label>
                {editing ? (
                  <input
                    value={form.role || ""}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900">{employee.role}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Department</label>
                {editing ? (
                  <input
                    value={form.department || ""}
                    onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900">{employee.department}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Join Date</label>
                {editing ? (
                  <input
                    type="date"
                    value={form.join_date || ""}
                    onChange={(e) => setForm({ ...form, join_date: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  />
                ) : (
                  <p className="text-[14px] text-gray-900">{employee.join_date || "—"}</p>
                )}
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Status</label>
                {editing ? (
                  <select
                    value={form.status || ""}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  >
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                ) : (
                  <p className="text-[14px] text-gray-900 capitalize">{employee.status}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-1">Reports To</label>
                {editing ? (
                  <select
                    value={form.reports_to || ""}
                    onChange={(e) => setForm({ ...form, reports_to: e.target.value || null })}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 text-[13px] focus:outline-none focus:border-[#0D7377]"
                  >
                    <option value="">No manager</option>
                    {allEmployees.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.first_name} {e.last_name} — {e.role}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="flex items-center gap-2">
                    {manager ? (
                      <>
                        <Link
                          to={`/employees/${manager.id}`}
                          className="text-[14px] text-[#0D7377] font-medium hover:underline flex items-center gap-1"
                        >
                          <i className="ri-user-line" />
                          {manager.first_name} {manager.last_name}
                        </Link>
                        <span className="text-[12px] text-gray-400">({manager.role})</span>
                      </>
                    ) : (
                      <p className="text-[14px] text-gray-500">No manager assigned</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Leave History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Leave History</h2>
            {leaveRequests.length > 0 ? (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Type</span>
                  <span>Dates</span>
                  <span>Status</span>
                  <span>Requested</span>
                </div>
                {leaveRequests.map((l) => (
                  <div key={l.id} className="grid grid-cols-4 px-4 py-3 border-t border-gray-50 text-[13px]">
                    <span className="capitalize">{l.leave_type}</span>
                    <span className="text-gray-600">{l.start_date?.slice(5)} - {l.end_date?.slice(5)}</span>
                    <span className={`capitalize font-medium ${
                      l.status === "approved" ? "text-green-600" : l.status === "pending" ? "text-amber-600" : "text-red-500"
                    }`}>{l.status}</span>
                    <span className="text-gray-500">{new Date(l.created_at).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">No leave requests on record.</p>
            )}
          </div>

          {/* Payroll History */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <h2 className="text-lg font-bold text-[#1A1A1A] mb-4">Payroll History</h2>
            {payrollRecords.length > 0 ? (
              <div className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="grid grid-cols-5 bg-gray-50 px-4 py-2.5 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                  <span>Month</span>
                  <span className="text-right">Gross</span>
                  <span className="text-right">Deductions</span>
                  <span className="text-right">Net Pay</span>
                  <span>Status</span>
                </div>
                {payrollRecords.map((p) => (
                  <div key={p.id} className="grid grid-cols-5 px-4 py-3 border-t border-gray-50 text-[13px]">
                    <span className="text-gray-900 font-medium">{p.month}</span>
                    <span className="text-right text-gray-700">${Number(p.gross_pay || 0).toLocaleString()}</span>
                    <span className="text-right text-gray-700">${Number(p.deductions || 0).toLocaleString()}</span>
                    <span className="text-right font-semibold text-[#0D7377]">${Number(p.net_pay || 0).toLocaleString()}</span>
                    <span className={`capitalize text-[11px] font-semibold px-2 py-0.5 rounded-full w-fit ${
                      p.status === "processed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                    }`}>{p.status}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[13px] text-gray-400">No payroll records on file.</p>
            )}
          </div>
        </div>

        {/* Right: Sidebar */}
        <div className="space-y-6">
          {/* Org Drill-down */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Reporting Line</h3>
            {manager && (
              <Link
                to={`/employees/${manager.id}`}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-600 font-bold">
                  {manager.first_name[0]}{manager.last_name[0]}
                </div>
                <div>
                  <p className="text-[13px] font-semibold text-gray-900 group-hover:text-[#0D7377]">{manager.first_name} {manager.last_name}</p>
                  <p className="text-[11px] text-gray-500">{manager.role} — Manager</p>
                </div>
                <i className="ri-arrow-right-s-line text-gray-400 ml-auto" />
              </Link>
            )}
            {!manager && <p className="text-[13px] text-gray-400">No manager assigned</p>}
          </div>

          {/* Direct Reports */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#1A1A1A]">Direct Reports</h3>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{reports.length}</span>
            </div>
            <div className="space-y-2">
              {reports.length > 0 ? reports.map((r) => (
                <Link
                  key={r.id}
                  to={`/employees/${r.id}`}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-lg bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] font-bold text-xs">
                    {r.first_name[0]}{r.last_name[0]}
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-gray-900">{r.first_name} {r.last_name}</p>
                    <p className="text-[11px] text-gray-500">{r.role}</p>
                  </div>
                </Link>
              )) : (
                <p className="text-[13px] text-gray-400">No direct reports</p>
              )}
            </div>
          </div>

          {/* Upcoming Interviews */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#1A1A1A]">Assigned Interviews</h3>
              <span className="text-[11px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">{interviews.length}</span>
            </div>
            <div className="space-y-3">
              {interviews.length > 0 ? interviews.slice(0, 4).map((iv) => (
                <div key={iv.id} className="p-3 rounded-xl bg-gray-50/80 border border-gray-100">
                  <div className="flex items-center justify-between">
                    <p className="text-[13px] font-semibold text-gray-900">{iv.candidates?.full_name || "Candidate"}</p>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                      iv.status === "scheduled" ? "bg-blue-50 text-blue-700" : iv.status === "completed" ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"
                    }`}>{iv.status}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">{iv.candidates?.job_postings?.title || "—"}</p>
                  <div className="flex items-center gap-2 mt-2 text-[11px] text-gray-400">
                    <span className="flex items-center gap-0.5"><i className="ri-calendar-line" /> {iv.scheduled_at ? new Date(iv.scheduled_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "TBD"}</span>
                    <span className="flex items-center gap-0.5"><i className="ri-time-line" /> {iv.duration_minutes}m</span>
                    <span className="flex items-center gap-0.5"><i className="ri-video-chat-line" /> {iv.type}</span>
                  </div>
                </div>
              )) : (
                <p className="text-[13px] text-gray-400">No interviews assigned.</p>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <h3 className="text-[14px] font-bold text-[#1A1A1A] mb-3">Quick Actions</h3>
            <div className="space-y-1">
              <Link to="/leave" className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-[13px] text-gray-700 transition-colors">
                <i className="ri-calendar-event-line text-gray-400" /> Request Leave
              </Link>
              <Link to="/payroll-module" className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-[13px] text-gray-700 transition-colors">
                <i className="ri-money-dollar-circle-line text-gray-400" /> View Payslips
              </Link>
              <Link to="/settings" className="flex items-center gap-2 p-2.5 rounded-lg hover:bg-gray-50 text-[13px] text-gray-700 transition-colors">
                <i className="ri-settings-3-line text-gray-400" /> Account Settings
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}