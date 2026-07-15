import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface Branch {
  id: string;
  name: string;
  location: string;
  manager_name: string;
  employee_count: number;
  status: string;
  created_at: string;
}

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  status: string;
  email?: string;
}

const statusColors: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-700",
  inactive: "bg-gray-100 text-gray-500",
  pending: "bg-amber-50 text-amber-700",
};

const deptColors = [
  "bg-[#0D7377]/10 text-[#0D7377]",
  "bg-violet-50 text-violet-700",
  "bg-amber-50 text-amber-700",
  "bg-rose-50 text-rose-700",
  "bg-sky-50 text-sky-700",
  "bg-emerald-50 text-emerald-700",
];

export default function Branches() {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [branchEmployees, setBranchEmployees] = useState<Employee[]>([]);
  const [empLoading, setEmpLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "",
    location: "",
    manager_name: "",
    status: "active",
  });

  const loadBranches = async () => {
    const { data } = await supabase.from("branches").select("*").order("employee_count", { ascending: false });
    setBranches(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadBranches();
    const channel = supabase.channel("branches-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "branches" }, () => loadBranches())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const openDetail = async (branch: Branch) => {
    setSelectedBranch(branch);
    setEmpLoading(true);
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, status, email")
      .eq("branch_id", branch.id)
      .order("department");
    setBranchEmployees(data || []);
    setEmpLoading(false);
  };

  const handleAddBranch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.location || !form.manager_name) return;
    setSubmitting(true);
    await supabase.from("branches").insert({
      name: form.name,
      location: form.location,
      manager_name: form.manager_name,
      status: form.status,
      employee_count: 0,
    });
    setForm({ name: "", location: "", manager_name: "", status: "active" });
    setShowAddModal(false);
    setSubmitting(false);
    loadBranches();
  };

  const filtered = branches.filter((b) => {
    const matchSearch = b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.manager_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = filterStatus === "all" || b.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const totalEmployees = branches.reduce((s, b) => s + (b.employee_count || 0), 0);
  const activeBranches = branches.filter((b) => b.status === "active").length;

  const deptGroups = branchEmployees.reduce((acc: Record<string, Employee[]>, emp) => {
    const d = emp.department || "Other";
    if (!acc[d]) acc[d] = [];
    acc[d].push(emp);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA] flex">
      {/* Main */}
      <div className={`flex-1 transition-all duration-300 ${selectedBranch ? "mr-[420px]" : ""}`}>
        <div className="p-6 lg:p-10">
          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                Branch Management
              </h1>
              <p className="text-[13px] text-gray-500 mt-1">
                {activeBranches} active branches &middot; {totalEmployees.toLocaleString()} total employees
              </p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap cursor-pointer"
            >
              <i className="ri-add-line" />
              Add Branch
            </button>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {[
              { label: "Total Branches", value: branches.length, icon: "ri-building-2-line", color: "text-[#0D7377]" },
              { label: "Active", value: activeBranches, icon: "ri-checkbox-circle-line", color: "text-emerald-600" },
              { label: "Total Employees", value: totalEmployees.toLocaleString(), icon: "ri-user-3-line", color: "text-violet-600" },
              { label: "Avg per Branch", value: Math.round(totalEmployees / Math.max(branches.length, 1)), icon: "ri-group-line", color: "text-amber-600" },
            ].map((s) => (
              <div key={s.label} className="bg-white border border-gray-100 rounded-xl p-4">
                <i className={`${s.icon} ${s.color} text-xl`} />
                <p className="text-xl font-bold text-gray-900 mt-2">{s.value}</p>
                <p className="text-[11px] text-gray-500 mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search branch, location, manager..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] bg-white"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] bg-white cursor-pointer"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          {/* Branch Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filtered.map((b) => (
              <div
                key={b.id}
                className={`bg-white border rounded-xl p-5 transition-all cursor-pointer hover:border-[#0D7377]/30 ${
                  selectedBranch?.id === b.id ? "border-[#0D7377] ring-2 ring-[#0D7377]/10" : "border-gray-100"
                }`}
                onClick={() => openDetail(b)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#0D7377]/10 flex items-center justify-center">
                      <i className="ri-building-2-line text-[#0D7377] text-lg" />
                    </div>
                    <div>
                      <p className="text-[14px] font-semibold text-gray-900 leading-tight">{b.name}</p>
                      <p className="text-[11px] text-gray-400 mt-0.5 flex items-center gap-1">
                        <i className="ri-map-pin-line" />
                        {b.location}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[b.status] || "bg-gray-50 text-gray-500"}`}>
                    {b.status}
                  </span>
                </div>

                <div className="border-t border-gray-50 pt-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                      <i className="ri-user-star-line" /> Manager
                    </span>
                    <span className="text-[12px] font-medium text-gray-700">{b.manager_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                      <i className="ri-team-line" /> Employees
                    </span>
                    <span className="text-[13px] font-bold text-[#0D7377]">{b.employee_count}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] text-gray-500 flex items-center gap-1.5">
                      <i className="ri-calendar-line" /> Since
                    </span>
                    <span className="text-[12px] text-gray-600">
                      {new Date(b.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                    </span>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); openDetail(b); }}
                  className="mt-4 w-full py-2 border border-gray-200 text-gray-600 text-[12px] font-medium rounded-lg hover:bg-[#0D7377] hover:text-white hover:border-[#0D7377] transition-all cursor-pointer"
                >
                  View Details <i className="ri-arrow-right-line ml-1" />
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <div className="col-span-3 py-16 text-center">
                <i className="ri-building-2-line text-4xl text-gray-300" />
                <p className="text-gray-400 mt-2">No branches match your search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Detail Panel */}
      {selectedBranch && (
        <div className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-100 overflow-y-auto z-40 flex flex-col">
          {/* Panel Header */}
          <div className="bg-gradient-to-br from-[#0D7377] to-[#14919B] p-6 text-white">
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 capitalize`}>
                  {selectedBranch.status}
                </span>
                <h2 className="text-lg font-bold mt-2 leading-tight">{selectedBranch.name}</h2>
                <p className="text-white/70 text-[13px] mt-1 flex items-center gap-1.5">
                  <i className="ri-map-pin-line" />
                  {selectedBranch.location}
                </p>
              </div>
              <button
                onClick={() => { setSelectedBranch(null); setBranchEmployees([]); }}
                className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/20 hover:bg-white/30 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-white" />
              </button>
            </div>
            <div className="grid grid-cols-3 gap-3 mt-5">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{selectedBranch.employee_count}</p>
                <p className="text-[10px] text-white/70 mt-0.5">Employees</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-xl font-bold">{Object.keys(deptGroups).length}</p>
                <p className="text-[10px] text-white/70 mt-0.5">Departments</p>
              </div>
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <p className="text-[13px] font-bold leading-tight">{new Date(selectedBranch.created_at).toLocaleDateString("en-US", { month: "short", year: "numeric" })}</p>
                <p className="text-[10px] text-white/70 mt-0.5">Est.</p>
              </div>
            </div>
          </div>

          {/* Branch Info */}
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Branch Info</h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-[#0D7377]/10">
                  <i className="ri-user-star-line text-[#0D7377] text-sm" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Branch Manager</p>
                  <p className="text-[13px] font-semibold text-gray-800">{selectedBranch.manager_name}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-amber-50">
                  <i className="ri-map-pin-2-line text-amber-600 text-sm" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Location</p>
                  <p className="text-[13px] font-semibold text-gray-800">{selectedBranch.location}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-violet-50">
                  <i className="ri-checkbox-circle-line text-violet-600 text-sm" />
                </div>
                <div>
                  <p className="text-[11px] text-gray-400">Status</p>
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColors[selectedBranch.status] || ""}`}>
                    {selectedBranch.status}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Department Breakdown */}
          {Object.keys(deptGroups).length > 0 && (
            <div className="p-5 border-b border-gray-100">
              <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Departments</h3>
              <div className="space-y-2">
                {Object.entries(deptGroups).map(([dept, emps], i) => (
                  <div key={dept} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${deptColors[i % deptColors.length]}`}>
                        {dept}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0D7377] rounded-full"
                          style={{ width: `${Math.min((emps.length / branchEmployees.length) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[12px] text-gray-600 font-medium w-6 text-right">{emps.length}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Employee List */}
          <div className="p-5 flex-1">
            <h3 className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider mb-3">
              Employees {branchEmployees.length > 0 && `(${branchEmployees.length})`}
            </h3>
            {empLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="w-6 h-6 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
              </div>
            ) : branchEmployees.length === 0 ? (
              <div className="text-center py-10">
                <i className="ri-user-3-line text-3xl text-gray-200" />
                <p className="text-[13px] text-gray-400 mt-2">No employees assigned to this branch</p>
              </div>
            ) : (
              <div className="space-y-2">
                {branchEmployees.map((emp) => (
                  <div key={emp.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] font-bold text-xs shrink-0">
                      {emp.first_name[0]}{emp.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-gray-900 truncate">{emp.first_name} {emp.last_name}</p>
                      <p className="text-[11px] text-gray-500 truncate">{emp.role} &middot; {emp.department}</p>
                    </div>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full capitalize ${
                      emp.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {emp.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div>
                <h2 className="text-[16px] font-bold text-gray-900">Add New Branch</h2>
                <p className="text-[12px] text-gray-500 mt-0.5">Create a new office or branch location</p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <i className="ri-close-line text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleAddBranch} className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Branch Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g., West Branch - Los Angeles"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Location / City *</label>
                <input
                  type="text"
                  required
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                  placeholder="e.g., Los Angeles, CA"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Branch Manager *</label>
                <input
                  type="text"
                  required
                  value={form.manager_name}
                  onChange={(e) => setForm({ ...form, manager_name: e.target.value })}
                  placeholder="e.g., John Smith"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-gray-700 mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#0D7377] cursor-pointer"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-lg hover:bg-[#0a5c60] transition-colors disabled:opacity-60 cursor-pointer"
                >
                  {submitting ? "Creating..." : "Create Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}