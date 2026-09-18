interface NssfMetricCardsProps {
  totalCount: number;
  registeredCount: number;
  unregisteredCount: number;
}

export function NssfMetricCards({
  totalCount,
  registeredCount,
  unregisteredCount,
}: NssfMetricCardsProps) {
  const coverageRate = totalCount > 0 ? Math.round((registeredCount / totalCount) * 100) : 0;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Total Employees</p>
        <p className="text-2xl font-bold text-gray-900">{totalCount}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">NSSF Registered</p>
        <p className="text-2xl font-bold text-green-600">{registeredCount}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Pending Registration</p>
        <p className="text-2xl font-bold text-orange-500">{unregisteredCount}</p>
      </div>
      <div className="bg-white rounded-2xl border border-gray-200/80 shadow-2xs p-4">
        <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">Coverage Rate</p>
        <p className="text-2xl font-bold text-[#253C7D]">{coverageRate}%</p>
      </div>
    </div>
  );
}
