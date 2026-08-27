import { INTEGRATIONS } from "../constants";

export function IntegrationsSection() {
  return (
    <div className="space-y-4">
      {INTEGRATIONS.map((int) => (
        <div
          key={int.name}
          className="border border-gray-100 rounded-xl p-5 flex items-center justify-between"
        >
          <div>
            <div className="flex items-center gap-2">
              <p className="text-[14px] font-semibold text-gray-900">
                {int.name}
              </p>
              <span
                className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  int.connected
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-gray-50 text-gray-500"
                }`}
              >
                {int.connected ? "Connected" : "Disconnected"}
              </span>
            </div>
            <p className="text-[12px] text-gray-500">{int.desc}</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Last sync: {int.lastSync}
            </p>
          </div>
          <button
            className={`px-3 py-1.5 text-[11px] font-medium rounded-lg border transition-colors whitespace-nowrap ${
              int.connected
                ? "border-gray-200 text-gray-600 hover:bg-gray-50"
                : "border-[#253C7D] text-[#253C7D] hover:bg-[#253C7D]/5"
            }`}
          >
            {int.connected ? "Configure" : "Connect"}
          </button>
        </div>
      ))}
    </div>
  );
}
