import { memo } from "react";

export interface OfferStepItem {
  id: number;
  key: string;
  name: string;
  subtitle: string;
  icon: string;
  isDone: boolean;
  isCurrent: boolean;
  details?: string | null;
}

interface OfferTimelineStepGridProps {
  steps: OfferStepItem[];
}

export const OfferTimelineStepGrid = memo(function OfferTimelineStepGrid({
  steps,
}: OfferTimelineStepGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5 relative">
      {steps.map((step) => {
        return (
          <div
            key={step.key}
            className={`relative p-3 rounded-2xl border transition-all flex flex-col justify-between ${
              step.isCurrent
                ? "bg-blue-50/50 border-[#253C7D] ring-2 ring-[#253C7D]/20 shadow-xs"
                : step.isDone
                ? "bg-slate-50/70 border-emerald-200/90 text-slate-800"
                : "bg-gray-50/40 border-gray-200/60 opacity-60 text-gray-500"
            }`}
          >
            <div>
              {/* Step Header */}
              <div className="flex items-center justify-between mb-2">
                <span
                  className={`w-6 h-6 rounded-full text-xs font-black flex items-center justify-center shrink-0 ${
                    step.isDone
                      ? "bg-emerald-600 text-white"
                      : step.isCurrent
                      ? "bg-[#253C7D] text-white animate-pulse"
                      : "bg-gray-200 text-gray-600"
                  }`}
                >
                  {step.isDone ? <i className="ri-check-line text-xs" /> : step.id}
                </span>
                <i
                  className={`${step.icon} text-base ${
                    step.isDone
                      ? "text-emerald-600"
                      : step.isCurrent
                      ? "text-[#253C7D]"
                      : "text-gray-400"
                  }`}
                />
              </div>

              {/* Title & Subtitle */}
              <h4 className="text-xs font-black text-slate-900 leading-tight line-clamp-1">{step.name}</h4>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">{step.subtitle}</p>

              {step.details && (
                <p className="text-[10px] text-slate-600 font-medium mt-1.5 pt-1.5 border-t border-slate-200/60 line-clamp-2">
                  {step.details}
                </p>
              )}
            </div>

            {/* Status indicator tag */}
            <div className="mt-3 pt-2">
              {step.isDone ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100/80 px-2 py-0.5 rounded-md">
                  <i className="ri-checkbox-circle-fill text-[11px]" /> Done
                </span>
              ) : step.isCurrent ? (
                <span className="inline-flex items-center gap-1 text-[10px] font-black text-blue-900 bg-blue-100 px-2 py-0.5 rounded-md uppercase tracking-wider">
                  <i className="ri-play-circle-line text-[11px]" /> Active
                </span>
              ) : (
                <span className="inline-flex items-center text-[10px] font-medium text-gray-400">
                  Pending
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
});
