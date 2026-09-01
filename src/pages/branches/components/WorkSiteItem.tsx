import { memo } from "react";
import type { WorkSite } from "../hooks/useWorkSites";

interface WorkSiteItemProps {
  site: WorkSite;
  canManage: boolean;
  onEdit: (site: WorkSite) => void;
  onSetDefault: (site: WorkSite) => void;
  onDeleteSite: (site: WorkSite) => void;
}

export const WorkSiteItem = memo(function WorkSiteItem({
  site,
  canManage,
  onEdit,
  onSetDefault,
  onDeleteSite,
}: WorkSiteItemProps) {
  const startTime = site.work_start_time?.slice(0, 5) || "07:30";
  const endTime = site.work_end_time?.slice(0, 5) || "17:00";

  return (
    <div
      className={`p-3.5 rounded-xl border text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-all ${
        site.is_default ? "bg-amber-50/50 border-amber-200" : "bg-white border-gray-100 hover:border-gray-200 shadow-2xs"
      }`}
    >
      <div className="min-w-0 space-y-1">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="font-bold text-gray-900 text-[13px]">{site.name}</span>
          {site.is_default && (
            <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              Default Site
            </span>
          )}
          {site.is_four_punch_enabled && (
            <span className="bg-indigo-50 text-indigo-700 text-[10px] font-semibold px-1.5 py-0.5 rounded-md border border-indigo-100">
              4-Punch
            </span>
          )}
        </div>

        {site.description && (
          <p className="text-[11px] text-gray-500 truncate flex items-center gap-1">
            <i className="ri-map-pin-line text-gray-400" />
            {site.description}
          </p>
        )}

        <div className="flex items-center gap-3 text-[11px] text-gray-400 flex-wrap pt-0.5">
          <span className="flex items-center gap-1">
            <i className="ri-time-line text-[#253C7D]" />
            {startTime} – {endTime}
          </span>
          {site.latitude != null && site.longitude != null ? (
            <span className="flex items-center gap-1 text-emerald-600">
              <i className="ri-crosshair-2-line" />
              {site.latitude.toFixed(4)}, {site.longitude.toFixed(4)} ({site.geofence_radius_m || 100}m)
            </span>
          ) : (
            <span className="text-gray-400 italic">Inheriting branch GPS</span>
          )}
        </div>
      </div>

      {canManage && (
        <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
          {!site.is_default && (
            <button
              type="button"
              onClick={() => onSetDefault(site)}
              className="px-2.5 py-1 text-[11px] font-semibold text-gray-600 hover:bg-gray-100 rounded-lg border border-gray-200 cursor-pointer transition-colors"
            >
              Make Default
            </button>
          )}
          <button
            type="button"
            onClick={() => onEdit(site)}
            title="Edit site geofence and schedule"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-[#253C7D] hover:bg-blue-50 cursor-pointer transition-colors"
          >
            <i className="ri-edit-line text-sm" />
          </button>
          <button
            type="button"
            onClick={() => onDeleteSite(site)}
            title="Remove site"
            className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer transition-colors"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        </div>
      )}
    </div>
  );
});
