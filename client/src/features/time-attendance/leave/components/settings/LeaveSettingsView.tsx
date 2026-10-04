import React from "react";
import type { LeaveTypeSetting } from "../../services/leaveSettingsService";

interface LeaveSettingsViewProps {
  leaveTypes: LeaveTypeSetting[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  canModify?: boolean;
  onCreateNew: () => void;
  onEdit: (type: LeaveTypeSetting) => void;
  onDelete: (id: string, name: string) => void;
  onToggleActive: (type: LeaveTypeSetting) => void;
  onBack: () => void;
}

export const LeaveSettingsView: React.FC<LeaveSettingsViewProps> = ({
  leaveTypes,
  loading,
  searchQuery,
  setSearchQuery,
  canModify = false,
  onCreateNew,
  onEdit,
  onDelete,
  onToggleActive,
  onBack,
}) => {
  return (
    <div className="w-full space-y-6 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
            <span>Time & Attendance</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span>Absence & Leave</span>
            <i className="ri-arrow-right-s-line text-xs" />
            <span className="text-[#253C7D] font-bold">Leave Settings</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight flex items-center gap-2.5">
            Leave Settings
            {!canModify && (
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                View Only
              </span>
            )}
          </h1>
          <p className="text-xs text-gray-500 mt-0.5">
            Configure leave categories, rate multipliers, gender conditions, and contract restrictions.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {canModify && (
            <button
              type="button"
              onClick={onCreateNew}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#253C7D] hover:bg-[#1E3064] text-white rounded-xl text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <i className="ri-add-line text-sm" />
              Create Leave Type
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-gray-700 text-xs font-bold shadow-2xs transition-all cursor-pointer"
          >
            <i className="ri-arrow-left-line text-sm text-[#253C7D]" />
            Back to Leave Hub
          </button>
        </div>
      </div>

      {!canModify && (
        <div className="p-3.5 bg-amber-50/70 border border-amber-200/70 rounded-xl text-xs text-amber-800 flex items-center gap-2">
          <i className="ri-shield-keyhole-line text-amber-600 text-base shrink-0" />
          <span>Only <strong>BU Admin</strong> and <strong>Super Admin</strong> can create, edit, or delete leave types.</span>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            type="text"
            placeholder="Search leave types by code or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-200 rounded-xl text-xs focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            <i className="ri-loader-4-line animate-spin text-lg inline-block mr-1" />
            Loading leave types...
          </div>
        ) : leaveTypes.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs">
            No leave types found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-600 font-bold">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Leave Type Name</th>
                  <th className="p-3.5">Period</th>
                  <th className="p-3.5">Rate</th>
                  <th className="p-3.5">Eligibility</th>
                  <th className="p-3.5">Restricted Contracts</th>
                  <th className="p-3.5 text-center">Status</th>
                  {canModify && <th className="p-3.5 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {leaveTypes.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="p-3.5">
                      <span className="font-extrabold px-2.5 py-1 rounded-lg bg-[#253C7D]/10 text-[#253C7D] text-[11px]">
                        {item.code}
                      </span>
                    </td>
                    <td className="p-3.5">
                      <p className="font-bold text-gray-900">{item.name}</p>
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-400">
                        {item.allow_compensatory && <span>• Compensatory</span>}
                        {item.is_unpaid && <span className="text-amber-600">• Unpaid</span>}
                        {item.require_attachment && <span>• Requires Attachment</span>}
                        {item.request_in_advance && <span>• In Advance</span>}
                      </div>
                    </td>
                    <td className="p-3.5 capitalize text-gray-600 font-semibold">{item.period_type}</td>
                    <td className="p-3.5 font-bold text-gray-800">{item.rate}x</td>
                    <td className="p-3.5 capitalize text-gray-600">
                      {item.eligible_for === "both" ? "All Genders" : `${item.eligible_for} Only`}
                    </td>
                    <td className="p-3.5">
                      {item.excluded_contract_types?.length ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200">
                          {item.excluded_contract_types.length} excluded
                        </span>
                      ) : (
                        <span className="text-gray-400 text-[10px]">None (All allowed)</span>
                      )}
                    </td>
                    <td className="p-3.5 text-center">
                      {canModify ? (
                        <button
                          type="button"
                          onClick={() => onToggleActive(item)}
                          className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors ${
                            item.is_active
                              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                              : "bg-gray-100 text-gray-500 border border-gray-200"
                          }`}
                        >
                          {item.is_active ? "Active" : "Disabled"}
                        </button>
                      ) : (
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                          item.is_active ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {item.is_active ? "Active" : "Disabled"}
                        </span>
                      )}
                    </td>
                    {canModify && (
                      <td className="p-3.5 text-right space-x-2">
                        <button
                          type="button"
                          onClick={() => onEdit(item)}
                          className="text-[#253C7D] hover:text-[#1E3064] font-bold cursor-pointer"
                          title="Edit leave type"
                        >
                          <i className="ri-edit-line text-sm" />
                        </button>
                        <button
                          type="button"
                          onClick={() => onDelete(item.id, item.name)}
                          className="text-rose-500 hover:text-rose-700 font-bold cursor-pointer"
                          title="Delete leave type"
                        >
                          <i className="ri-delete-bin-line text-sm" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
