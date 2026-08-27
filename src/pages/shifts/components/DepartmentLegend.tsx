import { deptColors } from "../constants";

export function DepartmentLegend() {
  return (
    <div className="mt-5 flex flex-wrap items-center gap-3">
      <span className="text-[11px] font-semibold text-gray-400 uppercase">Departments:</span>
      {Object.entries(deptColors).slice(0, 7).map(([dept, color]) => (
        <div key={dept} className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-[11px] text-gray-600">{dept}</span>
        </div>
      ))}
    </div>
  );
}
