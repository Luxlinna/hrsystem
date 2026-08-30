import { memo, useState, useRef, useEffect, useMemo } from "react";
import type { DirectoryEmployee } from "../types";

interface EmployeeAutofillSelectProps {
  employees: DirectoryEmployee[];
  selectedEmployeeEmail: string;
  onSelectEmployee: (emp: DirectoryEmployee) => void;
  onClearSelection: () => void;
}

export const EmployeeAutofillSelect = memo(function EmployeeAutofillSelect({
  employees,
  selectedEmployeeEmail,
  onSelectEmployee,
  onClearSelection,
}: EmployeeAutofillSelectProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredEmployees = useMemo(() => {
    if (!searchQuery.trim()) return employees;
    const q = searchQuery.toLowerCase().trim();
    return employees.filter((emp) => {
      const name = `${emp.first_name || ""} ${emp.last_name || ""}`.toLowerCase();
      const email = (emp.email || "").toLowerCase();
      const role = (emp.role || "").toLowerCase();
      const dept = (emp.department || "").toLowerCase();
      const branch = (emp.branch_name || "").toLowerCase();
      return name.includes(q) || email.includes(q) || role.includes(q) || dept.includes(q) || branch.includes(q);
    });
  }, [employees, searchQuery]);

  const selectedEmployee = useMemo(() => {
    return employees.find((e) => e.email.toLowerCase() === selectedEmployeeEmail.toLowerCase()) || null;
  }, [employees, selectedEmployeeEmail]);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-semibold text-gray-700 mb-1.5 flex items-center justify-between">
        <span>Autofill Employee</span>
        <span className="text-[11px] font-normal text-gray-400">({employees.length} in directory)</span>
      </label>

      {selectedEmployee ? (
        <div className="flex items-center justify-between px-3.5 py-2.5 bg-white border border-[#253C7D]/30 rounded-xl text-xs shadow-2xs h-[42px]">
          <div className="min-w-0 pr-2">
            <p className="font-semibold text-gray-900 truncate text-xs">
              {selectedEmployee.first_name} {selectedEmployee.last_name}
            </p>
            <p className="text-[10px] text-[#253C7D] truncate font-medium">
              {selectedEmployee.branch_name || "Headquarters"}
            </p>
          </div>
          <button
            type="button"
            onClick={onClearSelection}
            className="w-6 h-6 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors cursor-pointer shrink-0"
            title="Clear selected employee"
          >
            <i className="ri-close-line text-sm" />
          </button>
        </div>
      ) : (
        <div className="relative">
          <i className="ri-search-line absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onFocus={() => setIsDropdownOpen(true)}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            placeholder="Search name, branch..."
            className="w-full pl-10 pr-9 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all h-[42px]"
          />
          <button
            type="button"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-0.5 cursor-pointer"
          >
            <i className={`${isDropdownOpen ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} text-sm`} />
          </button>
        </div>
      )}

      {isDropdownOpen && !selectedEmployee && (
        <div className="absolute left-0 top-full mt-1.5 w-[380px] max-w-[90vw] bg-white rounded-2xl shadow-2xl border border-gray-200/90 py-2 z-50 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="px-3.5 py-1.5 text-[11px] font-bold text-gray-400 uppercase tracking-wider border-b border-gray-100 mb-1 flex items-center justify-between">
            <span>Employee Directory</span>
            <span className="text-[10px] text-[#253C7D] font-semibold">{filteredEmployees.length} Found</span>
          </div>
          {filteredEmployees.length === 0 ? (
            <div className="px-4 py-6 text-center text-xs text-gray-400">
              <i className="ri-user-unfollow-line text-2xl text-gray-300 mb-1 block" />
              No matching employee found
            </div>
          ) : (
            filteredEmployees.map((emp) => (
              <button
                key={emp.email}
                type="button"
                onClick={() => {
                  onSelectEmployee(emp);
                  setIsDropdownOpen(false);
                  setSearchQuery("");
                }}
                className="w-full text-left px-3.5 py-2.5 hover:bg-[#253C7D]/5 flex items-center gap-3 transition-colors cursor-pointer border-b border-gray-50 last:border-none"
              >
                <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-bold shrink-0">
                  {`${emp.first_name?.[0] || ""}${emp.last_name?.[0] || ""}`.toUpperCase() || "E"}
                </div>
                <div className="flex-1 min-w-0 pr-1">
                  <p className="text-xs font-bold text-gray-900 truncate">
                    {emp.first_name} {emp.last_name}
                  </p>
                  <p className="text-[11px] text-gray-400 truncate">{emp.email}</p>
                </div>
                <div className="flex flex-col items-end shrink-0 gap-0.5">
                  <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#253C7D] border border-blue-100 whitespace-nowrap">
                    {emp.branch_name || "Headquarters"}
                  </span>
                  {emp.role && (
                    <span className="text-[9px] text-gray-400 truncate max-w-[100px]">
                      {emp.role}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
});
