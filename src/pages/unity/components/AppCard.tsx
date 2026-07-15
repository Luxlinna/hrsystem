import { UnityApp } from "../types";

interface AppCardProps {
  app: UnityApp;
  accessCount: number;
  usageCount: number;
  todayMinutes: number;
  onClick: () => void;
  onGrantAccess: () => void;
}

const categoryColors: Record<string, string> = {
  Communication: "bg-emerald-50 text-emerald-700",
  Engineering: "bg-sky-50 text-sky-700",
  Design: "bg-rose-50 text-rose-700",
  Productivity: "bg-amber-50 text-amber-700",
  Sales: "bg-violet-50 text-violet-700",
  HR: "bg-teal-50 text-teal-700",
  Security: "bg-red-50 text-red-700",
};

export default function AppCard({ app, accessCount, usageCount, todayMinutes, onClick, onGrantAccess }: AppCardProps) {
  const statusColor =
    app.status === "active" ? "bg-green-100 text-green-700" :
    app.status === "maintenance" ? "bg-amber-100 text-amber-700" :
    "bg-gray-100 text-gray-500";

  return (
    <div
      className="border border-gray-100 rounded-xl p-5 cursor-pointer hover:border-gray-200 transition-all group"
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-lg"
          style={{ backgroundColor: app.color }}
        >
          <i className={`${app.icon} w-5 h-5 flex items-center justify-center`} />
        </div>
        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${statusColor}`}>
          {app.status}
        </span>
      </div>

      <p className="text-[14px] font-bold text-gray-900 group-hover:text-[#0D7377] transition-colors">{app.name}</p>
      <p className="text-[12px] text-gray-500 mt-1 leading-relaxed line-clamp-2">{app.description}</p>

      <span className={`inline-block mt-3 text-[10px] font-semibold px-2 py-1 rounded-md ${categoryColors[app.category] || "bg-gray-50 text-gray-500"}`}>
        {app.category}
      </span>

      <div className="mt-4 grid grid-cols-3 gap-2 pt-4 border-t border-gray-50">
        <div className="text-center">
          <p className="text-[15px] font-bold text-gray-900">{accessCount}</p>
          <p className="text-[10px] text-gray-400">Users</p>
        </div>
        <div className="text-center border-x border-gray-100">
          <p className="text-[15px] font-bold text-gray-900">{usageCount}</p>
          <p className="text-[10px] text-gray-400">Events</p>
        </div>
        <div className="text-center">
          <p className="text-[15px] font-bold text-gray-900">{todayMinutes}m</p>
          <p className="text-[10px] text-gray-400">Today</p>
        </div>
      </div>

      <div className="mt-3 flex gap-2">
        <a
          href={app.integration_url}
          target="_blank"
          rel="nofollow noreferrer"
          className="flex-1 py-2 text-center text-[11px] font-semibold text-[#0D7377] border border-[#0D7377]/20 rounded-lg hover:bg-[#0D7377]/5 transition-colors whitespace-nowrap"
          onClick={(e) => e.stopPropagation()}
        >
          <i className="ri-external-link-line mr-1" />
          Open App
        </a>
        <button
          className="flex-1 py-2 text-[11px] font-semibold text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors whitespace-nowrap"
          onClick={(e) => { e.stopPropagation(); onGrantAccess(); }}
        >
          <i className="ri-user-add-line mr-1" />
          Grant
        </button>
      </div>
    </div>
  );
}