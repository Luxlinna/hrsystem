import { memo } from "react";
import { ADD_EMPLOYEE_STEPS, type AddEmployeeStepId } from "./types";

interface AddEmployeeNavTabsProps {
  activeTab: AddEmployeeStepId;
  onSelectTab: (stepId: AddEmployeeStepId) => void;
}

export const AddEmployeeNavTabs = memo(function AddEmployeeNavTabs({
  activeTab,
  onSelectTab,
}: AddEmployeeNavTabsProps) {
  return (
    <div className="flex items-center gap-6 sm:gap-8 border-b border-slate-200 overflow-x-auto pb-1">
      {ADD_EMPLOYEE_STEPS.map((step) => {
        const isActive = step.id === activeTab;
        return (
          <button
            key={step.id}
            type="button"
            onClick={() => onSelectTab(step.id)}
            className={`pb-2.5 text-xs font-medium whitespace-nowrap transition-colors cursor-pointer relative ${
              isActive
                ? "text-[#253C7D] font-bold border-b-2 border-[#253C7D]"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            {step.shortLabel}
          </button>
        );
      })}
    </div>
  );
});
