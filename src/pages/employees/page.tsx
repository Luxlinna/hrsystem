import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { useAuth } from "@/context/AuthContext";
import { usePermissions } from "@/hooks/usePermissions";
import { logActivity } from "@/lib/audit";
import { notify } from "@/lib/notify";

const DEPARTMENTS = ["Engineering", "Sales", "Operations", "Marketing", "Finance", "HR", "IT", "Legal", "Executive", "Customer Service"];

const emptyForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
  role: "",
  department: DEPARTMENTS[0],
  branch_id: "",
  status: "onboarding",
  join_date: new Date().toISOString().split("T")[0],
  reports_to: "",
};

export default function Employees() {
  const { user } = useAuth();
  const { role, isAdmin } = usePermissions();
  const actorName = (user?.user_metadata?.display_name as string) || user?.email || "Unknown";
  const canManage = isAdmin || !!role?.employees_manage;
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string; color: string }[]>([]);
  const [accountStatus, setAccountStatus] = useState<Record<string, { invited: boolean; hasAccount: boolean }>>({});
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  const loadEmployees = () => {
    supabase.from("employees").select("*, branches(name)").is("deleted_at", null).order("first_name").then(({ data, error }) => {
      if (error) { toast("Error", "Failed to load employee directory", "error"); return; }
      setEmployees(data || []);
    });
  };

  useEffect(() => {
    loadEmployees();
    supabase.from("branches").select("id, name").order("name").then(({ data }) => setBranches(data || []));
    supabase.from("app_roles").select("id, name, color").order("name").then(({ data }) => setRoles(data || []));
  }, []);

  // Load account status for each employee
  useEffect(() => {
    const emails = employees.map((e) => e.email);
    if (emails.length === 0) return;
    supabase.rpc("get_user_account_status", { emails }).then(({ data }) => {
      if (data) {
        const statusMap: Record<string, { invited: boolean; hasAccount: boolean }> = {};
        data.forEach((row: any) => {
          statusMap[row.email] = { invited: row.invited, hasAccount: row.has_account };
        });
        setAccountStatus(statusMap);
      }
    });
  }, [employees]);

  useEffect(() => {
    setPage(1);
  }, [search, filterDept]);

  const depts = Array.from(new Set(employees.map((e) => e.department)));
  const branchCount = new Set(employees.map((e) => e.branch_id).filter(Boolean)).size;
  // Reporting lines can point to any manager in the company. Include the
  // department in the option label so same-named managers are distinguishable.
  const managers = employees.filter((employee) => /\bmanager\b/i.test(employee.role || ""));

  const filtered = employees.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !filterDept || e.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const empTotalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const empSafePage = Math.min(page, empTotalPages);
  const empPageStart = filtered.length === 0 ? 0 : (empSafePage - 1) * pageSize + 1;
  const empPageEnd = Math.min(empSafePage * pageSize, filtered.length);
  const pagedEmployees = filtered.slice((empSafePage - 1) * pageSize, empSafePage * pageSize);

  useEffect(() => {
    if (page > empTotalPages) setPage(empTotalPages);
  }, [page, empTotalPages]);

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.first_name.trim() || !form.last_name.trim() || !form.email.trim() || !canManage) return;
    setSubmitting(true);
    const { data, error } = await supabase.from("employees").insert({
      first_name: form.first_name.trim(),
      last_name: form.last_name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      role: form.role.trim() || null,
      department: form.department || null,
      branch_id: form.branch_id || null,
      status: form.status,
      join_date: form.join_date,
      reports_to: form.reports_to || null,
    }).select().single();
    setSubmitting(false);
    if (error) {
      toast(
        "Error",
        error.code === "23505" ? "An employee with that email already exists." : "Failed to add employee",
        "error"
      );
      return;
    }
    toast("Employee added", `${form.first_name} ${form.last_name} added to the directory`, "success");
    logActivity({
      module: "employees",
      action: "created",
      entityType: "employee",
      entityId: data.id,
      actorName,
      actorRole: role?.name || "Unknown",
      description: `${form.first_name} ${form.last_name} added to the employee directory`,
    });
    notify({ source: "employees", type: "info", title: "New employee added", message: `${form.first_name} ${form.last_name} (${form.role || "no title"}) joined ${form.department || "the company"}.`, entityId: data.id });

    // Pre-provision user_role_assignments by email (so they can be invited)
    await supabase.from("user_role_assignments").upsert({
      email: form.email.trim(),
      display_name: `${form.first_name.trim()} ${form.last_name.trim()}`,
      role_id: roles.find((r) => r.name === form.role.trim())?.id || null,
    }, { onConflict: "email" });

    setForm(emptyForm);
    setShowAddModal(false);
    loadEmployees();
  };

  const inviteUser = async (e: any) => {
    if (!canManage) return;
    setInvitingId(e.id);
    try {
      const { error } = await supabase.functions.invoke("invite-user", {
        body: {
          email: e.email,
          display_name: `${e.first_name} ${e.last_name}`,
          role_id: roles.find((r) => r.name === e.role)?.id || null,
          redirect_to: `${import.meta.env.VITE_APP_URL.replace(/\/$/, "")}/reset-password`,
        },
      });
      if (error) throw error;
      toast("Invitation sent", `An invite link was sent to ${e.email}`, "success");
      setAccountStatus((prev) => ({ ...prev, [e.email]: { invited: true, hasAccount: false } }));
    } catch (err: any) {
      toast("Invite failed", err.message || "Could not send invitation", "error");
    } finally {
      setInvitingId(null);
    }
  };

  const deleteEmployee = async (employee: any) => {
    if (!canManage) return;
    const name = `${employee.first_name} ${employee.last_name}`;
    if (!confirm(`Move "${name}" to the Recycle Bin? The employee can be restored later.`)) return;

    setDeletingId(employee.id);
    const { error } = await supabase
      .from("employees")
      .update({ deleted_at: new Date().toISOString(), deleted_by: actorName })
      .eq("id", employee.id);
    setDeletingId(null);

    if (error) {
      toast("Error", "Failed to move employee to the Recycle Bin", "error");
      return;
    }

    toast("Employee moved to Recycle Bin", `${name} can be restored from the Recycle Bin.`, "success");
    logActivity({ module: "employees", action: "deleted", entityType: "employee", entityId: employee.id, actorName, actorRole: role?.name || "Unknown", description: `${name} moved to the Recycle Bin` });
    loadEmployees();
  };

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Employee Directory</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage and search all employees across {branchCount} branch{branchCount === 1 ? "" : "es"}</p>
        </div>
        <div className="flex items-center gap-2">
          {canManage && (
            <button
              onClick={() => { setForm(emptyForm); setShowAddModal(true); }}
              className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-user-add-line" />
              Add Employee
            </button>
          )}
          <Link to="/hire" className="inline-flex items-center gap-2 border border-gray-200 text-gray-700 px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-gray-50 transition-colors whitespace-nowrap">
            <i className="ri-user-search-line" />
            Hire New
          </Link>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, role..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#253C7D] focus:ring-1 focus:ring-[#253C7D]/20"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#253C7D]"
        >
          <option value="">All Departments</option>
          {depts.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      </div>

      <div className="border border-gray-100 rounded-xl overflow-hidden">
        <div className={`hidden md:grid ${canManage ? "grid-cols-8" : "grid-cols-7"} bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider`}>
          <span>Employee</span>
          <span>Role</span>
          <span>Department</span>
          <span>Branch</span>
          <span>Status</span>
          <span>Account</span>
          <span>Join Date</span>
          {canManage && <span className="text-right">Actions</span>}
        </div>
        {pagedEmployees.map((e) => {
          const acc = accountStatus[e.email];
          const isInvited = acc?.invited;
          const hasAccount = acc?.hasAccount;
          return (
          <Link
            key={e.id}
            to={`/employees/${e.id}`}
            className={`grid grid-cols-1 ${canManage ? "md:grid-cols-8" : "md:grid-cols-7"} px-5 py-4 border-t border-gray-50 items-center hover:bg-[#253C7D]/5 transition-colors cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#253C7D]/10 flex items-center justify-center text-[#253C7D] text-sm font-bold">
                {e.first_name?.[0]}{e.last_name?.[0]}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-gray-900">{e.first_name} {e.last_name}</p>
                <p className="text-[11px] text-gray-500">{e.email}</p>
              </div>
            </div>
            <span className="text-[13px] text-gray-700 mt-2 md:mt-0">{e.role}</span>
            <span className="text-[13px] text-gray-600 mt-1 md:mt-0">{e.department}</span>
            <span className="text-[13px] text-gray-600 mt-1 md:mt-0">{e.branches?.name || "Headquarters"}</span>
            <span className="mt-1 md:mt-0">
              <span className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full ${
                e.status === "active" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${e.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                {e.status}
              </span>
            </span>
            <span className="mt-1 md:mt-0">
              {hasAccount ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-emerald-50 text-emerald-700">
                  <i className="ri-checkbox-circle-line" />
                  Active
                </span>
              ) : isInvited ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-blue-50 text-blue-700">
                  <i className="ri-mail-send-line" />
                  Invited
                </span>
              ) : canManage ? (
                <button
                  onClick={(ev) => { ev.preventDefault(); inviteUser(e); }}
                  disabled={invitingId === e.id}
                  className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-600 hover:bg-[#253C7D] hover:text-white transition-colors cursor-pointer disabled:opacity-60"
                >
                  <i className="ri-mail-line" />
                  {invitingId === e.id ? "Sending..." : "Invite"}
                </button>
              ) : (
                <span className="text-[11px] text-gray-400">No account</span>
              )}
            </span>
            <span className="text-[13px] text-gray-500 mt-1 md:mt-0">{e.join_date || "N/A"}</span>
            {canManage && (
              <span className="mt-2 md:mt-0 text-left md:text-right">
                <button
                  type="button"
                  onClick={(ev) => { ev.preventDefault(); deleteEmployee(e); }}
                  disabled={deletingId === e.id}
                  aria-label={`Delete ${e.first_name} ${e.last_name}`}
                  className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium text-red-600 hover:bg-red-50 disabled:opacity-60"
                >
                  <i className="ri-delete-bin-line" />
                  {deletingId === e.id ? "Removing..." : "Delete"}
                </button>
              </span>
            )}
          </Link>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <i className="ri-team-line text-4xl mb-2 block" />
            <p className="text-[13px]">No employees found</p>
          </div>
        )}
      </div>

      {filtered.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-5 py-3 mt-4 bg-white border border-gray-100 rounded-xl">
          <div className="flex items-center gap-3 flex-wrap">
            <p className="text-[11px] text-gray-500">
              Showing <span className="font-semibold text-gray-700">{empPageStart}</span>–<span className="font-semibold text-gray-700">{empPageEnd}</span> of <span className="font-semibold text-gray-700">{filtered.length}</span> employees
            </p>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] text-gray-400">Per page</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                className="px-2 py-1 border border-gray-200 rounded-lg text-[11px] bg-white text-gray-700 focus:outline-none focus:border-[#253C7D] cursor-pointer"
              >
                {[10, 20, 50].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={empSafePage === 1}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <i className="ri-arrow-left-s-line" />
            </button>
            {pageWindow(empSafePage, empTotalPages).map((p, i) =>
              p === "..." ? (
                <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[11px] text-gray-400">…</span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg text-[12px] font-semibold transition-colors cursor-pointer ${p === empSafePage ? "bg-[#253C7D] text-white" : "text-gray-600 hover:bg-gray-100"}`}
                >
                  {p}
                </button>
              )
            )}
            <button
              onClick={() => setPage((p) => Math.min(empTotalPages, p + 1))}
              disabled={empSafePage === empTotalPages}
              className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
            >
              <i className="ri-arrow-right-s-line" />
            </button>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-start sm:items-center justify-center overflow-y-auto p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">Add Employee</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Add staff who already work here directly into the directory</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer">
                <i className="ri-close-line text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddEmployee} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">First Name *</label>
                  <input type="text" required value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Last Name *</label>
                  <input type="text" required value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Email *</label>
                  <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Phone</label>
                  <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Job Title / Role</label>
                  <input type="text" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} placeholder="e.g., Software Engineer" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Department</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer">
                    {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Branch</label>
                  <select value={form.branch_id} onChange={(e) => setForm({ ...form, branch_id: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer">
                    <option value="">Headquarters / Unassigned</option>
                    {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Reports To</label>
                  <select value={form.reports_to} onChange={(e) => setForm({ ...form, reports_to: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer">
                    <option value="">No manager</option>
                    {managers.map((manager) => <option key={manager.id} value={manager.id}>{manager.first_name} {manager.last_name} — {manager.department || "No department"}</option>)}
                  </select>
                  {managers.length === 0 && (
                    <p className="mt-1 text-[11px] text-gray-400">No managers are available in the directory.</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Status</label>
                  <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D] bg-white cursor-pointer">
                    <option value="onboarding">Onboarding</option>
                    <option value="active">Active</option>
                    <option value="on_leave">On Leave</option>
                    <option value="suspended">Suspended</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Join Date</label>
                  <input type="date" value={form.join_date} onChange={(e) => setForm({ ...form, join_date: e.target.value })} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#253C7D]" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 py-2.5 bg-[#253C7D] text-white text-[13px] font-semibold rounded-lg hover:bg-[#1F336A] transition-colors disabled:opacity-60 cursor-pointer">
                  {submitting ? "Adding..." : "Add Employee"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
