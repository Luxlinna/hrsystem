import { memo } from "react";
import type { DisciplinaryRecord } from "../types";
import { TYPE_CONFIG, SEVERITY_CONFIG, STATUS_CONFIG } from "../constants";

interface DisciplinaryTableViewProps {
  records: DisciplinaryRecord[];
  onSelectRecord: (record: DisciplinaryRecord) => void;
}

export const DisciplinaryTableView = memo(function DisciplinaryTableView({
  records,
  onSelectRecord,
}: DisciplinaryTableViewProps) {
  return (
    <div className="bg-white rounded-3xl border border-gray-200/80 shadow-2xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50/70 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
              <th className="px-5 py-3.5">Employee</th>
              <th className="px-5 py-3.5">Case Title</th>
              <th className="px-5 py-3.5">Scope</th>
              <th className="px-5 py-3.5">Incident Type</th>
              <th className="px-5 py-3.5">Severity</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5">Incident Date</th>
              <th className="px-5 py-3.5">Follow-up</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {records.map((r) => {
              const typeCfg = TYPE_CONFIG[r.type] || TYPE_CONFIG.verbal_warning;
              const sevCfg = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.medium;
              const statusCfg = STATUS_CONFIG[r.status] || STATUS_CONFIG.open;
              const emp = r.employees;
              const isOverdue =
                r.follow_up_date &&
                r.status !== "resolved" &&
                r.status !== "closed" &&
                new Date(r.follow_up_date + "T00:00:00") < new Date();

              return (
                <tr
                  key={r.id}
                  onClick={() => onSelectRecord(r)}
                  className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                >
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <div className="flex items-center gap-2.5">
                      {emp?.avatar_url ? (
                        <img src={emp.avatar_url} alt="" className="w-8 h-8 rounded-xl object-cover shrink-0" />
                      ) : (
                        <div className="w-8 h-8 rounded-xl bg-[#253C7D]/10 text-[#253C7D] flex items-center justify-center text-xs font-black shrink-0">
                          {emp ? emp.first_name[0] + emp.last_name[0] : "?"}
                        </div>
                      )}
                      <div>
                        <p className="font-extrabold text-gray-900 group-hover:text-[#253C7D] transition-colors">
                          {emp ? `${emp.first_name} ${emp.last_name}` : "—"}
                        </p>
                        <p className="text-[10px] text-gray-400">{emp?.department}</p>
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-3.5">
                    <p className="font-bold text-gray-900 line-clamp-1 max-w-xs">{r.title}</p>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {!r.branch_id ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200/60">
                        <i className="ri-global-line text-[10px]" /> Company-Wide
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60">
                        <i className="ri-building-line text-[10px]" /> {r.branches?.name || "Branch Case"}
                      </span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${typeCfg.bg} ${typeCfg.color}`}
                    >
                      <i className={typeCfg.icon} />
                      {typeCfg.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${sevCfg.bg} ${sevCfg.color}`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${sevCfg.dot}`} />
                      {sevCfg.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${statusCfg.bg} ${statusCfg.color}`}>
                      {statusCfg.label}
                    </span>
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap text-gray-600 font-medium">
                    {r.incident_date
                      ? new Date(r.incident_date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })
                      : "—"}
                  </td>

                  <td className="px-5 py-3.5 whitespace-nowrap">
                    {r.follow_up_date ? (
                      <span className={`text-[11px] font-bold ${isOverdue ? "text-rose-600" : "text-gray-700"}`}>
                        {new Date(r.follow_up_date + "T00:00:00").toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                        {isOverdue && " ⚠️"}
                      </span>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>

                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <button
                      type="button"
                      onClick={() => onSelectRecord(r)}
                      className="px-2.5 py-1 text-xs font-bold text-[#253C7D] bg-[#253C7D]/10 hover:bg-[#253C7D]/20 rounded-lg transition-colors cursor-pointer"
                    >
                      Inspect Case
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
});
