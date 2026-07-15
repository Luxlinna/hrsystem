import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

export default function Employees() {
  const [employees, setEmployees] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");

  useEffect(() => {
    supabase.from("employees").select("*, branches(name)").then(({ data }) => setEmployees(data || []));
  }, []);

  const depts = Array.from(new Set(employees.map((e) => e.department)));

  const filtered = employees.filter((e) => {
    const matchesSearch = `${e.first_name} ${e.last_name} ${e.email} ${e.role}`.toLowerCase().includes(search.toLowerCase());
    const matchesDept = !filterDept || e.department === filterDept;
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-6 lg:p-10 min-h-screen bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1A1A1A]">Employee Directory</h1>
          <p className="text-[13px] text-gray-500 mt-1">Manage and search all employees across {employees.length > 0 ? "11" : "11"} branches</p>
        </div>
        <Link to="/hire" className="inline-flex items-center gap-2 bg-[#0D7377] text-white px-5 py-2.5 rounded-lg text-[13px] font-semibold hover:bg-[#0a5c60] transition-colors whitespace-nowrap">
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
            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 placeholder:text-gray-400 focus:outline-none focus:border-[#0D7377] focus:ring-1 focus:ring-[#0D7377]/20"
          />
        </div>
        <select
          value={filterDept}
          onChange={(e) => setFilterDept(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg text-[13px] text-gray-700 focus:outline-none focus:border-[#0D7377]"
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
            className="grid grid-cols-1 md:grid-cols-6 px-5 py-4 border-t border-gray-50 items-center hover:bg-[#0D7377]/5 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#0D7377]/10 flex items-center justify-center text-[#0D7377] text-sm font-bold">
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
      </div>
    </div>
  );
}