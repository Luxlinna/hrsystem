import { memo } from "react";
import type { Offboarding, EnrichedOffboardingTask } from "../types";
import { OffboardExportMenu } from "./OffboardExportMenu";

interface OffboardHeaderProps {
  onStartOffboarding: () => void;
  tab?: "active" | "completed" | "tasks" | "analytics";
  offboardings?: Offboarding[];
  tasks?: EnrichedOffboardingTask[];
}

export const OffboardHeader = memo(function OffboardHeader({
  onStartOffboarding,
  tab = "active",
  offboardings = [],
  tasks = [],
}: OffboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div>
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
          <span>Employee Lifecycle</span>
          <i className="ri-arrow-right-s-line text-xs" />
          <span className="text-[#253C7D] font-bold">Departure Hub</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
          Offboarding & Exit Operations
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-[#253C7D]/10 text-[#253C7D]">
            Lifecycle Management
          </span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-500 mt-1">
          Coordinate employee departures, track multi-departmental clearances, handover assets, and record exit interviews.
        </p>
      </div>

      <div className="flex items-center gap-2.5 flex-wrap">
        <OffboardExportMenu
          tab={tab}
          offboardings={offboardings}
          tasks={tasks}
        />

        <button
          onClick={onStartOffboarding}
          className="inline-flex items-center gap-2 bg-[#253C7D] hover:bg-[#1E3064] text-white px-4 py-2.5 rounded-xl text-xs sm:text-[13px] font-bold transition-all shadow-sm hover:shadow-md cursor-pointer active:scale-98"
        >
          <i className="ri-user-unfollow-line text-base font-bold" />
          Start Offboarding
        </button>
      </div>
    </div>
  );
});
