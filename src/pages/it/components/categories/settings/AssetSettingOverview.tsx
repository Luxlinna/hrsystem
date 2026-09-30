import { memo } from "react";
import type { AssetCategoryCardConfig } from "../../../constants";
import type { AssetSettingData } from "../types";

interface AssetSettingOverviewProps {
  settings: AssetSettingData;
  categories: AssetCategoryCardConfig[];
  onStartEdit: () => void;
}

export const AssetSettingOverview = memo(function AssetSettingOverview({
  settings,
  categories,
  onStartEdit,
}: AssetSettingOverviewProps) {
  const isConfigured = !!settings.propertyOf || Object.keys(settings.categoryTags).length > 0;

  return (
    <div className="space-y-4">
      {/* Top Row: Title & Action Button */}
      <div className="flex items-center justify-between pt-2">
        <h2 className="text-xl font-normal text-slate-600 tracking-tight">
          Asset Setting
        </h2>

        <button
          type="button"
          onClick={onStartEdit}
          className="px-4 py-2 rounded-md bg-[#253C7D] hover:bg-[#1E3064] text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
        >
          <i className="ri-edit-box-line text-sm" />
          <span>Edit Asset Setting</span>
        </button>
      </div>

      {/* Setting Content Area */}
      {!isConfigured ? (
        <div className="bg-white rounded-md border border-slate-200/80 p-8 text-center text-xs text-slate-500 font-medium">
          No records found
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Property Owner
              </span>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {settings.propertyOf || "General Organization"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tagging Number Pattern
              </span>
              <p className="text-xs font-mono font-bold text-[#253C7D] mt-0.5">
                {settings.prefix ? `${settings.prefix}-` : "-"}{settings.sequenceNumber || "0001"}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                Tagging Mode
              </span>
              <span className="inline-block mt-0.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-[#253C7D] border border-blue-200">
                {settings.taggingMode}
              </span>
            </div>
          </div>

          {/* Category Tags Table */}
          <div className="p-5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3">
              Category Tag Mapping
            </h4>
            <div className="border border-slate-200 rounded-md overflow-hidden bg-white">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <tr>
                    <th className="py-2.5 px-3 w-12 text-center">No.</th>
                    <th className="py-2.5 px-4">Name</th>
                    <th className="py-2.5 px-4 w-40">Tag</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {categories.map((c, idx) => (
                    <tr key={c.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 text-center text-slate-500 font-medium">
                        {idx + 1}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-800">
                        {c.name}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-semibold text-slate-700">
                        {settings.categoryTags[c.id] || c.tag || "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
