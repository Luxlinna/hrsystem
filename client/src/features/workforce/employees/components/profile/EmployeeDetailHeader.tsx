import { memo } from "react";
import { useNavigate } from "react-router-dom";
import type { Employee } from "../../types";
import { formatKhmerFullName } from "../../nameUtils";

interface EmployeeDetailHeaderProps {
  employee?: Employee | null;
  onBack?: () => void;
}

export const EmployeeDetailHeader = memo(function EmployeeDetailHeader({
  employee,
  onBack,
}: EmployeeDetailHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/employees");
    }
  };

  return (
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200 dark:border-slate-800">
      <div>
        <h1 className="text-lg sm:text-xl font-normal text-slate-700 dark:text-slate-200 tracking-tight">
          View Employee Detail
        </h1>
        {employee && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {formatKhmerFullName(employee)} &bull; {employee.employee_code || employee.id.slice(0, 8)}
          </p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:bg-slate-300 text-[13px] font-medium text-slate-700 dark:text-slate-200 transition-colors cursor-pointer select-none shadow-2xs"
        >
          <i className="ri-arrow-left-s-line text-sm" />
          <span>Back</span>
        </button>
      </div>
    </div>
  );
});
