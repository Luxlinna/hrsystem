import { memo, useRef, useEffect, useState } from "react";
import type { Employee } from "../types";
import { initials } from "../constants";

interface BatchEnrollEmployeePickerProps {
  employees: Employee[];
  enrollEmployeeIds: string[];
  setEnrollEmployeeIds: React.Dispatch<React.SetStateAction<string[]>>;
}

export const BatchEnrollEmployeePicker = memo(function BatchEnrollEmployeePicker({
  employees,
  enrollEmployeeIds,
  setEnrollEmployeeIds,
}: BatchEnrollEmployeePickerProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  const filteredEmployees = employees.filter((emp) => {
    const q = search.trim().toLowerCase();
    if (!q) return true;
    return `${emp.first_name} ${emp.last_name} ${emp.role || ""} ${emp.department || ""}`.toLowerCase().includes(q);
  });

  const allSelected = enrollEmployeeIds.length === employees.length;

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">
        Select Employees{" "}
        {enrollEmployeeIds.length > 0 && (
          <span className="normal-case font-bold text-[#253C7D] ml-1">
            ({enrollEmployeeIds.length} chosen)
          </span>
        )}{" "}
        <span className="text-rose-500">*</span>
      </label>

      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-4 py-3.5 border-2 rounded-2xl text-sm text-left flex items-center justify-between cursor-pointer transition-all ${
          open
            ? "border-[#253C7D] bg-white shadow-sm"
            : "border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <i className={`ri-team-line text-base ${open ? "text-[#253C7D]" : "text-gray-400"}`} />
          {enrollEmployeeIds.length > 0 ? (
            <span className="font-bold text-gray-900">
              {enrollEmployeeIds.length} Staff Member{enrollEmployeeIds.length > 1 ? "s" : ""} Selected
            </span>
          ) : (
            <span className="text-gray-400 font-normal">Choose employees to enroll…</span>
          )}
        </div>
        <i className={`ri-arrow-down-s-line text-gray-400 text-lg transition-transform duration-200 ${open ? "rotate-180 text-[#253C7D]" : ""}`} />
      </button>

      {/* Selected avatars preview */}
      {enrollEmployeeIds.length > 0 && !open && (
        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
          {employees
            .filter((e) => enrollEmployeeIds.includes(e.id))
            .slice(0, 8)
            .map((emp) => (
              <div
                key={emp.id}
                title={`${emp.first_name} ${emp.last_name}`}
                className="w-7 h-7 rounded-lg bg-[#253C7D]/10 border-2 border-white shadow-xs overflow-hidden flex items-center justify-center text-[10px] font-bold text-[#253C7D] flex-shrink-0"
              >
                {emp.avatar_url ? (
                  <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span>{initials(emp.first_name, emp.last_name)}</span>
                )}
              </div>
            ))}
          {enrollEmployeeIds.length > 8 && (
            <span className="text-xs text-gray-500 font-semibold">+{enrollEmployeeIds.length - 8} more</span>
          )}
        </div>
      )}

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Search bar */}
          <div className="p-3 border-b border-gray-100">
            <div className="relative">
              <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, role, or department…"
                className="w-full pl-8 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#253C7D] focus:bg-white transition-all"
                autoFocus
              />
            </div>
          </div>

          {/* Bulk actions */}
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50/60 border-b border-gray-100">
            <button
              type="button"
              onClick={() =>
                allSelected
                  ? setEnrollEmployeeIds([])
                  : setEnrollEmployeeIds(employees.map((e) => e.id))
              }
              className="flex items-center gap-1.5 text-xs font-bold text-[#253C7D] hover:underline cursor-pointer"
            >
              <i className={allSelected ? "ri-checkbox-indeterminate-line" : "ri-checkbox-multiple-line"} />
              {allSelected ? "Deselect All" : `Select All (${employees.length})`}
            </button>
            {enrollEmployeeIds.length > 0 && (
              <button
                type="button"
                onClick={() => setEnrollEmployeeIds([])}
                className="text-xs font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
              >
                <i className="ri-close-circle-line" />
                Clear
              </button>
            )}
          </div>

          {/* Employee list */}
          <div className="max-h-60 overflow-y-auto p-2 space-y-1">
            {filteredEmployees.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">No staff found</div>
            ) : (
              filteredEmployees.map((emp) => {
                const isSelected = enrollEmployeeIds.includes(emp.id);
                return (
                  <div
                    key={emp.id}
                    onClick={() => {
                      setEnrollEmployeeIds((prev) =>
                        isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                      );
                    }}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      isSelected
                        ? "bg-[#253C7D]/8 border border-[#253C7D]/20"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 overflow-hidden"
                      style={{ background: isSelected ? "#253C7D" : "#e5e7eb", color: isSelected ? "white" : "#374151" }}>
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials(emp.first_name, emp.last_name)}</span>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${isSelected ? "text-[#253C7D]" : "text-gray-900"}`}>
                        {emp.first_name} {emp.last_name}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {emp.role || "—"}{emp.department ? ` · ${emp.department}` : ""}
                      </p>
                    </div>

                    {/* Checkbox */}
                    <div className={`w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0 border-2 transition-all ${
                      isSelected ? "bg-[#253C7D] border-[#253C7D]" : "border-gray-300"
                    }`}>
                      {isSelected && <i className="ri-check-line text-white text-xs" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-2.5 border-t border-gray-100 bg-gray-50/60 flex items-center justify-between">
            <p className="text-xs text-gray-400">
              {filteredEmployees.length} of {employees.length} staff shown
            </p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-xs font-bold text-[#253C7D] hover:underline cursor-pointer"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
});
