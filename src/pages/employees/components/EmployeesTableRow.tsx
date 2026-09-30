import { memo, useState } from "react";
import { Link } from "react-router-dom";
import type { Employee } from "../types";

interface EmployeesTableRowProps {
  employee: Employee;
  index: number;
  isSelected: boolean;
  canManage: boolean;
  showSalary?: boolean;
  onSelectOne: (id: string) => void;
  onInvite?: (e: Employee) => void;
  onSetUpPhoneAccount?: (e: Employee) => void;
  onDelete: (e: Employee) => void;
}

const formatDate = (d?: string | null) => {
  if (!d) return "-";
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${day}/${month}/${date.getFullYear()}`;
  } catch {
    return d;
  }
};

export const EmployeesTableRow = memo(function EmployeesTableRow({
  employee: e,
  index,
  isSelected,
  canManage,
  showSalary = false,
  onSelectOne,
  onDelete,
}: EmployeesTableRowProps) {
  const [showActionMenu, setShowActionMenu] = useState(false);

  const isStatusActive = e.status === "active" || e.status === "onboarding";
  const fullName = e.full_name || `${e.first_name || ""} ${e.last_name || ""}`.trim() || "Unnamed";
  const employeeCode = e.employee_code || e.biometric_user_id || "—";
  const designation = e.position || e.role || "Staff";
  const empType = (e.employment_type || "FULL-TIME").toUpperCase();
  const department = (e.department || "OPERATIONS").toUpperCase();
  const buCode = e.code_bu || "8887";
  const contractType = (e.contract_type || "PERMANENT (UDC)").toUpperCase();
  const contractPeriod = e.contract_effective_date
    ? `${formatDate(e.contract_effective_date)} - ${e.contract_end_date ? formatDate(e.contract_end_date) : "Never"}`
    : `${formatDate(e.join_date)} - Never`;

  return (
    <tr
      className={`hover:bg-sky-50/30 transition-colors border-b border-slate-100 text-xs text-slate-800 ${
        isSelected ? "bg-sky-50/60" : ""
      }`}
    >
      <td className="py-2.5 px-3 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelectOne(e.id)}
          className="w-3.5 h-3.5 rounded border-slate-300 text-[#3498db] focus:ring-[#3498db] cursor-pointer"
        />
      </td>

      <td className="py-2.5 px-2 text-center text-slate-400 font-medium">{index + 1}</td>

      <td className="py-2.5 px-3">
        <Link to={`/employees/${e.id}`} className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-slate-200 shrink-0 border border-slate-200">
            {e.avatar_url ? (
              <img src={e.avatar_url} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center font-bold text-[10px] bg-sky-100 text-sky-800">
                {e.first_name?.[0]}
                {e.last_name?.[0]}
              </div>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-slate-800 group-hover:text-[#3498db] transition-colors truncate">
              {fullName}
            </p>
            <span className="text-[10px] text-slate-400 font-mono block">{employeeCode}</span>
          </div>
        </Link>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-700 truncate">{designation}</p>
        <span className="inline-block mt-0.5 text-[9px] font-semibold px-1.5 py-0.2 rounded border border-slate-300 text-slate-500 bg-white">
          {empType}
        </span>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-700 truncate">{department}</p>
        <span className="text-[10px] text-slate-400 block truncate" title={`${e.branches?.name || buCode} - ${e.work_locations?.name || "Main Office"}`}>
          {e.branches?.name || buCode} • {e.work_locations?.name || "Main Office"}
        </span>
      </td>

      <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
        {formatDate(e.join_date || e.start_date)}
      </td>

      <td className="py-2.5 px-3">
        <p className="font-medium text-slate-700 truncate">{contractType}</p>
        <span className="text-[10px] text-slate-400 whitespace-nowrap block">{contractPeriod}</span>
      </td>

      <td className="py-2.5 px-3">
        <p className="font-mono text-slate-700">
          {showSalary ? `${e.basic_salary || e.contract_rate || 0} USD` : "*****"}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-[#3498db] text-white">
            {e.tax_salary_frequency || "Monthly"}
          </span>
          <span className="text-[9px] font-medium px-1.5 py-0.2 rounded bg-[#3498db] text-white">
            {e.payroll_structure || "Gross"}
          </span>
        </div>
      </td>

      <td className="py-2.5 px-3">
        <div className="space-y-1">
          <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded text-white whitespace-nowrap ${
            isStatusActive ? "bg-emerald-500" : "bg-[#4b5563]"
          }`}>
            {isStatusActive ? "Employed" : "Exited"}
          </span>
          <div>
            <span className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded text-white whitespace-nowrap ${
              isStatusActive ? "bg-emerald-500" : "bg-[#1e293b]"
            }`}>
              {isStatusActive ? "Active" : "Deactivate"}
            </span>
          </div>
        </div>
      </td>

      <td className="py-2.5 px-3 text-center relative">
        <button
          type="button"
          onClick={(ev) => {
            ev.stopPropagation();
            setShowActionMenu(!showActionMenu);
          }}
          className="px-2 py-1 rounded border border-sky-400 text-sky-600 hover:bg-sky-50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs"
        >
          <i className="ri-settings-3-line text-xs" />
          <i className="ri-arrow-down-s-line text-[10px]" />
        </button>

        {showActionMenu && (
          <div
            onClick={(ev) => ev.stopPropagation()}
            className="absolute right-3 top-8 w-36 rounded-md bg-white border border-slate-200 shadow-xl py-1 z-30 animate-in fade-in zoom-in-95 duration-100 text-left text-xs"
          >
            <Link
              to={`/employees/${e.id}`}
              onClick={() => setShowActionMenu(false)}
              className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-user-line text-slate-400" />
              <span>View Profile</span>
            </Link>
            {canManage && (
              <button
                type="button"
                onClick={() => {
                  setShowActionMenu(false);
                  onDelete(e);
                }}
                className="w-full text-left px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-1.5 cursor-pointer border-t border-slate-100"
              >
                <i className="ri-delete-bin-line" />
                <span>Delete</span>
              </button>
            )}
          </div>
        )}
      </td>
    </tr>
  );
});
