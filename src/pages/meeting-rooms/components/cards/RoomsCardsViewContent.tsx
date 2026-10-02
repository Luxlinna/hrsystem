import { memo } from "react";

export const RoomsCardsViewContent = memo(function RoomsCardsViewContent() {
  return (
    <div className="min-h-[55vh] flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 text-center shadow-2xs animate-in fade-in duration-150">
      <div className="w-16 h-16 rounded-2xl bg-sky-50 dark:bg-sky-950/50 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-3xl mb-4 shadow-sm border border-sky-100 dark:border-sky-900/50">
        <i className="ri-layout-grid-line" />
      </div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">Coming Soon</h2>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-xs">
        The Room Management Directory & Gallery view is currently under development and will be available soon.
      </p>
    </div>
  );
});
