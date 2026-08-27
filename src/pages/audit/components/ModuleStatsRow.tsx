import { memo } from "react";
import { MODULE_COLORS } from "../constants";

interface ModuleStatsRowProps {
  topModules: [string, number][];
  moduleFilter: string;
  onSelectModule: (module: string) => void;
}

export const ModuleStatsRow = memo(function ModuleStatsRow({
  topModules,
  moduleFilter,
  onSelectModule,
}: ModuleStatsRowProps) {
  if (topModules.length === 0) return null;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-6">
      {topModules.map(([mod, count]) => (
        <button
          key={mod}
          onClick={() => onSelectModule(mod)}
          className={`bg-white border rounded-xl p-3 text-left transition-all cursor-pointer ${
            moduleFilter === mod
              ? "border-[#253C7D] ring-1 ring-[#253C7D]/20"
              : "border-gray-100 hover:border-gray-200"
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span
              className={`text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                MODULE_COLORS[mod] || "bg-gray-100 text-gray-600"
              }`}
            >
              {mod}
            </span>
            <span className="text-xl font-bold text-gray-900">{count}</span>
          </div>
          <p className="text-[11px] text-gray-400">events</p>
        </button>
      ))}
    </div>
  );
});
