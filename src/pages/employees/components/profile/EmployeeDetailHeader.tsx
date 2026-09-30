import { memo } from "react";
import { useNavigate } from "react-router-dom";

interface EmployeeDetailHeaderProps {
  onBack?: () => void;
}

export const EmployeeDetailHeader = memo(function EmployeeDetailHeader({
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
    <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-200">
      <h1 className="text-lg sm:text-xl font-normal text-slate-700 tracking-tight">
        View Employee Detail
      </h1>

      <button
        type="button"
        onClick={handleBack}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-slate-300 bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-[13px] font-medium text-slate-700 transition-colors cursor-pointer select-none"
      >
        <i className="ri-arrow-left-s-line text-sm" />
        <span>Back</span>
      </button>
    </div>
  );
});

