import { memo } from "react";

interface EmployeesStatsRowProps {
  stats: {
    total: number;
    active: number;
    onboarding: number;
    withAccounts: number;
    invited: number;
  };
  branchCount: number;
}

export const EmployeesStatsRow = memo(function EmployeesStatsRow({
  stats,
  branchCount,
}: EmployeesStatsRowProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{stats.total}</p>
          </div>
          <div className="w-10 h-10 bg-[#253C7D]/10 rounded-xl flex items-center justify-center">
            <i className="ri-team-line text-[#253C7D] text-lg" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Active</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.active}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <i className="ri-user-follow-line text-emerald-600 text-lg" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Onboarding</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">{stats.onboarding}</p>
          </div>
          <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
            <i className="ri-user-add-line text-amber-600 text-lg" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Accounts</p>
            <p className="text-2xl font-bold text-emerald-600 mt-1">{stats.withAccounts}</p>
          </div>
          <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
            <i className="ri-checkbox-circle-line text-emerald-600 text-lg" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Invited</p>
            <p className="text-2xl font-bold text-[#253C7D] mt-1">{stats.invited}</p>
          </div>
          <div className="w-10 h-10 bg-[#253C7D]/10 rounded-xl flex items-center justify-center">
            <i className="ri-mail-send-line text-[#253C7D] text-lg" />
          </div>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-5 border border-gray-200/80 shadow-2xs hover:shadow-xs transition-shadow">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</p>
            <p className="text-2xl font-bold text-slate-700 mt-1">{branchCount}</p>
          </div>
          <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
            <i className="ri-building-line text-slate-600 text-lg" />
          </div>
        </div>
      </div>
    </div>
  );
});
