import { memo } from "react";
import { useNavigate } from "react-router-dom";

interface ExitSettingsHeaderProps {
  onBack?: () => void;
}

export const ExitSettingsHeader = memo(function ExitSettingsHeader({
  onBack,
}: ExitSettingsHeaderProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate("/exit");
    }
  };

  return (
    <div className="flex items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-slate-100 tracking-tight">
          Exit Setting
        </h1>
      </div>

      <button
        type="button"
        onClick={handleBack}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300 text-xs font-semibold rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/60 transition-colors shadow-2xs cursor-pointer"
      >
        <i className="ri-arrow-left-s-line text-sm" />
        Back
      </button>
    </div>
  );
});
