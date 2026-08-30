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
    return `${emp.first_name} ${emp.last_name} ${emp.role || ""}`.toLowerCase().includes(q);
  });

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
        Select Employees ({enrollEmployeeIds.length} chosen) <span className="text-rose-500">*</span>
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 text-left flex items-center justify-between cursor-pointer hover:bg-white focus:bg-white transition-all"
      >
        <span className={enrollEmployeeIds.length > 0 ? "text-gray-900 font-bold" : "text-gray-400 font-normal"}>
          {enrollEmployeeIds.length > 0 ? `${enrollEmployeeIds.length} Staff Member(s) Selected` : "Choose employees to enroll..."}
        </span>
        <i className={`ri-arrow-down-s-line text-gray-400 text-sm transition-transform ${open ? "rotate-180 text-[#253C7D]" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 space-y-2 max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter staff by name or role..."
            className="w-full px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
          />

          <div className="flex items-center justify-between px-1 text-[11px] font-bold text-gray-500">
            <button
              type="button"
              onClick={() => setEnrollEmployeeIds(employees.map((e) => e.id))}
              className="text-[#253C7D] hover:underline cursor-pointer"
            >
              Select All ({employees.length})
            </button>
            {enrollEmployeeIds.length > 0 && (
              <button
                type="button"
                onClick={() => setEnrollEmployeeIds([])}
                className="text-rose-600 hover:underline cursor-pointer"
              >
                Clear All
              </button>
            )}
          </div>

          <div className="space-y-1 max-h-36 overflow-y-auto">
            {filteredEmployees.map((emp) => {
              const isSelected = enrollEmployeeIds.includes(emp.id);
              return (
                <div
                  key={emp.id}
                  onClick={() => {
                    setEnrollEmployeeIds((prev) =>
                      isSelected ? prev.filter((id) => id !== emp.id) : [...prev, emp.id]
                    );
                  }}
                  className={`p-2 rounded-xl flex items-center justify-between cursor-pointer text-xs transition-colors ${
                    isSelected ? "bg-[#253C7D]/10 text-[#253C7D]" : "hover:bg-gray-50 text-gray-700"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-6 h-6 rounded-lg bg-gray-200 text-gray-700 flex items-center justify-center font-bold text-[10px] shrink-0 overflow-hidden">
                      {emp.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span>{initials(emp.first_name, emp.last_name)}</span>
                      )}
                    </div>
                    <span className="font-bold truncate">{emp.first_name} {emp.last_name}</span>
                  </div>
                  {isSelected && <i className="ri-checkbox-circle-fill text-[#253C7D] text-sm shrink-0" />}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
});
