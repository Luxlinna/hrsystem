import { memo } from "react";
import { STAGE_ORDER, STATUS_CONFIG } from "../../constants";

interface OffboardingProgressStepperProps {
  currentStatus: string;
  onUpdateStatus: (newStatus: string) => void;
}

export const OffboardingProgressStepper = memo(function OffboardingProgressStepper({
  currentStatus,
  onUpdateStatus,
}: OffboardingProgressStepperProps) {
  const currentIndex = STAGE_ORDER.indexOf(currentStatus);

  return (
    <div className="flex items-center gap-1 w-full bg-gray-50/80 p-1.5 rounded-xl border border-gray-100 mb-4">
      {STAGE_ORDER.map((stage, idx) => {
        const isPassed = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const cfg = STATUS_CONFIG[stage];

        return (
          <button
            key={stage}
            onClick={() => onUpdateStatus(stage)}
            className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer truncate flex items-center justify-center gap-1 ${
              isCurrent
                ? `${cfg.bg} ${cfg.text} border ${cfg.border} shadow-2xs`
                : isPassed
                ? "text-emerald-700 bg-emerald-50/60"
                : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
            }`}
            title={`Set stage to ${cfg.label}`}
          >
            {isPassed ? (
              <i className="ri-checkbox-circle-fill text-emerald-600 shrink-0" />
            ) : (
              <i className={`${cfg.icon} shrink-0`} />
            )}
            <span className="truncate">{cfg.label}</span>
          </button>
        );
      })}
    </div>
  );
});
