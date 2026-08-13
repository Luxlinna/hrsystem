import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/Toast";

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const pageWindow = (current: number, total: number): (number | "...")[] => {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: (number | "...")[] = [1];
    if (current > 3) pages.push("...");
    for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) pages.push(i);
    if (current < total - 2) pages.push("...");
    pages.push(total);
    return pages;
  };

  useEffect(() => {
    supabase.from("employees").select("*, branches(name)").then(({ data, error }) => {
      if (error) { toast("Error", "Failed to load employee directory", "error"); return; }
      setEmployees(data || []);
    });
  }, []);

  const depts = Array.from(new Set(employees.map((e) => e.department)));
  const branchCount = new Set(employees.map((e) => e.branch_id).filter(Boolean)).size;

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

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Employee Directory</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage and search all employees across {branchCount} branch{branchCount === 1 ? "" : "es"}</p>
        </div>
        <Link to="/hire" className="inline-flex items-center gap-2 bg-[#253C7D] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#1F336A] transition-colors whitespace-nowrap">
          <i className="ri-user-add-line" />
          Add Employee
        </Link>
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
        {pagedEmployees.map((e) => (
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
          <div className="text-center py-12 text-gray-400 text-sm">No employees found.</div>
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
    </div>
  );
}