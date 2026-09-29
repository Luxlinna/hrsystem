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
      className="lg:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end gap-2"
      ref={fabRef as React.RefObject<HTMLDivElement>}
    >
      {/* Backdrop overlay when open */}
      {fabOpen && (
        <div
          onClick={() => setFabOpen(false)}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-xs z-30"
        />
      )}

      {/* Action list */}
      {fabOpen && (
        <div className="flex flex-col items-end gap-2 mb-1 z-40 animate-in fade-in slide-in-from-bottom-2 duration-150">
          {allowedActions.map((action) => (
            <button
              key={action.label}
              type="button"
              onClick={() => {
                setFabOpen(false);
                navigate(action.path);
              }}
              className="flex items-center gap-3 bg-white border border-slate-200/90 rounded-xl px-3.5 py-2.5 shadow-lg active:scale-98 transition-all cursor-pointer group"
            >
              <div className="flex flex-col items-start text-left">
                <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors whitespace-nowrap">
                  {action.label}
                </span>
                <span className="text-[10px] text-slate-400">{action.note}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 group-hover:bg-slate-900 group-hover:text-white transition-colors">
                <i className={`${action.icon} text-sm`} />
              </div>
            </button>
          ))}
        </div>
      )}

      {/* FAB trigger button */}
      <button
        type="button"
        onClick={() => setFabOpen((v) => !v)}
        className={`w-11 h-11 rounded-xl flex items-center justify-center text-white transition-all duration-200 active:scale-95 cursor-pointer shadow-md z-40 ${
          fabOpen ? "bg-slate-900 rotate-45" : "bg-slate-900 hover:bg-slate-800"
        }`}
        aria-label="Quick actions"
      >
        <i className={`${fabOpen ? "ri-close-line" : "ri-add-line"} text-xl`} />
      </button>
    </div>
  );
});
