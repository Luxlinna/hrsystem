import { memo, useState, useRef, useEffect } from "react";
import type { ExitEmployee, ExitFormState } from "../../types";

interface ExitEmployeeSectionProps {
  form: ExitFormState;
  onChange: (field: keyof ExitFormState, value: any) => void;
  results: ExitEmployee[];
  searching: boolean;
  onSearch: (q: string) => void;
  editing: boolean;
  currentEmployeeName?: string;
}

export const ExitEmployeeSection = memo(function ExitEmployeeSection({
  form,
  onChange,
  results,
  searching,
  onSearch,
  editing,
  currentEmployeeName,
}: ExitEmployeeSectionProps) {
  const [empQuery, setEmpQuery] = useState(currentEmployeeName || "");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<ExitEmployee | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (currentEmployeeName) {
      setEmpQuery(currentEmployeeName);
    }
  }, [currentEmployeeName]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (emp: ExitEmployee) => {
    setSelectedEmp(emp);
    const fullName = `${emp.first_name} ${emp.last_name}`.trim();
    setEmpQuery(fullName);
    onChange("employee_id", emp.id);
    if (emp.contract_type && !form.contract_type) {
      onChange("contract_type", emp.contract_type);
    }
    setShowSuggestions(false);
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-black tracking-wider text-sky-600 uppercase border-b border-slate-100 pb-1.5">
        Employee Info
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-4 items-start" ref={wrapperRef}>
        <label className="text-xs font-bold text-slate-700 md:pt-2.5">
          Employee Name <span className="text-rose-500">*</span>
        </label>

        <div className="md:col-span-3 relative">
          {editing ? (
            <input
              type="text"
              readOnly
              value={empQuery}
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-100 border border-slate-200 text-xs font-semibold text-slate-700 cursor-not-allowed"
            />
          ) : (
            <>
              <div className="relative cursor-pointer">
                <input
                  type="text"
                  required
                  value={empQuery}
                  placeholder="Search..."
                  onFocus={() => {
                    setShowSuggestions(true);
                    onSearch(empQuery);
                  }}
                  onClick={() => {
                    setShowSuggestions(true);
                    onSearch(empQuery);
                  }}
                  onChange={(e) => {
                    setEmpQuery(e.target.value);
                    onChange("employee_id", "");
                    setSelectedEmp(null);
                    setShowSuggestions(true);
                    onSearch(e.target.value);
                  }}
                  className="w-full px-3.5 py-2.5 rounded-lg bg-white border border-slate-300 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#253C7D]/20 focus:border-[#253C7D] transition-all pr-8 cursor-text"
                  autoComplete="off"
                />
                {searching ? (
                  <i className="ri-loader-4-line animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setShowSuggestions((prev) => !prev);
                      onSearch(empQuery);
                    }}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
                  >
                    <i className="ri-arrow-down-s-line text-sm" />
                  </button>
                )}
              </div>

              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-52 overflow-y-auto">
                  {results.length > 0 ? (
                    results.map((emp) => {
                      const idLabel = emp.biometric_user_id || emp.employee_code || "";
                      return (
                        <div
                          key={emp.id}
                          onClick={() => handleSelect(emp)}
                          className="flex items-center justify-between px-3.5 py-2 hover:bg-indigo-50/60 cursor-pointer border-b border-slate-100 last:border-0 text-xs"
                        >
                          <div>
                            <span className="font-bold text-slate-800">
                              {emp.first_name} {emp.last_name}
                            </span>
                            {emp.kh_name && <span className="text-slate-400 ml-1.5 font-normal">({emp.kh_name})</span>}
                            <p className="text-[11px] text-slate-500">
                              {emp.branches?.name ? `${emp.branches.name} · ` : ""}{emp.role || emp.department || "Staff"}
                            </p>
                          </div>
                          {idLabel && (
                            <span className="font-mono text-[10px] font-bold text-[#253C7D] bg-indigo-50 px-2 py-0.5 rounded">
                              ID: {idLabel}
                            </span>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="p-3 text-center text-xs text-slate-400">
                      {searching ? "Searching employees..." : "No matching active employees found"}
                    </div>
                  )}
                </div>
              )}

              {selectedEmp && (
                <div className="mt-2 flex items-center justify-between bg-indigo-50/70 border border-indigo-100 rounded-lg px-3 py-1.5 text-xs text-[#253C7D]">
                  <span>
                    Selected: <strong>{selectedEmp.first_name} {selectedEmp.last_name}</strong>
                    {selectedEmp.branches?.name ? ` (${selectedEmp.branches.name})` : ""}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedEmp(null);
                      setEmpQuery("");
                      onChange("employee_id", "");
                    }}
                    className="text-rose-500 hover:text-rose-700 font-bold ml-2 text-[11px]"
                  >
                    Clear
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
});
