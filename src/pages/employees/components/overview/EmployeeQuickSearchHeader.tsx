import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee } from "../../types";

interface EmployeeQuickSearchHeaderProps {
  currentEmployee: Employee;
  allEmployees: any[];
}

export const EmployeeQuickSearchHeader: React.FC<EmployeeQuickSearchHeaderProps> = ({
  currentEmployee,
  allEmployees,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return allEmployees
      .filter((e) => {
        const id = (e.biometric_user_id || "").toLowerCase();
        const name = `${e.first_name || ""} ${e.last_name || ""}`.toLowerCase();
        const dept = (e.department || "").toLowerCase();
        return id.includes(q) || name.includes(q) || dept.includes(q);
      })
      .slice(0, 8);
  }, [allEmployees, query]);

  const handleSelect = (empId: string) => {
    setIsOpen(false);
    setQuery("");
    navigate(`/employees/${empId}`);
  };

  const staffId = currentEmployee.biometric_user_id || "—";
  const fullName = `${currentEmployee.first_name || ""} ${currentEmployee.last_name || ""}`.trim();

  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4" ref={wrapperRef}>
      <div className="flex items-center gap-3">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Active Staff Record:</span>
        <div className="inline-flex items-center gap-2 bg-white px-3 py-1 rounded-full border border-gray-200 shadow-2xs text-xs">
          <span className="font-bold text-[#253C7D] bg-indigo-50 px-1.5 py-0.5 rounded font-mono">
            ID: {staffId}
          </span>
          <span className="font-medium text-gray-800">{fullName}</span>
          <span className="text-gray-400">&middot;</span>
          <span className="text-gray-500">{currentEmployee.department || "General"}</span>
        </div>
      </div>

      <div className="relative w-full md:w-80">
        <div className="relative">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => query.trim() && setIsOpen(true)}
            placeholder="Search staff by Name or ID..."
            className="w-full pl-9 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all shadow-2xs"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <i className="ri-close-line text-sm" />
            </button>
          )}
        </div>

        {isOpen && results.length > 0 && (
          <div className="absolute right-0 top-full mt-1.5 w-full bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden py-1">
            <div className="px-3 py-1.5 text-[10px] font-bold uppercase text-gray-400 border-b border-gray-100">
              Matching Staff ({results.length})
            </div>
            {results.map((emp) => (
              <button
                key={emp.id}
                type="button"
                onClick={() => handleSelect(emp.id)}
                className="w-full text-left px-3 py-2 flex items-center justify-between hover:bg-indigo-50/60 transition-colors text-xs cursor-pointer border-b border-gray-50 last:border-0"
              >
                <div>
                  <div className="font-semibold text-gray-800">
                    {emp.first_name} {emp.last_name}
                  </div>
                  <div className="text-[11px] text-gray-500">
                    {emp.role || "Staff"} &middot; {emp.department || "No Department"}
                  </div>
                </div>
                <div className="font-mono text-[11px] font-bold text-[#253C7D] bg-indigo-50 px-2 py-0.5 rounded">
                  ID: {emp.biometric_user_id || "—"}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
