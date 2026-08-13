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
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const loadEmployees = () => {
    supabase.from("employees").select("*, branches(name)").order("first_name").then(({ data, error }) => {
      if (error) { toast("Error", "Failed to load employee directory", "error"); return; }
      setEmployees(data || []);
    });
  };

  useEffect(() => {
    loadEmployees();
    supabase.from("branches").select("id, name").order("name").then(({ data }) => setBranches(data || []));
  }, []);

  const depts = Array.from(new Set(employees.map((e) => e.department)));
  const branchCount = new Set(employees.map((e) => e.branch_id).filter(Boolean)).size;

  const filtered = employees.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !filterDept || e.department === filterDept;
    return matchesSearch && matchesDept;
  });

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
    setForm(emptyForm);
    setShowAddModal(false);
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
        <div className="hidden md:grid grid-cols-6 bg-gray-50 px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
          <span>Employee</span>
          <span>Role</span>
          <span>Department</span>
          <span>Branch</span>
          <span>Status</span>
          <span>Join Date</span>
        </div>
        {filtered.map((e) => (
          <Link
            key={e.id}
            to={`/employees/${e.id}`}
            className="grid grid-cols-1 md:grid-cols-6 px-5 py-4 border-t border-gray-50 items-center hover:bg-[#253C7D]/5 transition-colors cursor-pointer"
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
            <span className="text-[13px] text-gray-500 mt-1 md:mt-0">{e.join_date || "N/A"}</span>
          </Link>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <i className="ri-team-line text-4xl mb-2 block" />
            <p className="text-[13px]">No employees found</p>
          </div>
        )}
      </div>

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
                    {employees.map((emp) => <option key={emp.id} value={emp.id}>{emp.first_name} {emp.last_name}</option>)}
                  </select>
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
