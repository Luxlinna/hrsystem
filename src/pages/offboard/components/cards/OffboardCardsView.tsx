import { memo } from "react";
import type { Offboarding } from "../../types";
import { OffboardingCard } from "./OffboardingCard";

interface OffboardCardsViewProps {
  offboardings: Offboarding[];
  onUpdateStatus: (id: string, status: string) => void;
  onToggleTask: (taskId: string, currentStatus: string) => void;
  onOpenAddTaskModal: (offboardingId: string) => void;
  onOpenEditModal: (o: Offboarding) => void;
  onDeleteOffboarding: (id: string, name: string) => void;
  onStartOffboarding: () => void;
}

export const OffboardCardsView = memo(function OffboardCardsView({
  offboardings,
  onUpdateStatus,
  onToggleTask,
  onOpenAddTaskModal,
  onOpenEditModal,
  onDeleteOffboarding,
  onStartOffboarding,
}: OffboardCardsViewProps) {
  if (offboardings.length === 0) {
    return (
      <div className="bg-white rounded-3xl border border-gray-200/80 p-12 text-center shadow-2xs">
        <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-2">
          <i className="ri-user-unfollow-line" />
        </div>
        <p className="font-extrabold text-sm text-gray-800">No Offboarding Records Found</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
          No employee departures match the active search query or selected stage filters.
        </p>
        <button
          onClick={onStartOffboarding}
          className="mt-4 px-4 py-2 bg-[#253C7D] text-white text-xs font-bold rounded-xl shadow-xs hover:bg-[#1E3064] transition-all cursor-pointer"
        >
          + Start Offboarding
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offboardings.map((o) => (
        <OffboardingCard
          key={o.id}
          offboarding={o}
          onUpdateStatus={onUpdateStatus}
          onToggleTask={onToggleTask}
          onOpenAddTaskModal={onOpenAddTaskModal}
          onOpenEditModal={onOpenEditModal}
          onDeleteOffboarding={onDeleteOffboarding}
        />
      ))}
    </div>
  );
});
