import type { NewRecord } from "../types";

interface DisciplinaryFormFieldsProps {
  newRecord: NewRecord;
  setNewRecord: React.Dispatch<React.SetStateAction<NewRecord>>;
}

export function DisciplinaryFormFields({
  newRecord,
  setNewRecord,
}: DisciplinaryFormFieldsProps) {
  return (
    <>
      <div>
        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
          Warning Subject / Infraction Title <span className="text-rose-500">*</span>
        </label>
        <input
          type="text"
          required
          value={newRecord.title}
          onChange={(e) => setNewRecord({ ...newRecord, title: e.target.value })}
          placeholder="e.g. Unexcused Repeated Tardiness / Policy Non-Compliance..."
          className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
            Warning Date <span className="text-rose-500">*</span>
          </label>
          <input
            type="date"
            required
            value={newRecord.warning_date || newRecord.incident_date}
            onChange={(e) =>
              setNewRecord({
                ...newRecord,
                warning_date: e.target.value,
                incident_date: e.target.value,
              })
            }
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
        <div>
          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
            Follow-up / Review Date
          </label>
          <input
            type="date"
            value={newRecord.follow_up_date}
            onChange={(e) => setNewRecord({ ...newRecord, follow_up_date: e.target.value })}
            className="w-full px-3.5 py-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
          Description of Warning (Infraction &amp; Facts) <span className="text-rose-500">*</span>
        </label>
        <textarea
          rows={3}
          required
          value={newRecord.description}
          onChange={(e) => setNewRecord({ ...newRecord, description: e.target.value })}
          placeholder="Detail the facts of the violation, dates, missed commitments, or policy clauses breached..."
          className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div>
          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
            Action to Take (Corrective Measure / Penalty)
          </label>
          <textarea
            rows={2}
            value={newRecord.action_to_take || newRecord.action_taken || ""}
            onChange={(e) =>
              setNewRecord({
                ...newRecord,
                action_to_take: e.target.value,
                action_taken: e.target.value,
              })
            }
            placeholder="e.g. 3-day unpaid suspension, mandatory retraining, formal letter placed in HR file..."
            className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>

        <div>
          <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
            Employee Promise (Commitment / Rectification Pledge)
          </label>
          <textarea
            rows={2}
            value={newRecord.employee_promise || ""}
            onChange={(e) => setNewRecord({ ...newRecord, employee_promise: e.target.value })}
            placeholder="e.g. Employee pledges to arrive by 8:00 AM every shift and notify supervisor in advance..."
            className="w-full p-3 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
          />
        </div>
      </div>

      <div>
        <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
          Remark (Internal HR &amp; Supervisor Notes)
        </label>
        <input
          type="text"
          value={newRecord.remark || newRecord.notes || ""}
          onChange={(e) =>
            setNewRecord({
              ...newRecord,
              remark: e.target.value,
              notes: e.target.value,
            })
          }
          placeholder="e.g. Disciplinary hearing conducted with Department Head present. Signed copy on file."
          className="w-full px-3.5 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-xs text-gray-900 dark:text-white focus:bg-white focus:outline-none focus:border-[#253C7D]"
        />
      </div>
    </>
  );
}
