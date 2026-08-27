import { memo } from "react";
import { useNavigate } from "react-router-dom";
import { QUICK_ACTIONS } from "../constants";

interface MobileFabQuickActionsProps {
  fabOpen: boolean;
  setFabOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fabRef: React.RefObject<HTMLDivElement | null>;
  can: (module: string) => boolean;
}

export const MobileFabQuickActions = memo(function MobileFabQuickActions({
  fabOpen,
  setFabOpen,
  fabRef,
  can,
}: MobileFabQuickActionsProps) {
  const navigate = useNavigate();
  const allowedActions = QUICK_ACTIONS.filter((action) => can(action.module));

  return (
    <div
      className="lg:hidden fixed bottom-20 right-4 z-50 flex flex-col items-end gap-2"
      ref={fabRef as React.RefObject<HTMLDivElement>}
    >
      {/* Action list */}
      {fabOpen && (
        <div className="flex flex-col items-end gap-2 mb-1">
          {allowedActions.map((action) => (
            <button
              key={action.label}
              onClick={() => {
                setFabOpen(false);
                navigate(action.path);
              }}
              className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 cursor-pointer"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.12)" }}
            >
              <div className="flex flex-col items-start">
                <span className="text-[13px] font-semibold text-gray-900 whitespace-nowrap">
                  {action.label}
                </span>
                <span className="text-[11px] text-gray-400">{action.note}</span>
              </div>
              <div className={`w-9 h-9 rounded-xl ${action.color} flex items-center justify-center shrink-0`}>
                <i className={`${action.icon} text-white text-base w-5 h-5 flex items-center justify-center`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB trigger button */}
      <button
        onClick={() => setFabOpen((v) => !v)}
        className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 active:scale-95 cursor-pointer ${
          fabOpen ? "bg-gray-800 rotate-45" : "bg-[#253C7D]"
        }`}
        style={{ boxShadow: "0 6px 24px rgba(13,115,119,0.4)" }}
        aria-label="Quick actions"
      >
        <i className={`${fabOpen ? "ri-close-line" : "ri-add-line"} text-2xl w-6 h-6 flex items-center justify-center`} />
      </button>
    </div>
  );
});
