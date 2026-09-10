import { INTEGRATIONS } from "../constants";

export function IntegrationsSection() {
  return (
    <div className="space-y-6">
      {/* Standard System Integrations List */}
      <div className="space-y-4">
        <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
          External Services & Webhooks
        </h4>
        {INTEGRATIONS.map((int) => (
          <div
            key={int.name}
            className="border border-gray-100 dark:border-slate-800 rounded-xl p-5 flex items-center justify-between dark:bg-slate-900/60 bg-white"
          >
            <div>
              <div className="flex items-center gap-2">
                <p className="text-[14px] font-semibold text-gray-900 dark:text-slate-100">
                  {int.name}
                </p>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    int.connected
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border dark:border-emerald-800/60"
                      : "bg-gray-50 text-gray-500 dark:bg-slate-800 dark:text-slate-400"
                  }`}
                >
                  {int.connected ? "Connected" : "Disconnected"}
                </span>
              </div>
              <p className="text-[12px] text-gray-500 dark:text-slate-400">{int.desc}</p>
              <p className="text-[11px] text-gray-400 dark:text-slate-500 mt-0.5">
                Last sync: {int.lastSync}
              </p>
            </div>
            <button
              className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap cursor-pointer ${
                int.connected
                  ? "border-gray-200 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:bg-gray-50 dark:hover:bg-slate-800"
                  : "border-[#253C7D] dark:border-blue-500 text-[#253C7D] dark:text-sky-300 hover:bg-[#253C7D]/5 dark:hover:bg-blue-950/40"
              }`}
            >
              {int.connected ? "Configure" : "Connect"}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
