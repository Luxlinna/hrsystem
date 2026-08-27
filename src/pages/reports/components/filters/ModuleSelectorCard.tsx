import { memo } from "react";
import { MODULES } from "../../constants";

interface ModuleSelectorCardProps {
  activeModule: string;
  onSelectModule: (modId: string) => void;
}

export const ModuleSelectorCard = memo(function ModuleSelectorCard({
  activeModule,
  onSelectModule,
}: ModuleSelectorCardProps) {
  return (
    <div className="bg-white border border-gray-100 rounded-xl p-4 shadow-2xs">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Select Report Type
      </p>
      <div className="space-y-2">
        {MODULES.map((m) => (
          <button
            key={m.id}
            onClick={() => onSelectModule(m.id)}
            className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-all cursor-pointer ${
              activeModule === m.id
                ? `${m.color} border-current shadow-2xs`
                : "border-transparent hover:bg-gray-50 text-gray-700"
            }`}
          >
            <div
              className={`w-8 h-8 flex items-center justify-center rounded-lg shrink-0 ${
                activeModule === m.id ? "bg-current/10" : "bg-gray-100"
              }`}
            >
              <i className={`${m.icon} text-sm ${activeModule === m.id ? "" : "text-gray-500"}`} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">{m.label}</p>
              <p className="text-[11px] opacity-70 mt-0.5 leading-snug">{m.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
});
