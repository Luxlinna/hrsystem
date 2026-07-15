import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";
import { Link } from "react-router-dom";

interface Employee {
  id: string;
  first_name: string;
  last_name: string;
  role: string;
  department: string;
  avatar_url: string | null;
  reports_to: string | null;
  status: string;
  branches?: { name: string } | null;
}

interface TreeNode extends Employee {
  children: TreeNode[];
  depth: number;
  expanded: boolean;
}

const deptColors: Record<string, string> = {
  Executive: "bg-[#0D7377]",
  Operations: "bg-emerald-600",
  Engineering: "bg-sky-600",
  Finance: "bg-amber-600",
  Marketing: "bg-rose-500",
  Sales: "bg-violet-600",
  HR: "bg-teal-600",
  IT: "bg-cyan-600",
  Legal: "bg-orange-500",
};

function buildTree(employees: Employee[], parentId: string | null = null, depth = 0): TreeNode[] {
  return employees
    .filter((e) => e.reports_to === parentId)
    .map((e) => ({ ...e, children: buildTree(employees, e.id, depth + 1), depth, expanded: depth < 1 }));
}

function OrgNode({ node, onToggle, searchTerm, onSelectEmployee }: {
  node: TreeNode;
  onToggle: (id: string) => void;
  searchTerm: string;
  onSelectEmployee: (emp: Employee) => void;
}) {
  const hasChildren = node.children.length > 0;
  const isMatch = searchTerm
    ? `${node.first_name} ${node.last_name} ${node.role} ${node.department}`.toLowerCase().includes(searchTerm.toLowerCase())
    : true;
  const deptColor = deptColors[node.department] || "bg-gray-500";

  const childMatches = (n: TreeNode): boolean =>
    `${n.first_name} ${n.last_name} ${n.role} ${n.department}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.children.some(childMatches);

  if (searchTerm && !isMatch && !node.children.some(childMatches)) return null;

  return (
    <div className="flex flex-col items-center">
      {node.depth > 0 && <div className="w-px h-6 bg-gray-200" />}
      <div
        className={`relative flex flex-col items-center p-4 rounded-xl border-2 transition-all cursor-pointer min-w-[180px] max-w-[220px] ${
          isMatch && searchTerm ? "border-[#0D7377] bg-[#0D7377]/5 scale-105" : "border-gray-200 bg-white hover:border-gray-300"
        }`}
        onClick={() => { onSelectEmployee(node); if (hasChildren) onToggle(node.id); }}
      >
        <div className={`absolute top-0 left-0 right-0 h-1 ${deptColor} rounded-t-xl`} />
        <Link to={`/employees/${node.id}`} className="flex flex-col items-center w-full" onClick={(e) => e.stopPropagation()}>
          {node.avatar_url ? (
            <img src={node.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-white mt-1 mb-2" />
          ) : (
            <div className={`w-12 h-12 rounded-full ${deptColor} flex items-center justify-center text-white font-bold text-sm mt-1 mb-2`}>
              {node.first_name?.[0]}{node.last_name?.[0]}
            </div>
          )}
          <p className="text-[13px] font-bold text-gray-900 text-center leading-tight hover:text-[#0D7377] transition-colors">
            {node.first_name} {node.last_name}
          </p>
        </Link>
        <p className="text-[11px] text-gray-500 text-center mt-0.5">{node.role}</p>
        <span className={`mt-2 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white ${deptColor}`}>{node.department}</span>
        {node.branches?.name && <p className="text-[10px] text-gray-400 mt-1">{node.branches.name}</p>}
        <div className="flex items-center gap-1 mt-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${node.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
          <span className="text-[10px] text-gray-400 capitalize">{node.status}</span>
        </div>
        {hasChildren && (
          <button
            onClick={(e) => { e.stopPropagation(); onToggle(node.id); }}
            className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <i className={`ri-arrow-down-s-line text-gray-500 text-sm transition-transform ${node.expanded ? "rotate-180" : ""}`} />
          </button>
        )}
      </div>
      {node.expanded && hasChildren && (
        <div className="mt-6">
          <div className="w-px h-4 bg-gray-200 mx-auto" />
          {node.children.length > 1 && (
            <div className="relative flex gap-6">
              <div
                className="absolute top-0 left-1/2 h-px bg-gray-200"
                style={{ width: `${(node.children.length - 1) * 100}%`, transform: "translateX(-50%)" }}
              />
              {node.children.map((child) => (
                <OrgNode key={child.id} node={child} onToggle={onToggle} searchTerm={searchTerm} onSelectEmployee={onSelectEmployee} />
              ))}
            </div>
          )}
          {node.children.length === 1 && (
            <OrgNode node={node.children[0]} onToggle={onToggle} searchTerm={searchTerm} onSelectEmployee={onSelectEmployee} />
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [deptFilter, setDeptFilter] = useState("");
  const [viewMode, setViewMode] = useState<"tree" | "list">("tree");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [editManagerModal, setEditManagerModal] = useState(false);
  const [newManagerId, setNewManagerId] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadEmployees(); }, []);

  useEffect(() => {
    const filtered = deptFilter ? employees.filter((e) => e.department === deptFilter) : employees;
    const t = buildTree(filtered);
    const applyExpanded = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((n) => ({ ...n, expanded: expandedIds.has(n.id) || (n.depth < 1 && !expandedIds.has(`collapsed_${n.id}`)), children: applyExpanded(n.children) }));
    setTree(applyExpanded(t));
  }, [employees, expandedIds, deptFilter]);

  const loadEmployees = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("employees")
      .select("id, first_name, last_name, role, department, avatar_url, reports_to, status, branches(name)")
      .order("department")
      .order("first_name");
    const list = (data || []) as Employee[];
    setEmployees(list);
    const topLevel = list.filter((e) => !e.reports_to);
    setExpandedIds(new Set(topLevel.map((e) => e.id)));
    setLoading(false);
  };

  const toggleNode = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) { next.delete(id); next.add(`collapsed_${id}`); }
      else { next.add(id); next.delete(`collapsed_${id}`); }
      return next;
    });
  }, []);

  const expandAll = () => setExpandedIds(new Set(employees.map((e) => e.id)));
  const collapseAll = () => {
    const topLevel = employees.filter((e) => !e.reports_to);
    setExpandedIds(new Set(topLevel.map((e) => e.id)));
  };

  const handleUpdateManager = async () => {
    if (!selectedEmployee) return;
    setSaving(true);
    const managerId = newManagerId === "none" ? null : newManagerId || null;
    const { error } = await supabase.from("employees").update({ reports_to: managerId }).eq("id", selectedEmployee.id);
    setSaving(false);
    if (error) { toast.error("Failed to update reporting manager"); return; }
    toast.success("Reporting relationship updated");
    setEditManagerModal(false);
    setSelectedEmployee(null);
    setNewManagerId("");
    loadEmployees();
  };

  const departments = Array.from(new Set(employees.map((e) => e.department))).sort();
  const getDirectReports = (id: string) => employees.filter((e) => e.reports_to === id);
  const getManager = (managerId: string | null) => employees.find((e) => e.id === managerId);

  const listEmployees = deptFilter
    ? employees.filter((e) => e.department === deptFilter)
    : employees;

  const filteredList = searchTerm
    ? listEmployees.filter((e) => `${e.first_name} ${e.last_name} ${e.role} ${e.department}`.toLowerCase().includes(searchTerm.toLowerCase()))
    : listEmployees;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-10 h-10 border-2 border-[#0D7377] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Organization Chart</h1>
          <p className="text-[13px] text-gray-500 mt-1">{employees.length} employees · {departments.length} departments</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setViewMode("tree")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap ${viewMode === "tree" ? "bg-white text-[#0D7377]" : "text-gray-500"}`}
            >
              <i className="ri-node-tree mr-1" />Tree
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold transition-colors whitespace-nowrap ${viewMode === "list" ? "bg-white text-[#0D7377]" : "text-gray-500"}`}
            >
              <i className="ri-list-check mr-1" />List
            </button>
          </div>
          {viewMode === "tree" && (
            <>
              <button onClick={expandAll} className="px-3 py-2 text-[12px] font-semibold text-[#0D7377] border border-[#0D7377]/20 rounded-lg hover:bg-[#0D7377]/5 transition-colors whitespace-nowrap">Expand All</button>
              <button onClick={collapseAll} className="px-3 py-2 text-[12px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap">Collapse</button>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search by name, role, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0D7377]"
          />
        </div>
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[13px] text-gray-700 focus:outline-none focus:border-[#0D7377]"
        >
          <option value="">All Departments</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      {viewMode === "tree" && (
        <>
          <div className="flex flex-wrap gap-2 mb-6">
            {departments.map((d) => (
              <div key={d} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded-full ${deptColors[d] || "bg-gray-400"}`} />
                <span className="text-[11px] text-gray-500">{d}</span>
              </div>
            ))}
          </div>
          <div className="overflow-x-auto pb-8">
            <div className="min-w-max mx-auto flex justify-center">
              <div className="flex gap-10">
                {tree.map((node) => (
                  <OrgNode key={node.id} node={node} onToggle={toggleNode} searchTerm={searchTerm} onSelectEmployee={setSelectedEmployee} />
                ))}
              </div>
            </div>
          </div>
          {tree.length === 0 && (
            <div className="text-center py-16">
              <i className="ri-team-line text-4xl text-gray-300 mb-3 block" />
              <p className="text-[14px] text-gray-400">No employees found. Add employees to build the org chart.</p>
            </div>
          )}
        </>
      )}

      {viewMode === "list" && (
        <div className="border border-gray-100 rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Employee</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Department</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Reports To</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Direct Reports</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredList.map((emp) => {
                const manager = getManager(emp.reports_to);
                const reports = getDirectReports(emp.id);
                return (
                  <tr key={emp.id} className="border-t border-gray-50 hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        {emp.avatar_url ? (
                          <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full ${deptColors[emp.department] || "bg-gray-400"} flex items-center justify-center text-white text-xs font-bold flex-shrink-0`}>
                            {emp.first_name?.[0]}{emp.last_name?.[0]}
                          </div>
                        )}
                        <div>
                          <Link to={`/employees/${emp.id}`} className="text-[13px] font-semibold text-gray-900 hover:text-[#0D7377] transition-colors">
                            {emp.first_name} {emp.last_name}
                          </Link>
                          <p className="text-[11px] text-gray-500">{emp.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-[10px] font-semibold px-2 py-1 rounded-full text-white ${deptColors[emp.department] || "bg-gray-400"}`}>{emp.department}</span>
                    </td>
                    <td className="px-5 py-3 text-[13px] text-gray-600">
                      {manager ? (
                        <Link to={`/employees/${manager.id}`} className="hover:text-[#0D7377] transition-colors">
                          {manager.first_name} {manager.last_name}
                        </Link>
                      ) : <span className="text-gray-400">— Top level</span>}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-gray-600">
                      {reports.length > 0 ? (
                        <span className="text-[#0D7377] font-semibold">{reports.length} person{reports.length > 1 ? "s" : ""}</span>
                      ) : <span className="text-gray-400">None</span>}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${emp.status === "active" ? "bg-green-500" : "bg-amber-500"}`} />
                        <span className="text-[12px] text-gray-600 capitalize">{emp.status}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <button
                        onClick={() => { setSelectedEmployee(emp); setNewManagerId(emp.reports_to || "none"); setEditManagerModal(true); }}
                        className="px-2.5 py-1.5 text-[11px] font-semibold text-[#0D7377] border border-[#0D7377]/20 rounded-lg hover:bg-[#0D7377]/5 transition-colors whitespace-nowrap cursor-pointer"
                      >
                        Edit Manager
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedEmployee && !editManagerModal && (
        <div className="fixed bottom-6 right-6 bg-white rounded-2xl border border-gray-200 p-5 w-72 z-40">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              {selectedEmployee.avatar_url ? (
                <img src={selectedEmployee.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
              ) : (
                <div className={`w-10 h-10 rounded-full ${deptColors[selectedEmployee.department] || "bg-gray-400"} flex items-center justify-center text-white font-bold`}>
                  {selectedEmployee.first_name?.[0]}{selectedEmployee.last_name?.[0]}
                </div>
              )}
              <div>
                <p className="text-[13px] font-bold text-gray-900">{selectedEmployee.first_name} {selectedEmployee.last_name}</p>
                <p className="text-[11px] text-gray-500">{selectedEmployee.role}</p>
              </div>
            </div>
            <button onClick={() => setSelectedEmployee(null)} className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer">
              <i className="ri-close-line text-gray-400 text-sm" />
            </button>
          </div>
          <div className="space-y-2 mb-4">
            <div className="flex justify-between">
              <span className="text-[11px] text-gray-400">Department</span>
              <span className="text-[11px] font-semibold text-gray-700">{selectedEmployee.department}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-gray-400">Direct Reports</span>
              <span className="text-[11px] font-semibold text-[#0D7377]">{getDirectReports(selectedEmployee.id).length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[11px] text-gray-400">Reports To</span>
              <span className="text-[11px] font-semibold text-gray-700">
                {(() => { const m = getManager(selectedEmployee.reports_to); return m ? `${m.first_name} ${m.last_name}` : "No manager"; })()}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            <Link to={`/employees/${selectedEmployee.id}`} className="flex-1 py-2 text-center text-[11px] font-semibold text-[#0D7377] border border-[#0D7377]/20 rounded-lg hover:bg-[#0D7377]/5 transition-colors whitespace-nowrap">
              View Profile
            </Link>
            <button
              onClick={() => { setNewManagerId(selectedEmployee.reports_to || "none"); setEditManagerModal(true); }}
              className="flex-1 py-2 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap cursor-pointer"
            >
              Edit Manager
            </button>
          </div>
        </div>
      )}

      {editManagerModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20" onClick={() => setEditManagerModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-[15px] font-bold text-gray-900 mb-1">Edit Reporting Relationship</h3>
            <p className="text-[12px] text-gray-500 mb-5">
              Set who <span className="font-semibold text-gray-700">{selectedEmployee.first_name} {selectedEmployee.last_name}</span> reports to
            </p>
            <div className="mb-5">
              <label className="text-[12px] font-semibold text-gray-600 mb-1.5 block">Reports To</label>
              <select
                value={newManagerId}
                onChange={(e) => setNewManagerId(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] text-gray-900 focus:outline-none focus:border-[#0D7377]"
              >
                <option value="none">— No manager (Top level)</option>
                {employees.filter((e) => e.id !== selectedEmployee.id).map((e) => (
                  <option key={e.id} value={e.id}>{e.first_name} {e.last_name} — {e.role}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setEditManagerModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-[13px] font-semibold rounded-xl hover:bg-gray-50 transition-colors whitespace-nowrap">
                Cancel
              </button>
              <button
                onClick={handleUpdateManager}
                disabled={saving}
                className="flex-1 py-2.5 bg-[#0D7377] text-white text-[13px] font-semibold rounded-xl hover:bg-[#0a5c60] transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}