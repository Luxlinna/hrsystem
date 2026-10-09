import React from "react";

interface DetailChangeStatusInfoProps {
  statusType: string;
  effectiveDate: string;
  empType: string;
  site: string;
  department: string;
  designation: string;
  supervisor: string;
  salary: string | number;
  showRate: boolean;
  onToggleRate: () => void;
}

export const DetailChangeStatusInfo: React.FC<DetailChangeStatusInfoProps> = ({
  statusType,
  effectiveDate,
  empType,
  site,
  department,
  designation,
  supervisor,
  salary,
  showRate,
  onToggleRate,
}) => {
  return (
    <div>
      <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider mb-4">
        CHANGE STATUS INFO
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-[180px_1fr] gap-y-3 text-xs">
        <div className="text-slate-600 font-normal">Status Type</div>
        <div className="font-normal text-slate-800">{statusType}</div>

        <div className="text-slate-600 font-normal">Effective Date</div>
        <div className="font-normal text-slate-800">{effectiveDate}</div>

        <div className="text-slate-600 font-normal">Employee Type</div>
        <div className="font-normal text-slate-800">{empType}</div>

        <div className="text-slate-600 font-normal">Site</div>
        <div className="font-normal text-slate-800">{site}</div>

        <div className="text-slate-600 font-normal">Department</div>
        <div className="font-normal text-slate-800">{department}</div>

        <div className="text-slate-600 font-normal">Position</div>
        <div className="font-normal text-slate-800">{designation}</div>

        <div className="text-slate-600 font-normal">Supervisor Name</div>
        <div className="font-normal text-slate-800">{supervisor}</div>

        <div className="text-slate-600 font-normal">Rate</div>
        <div className="flex items-center gap-1.5">
          <span className="font-normal text-slate-800">
            {showRate ? `USD ${salary}` : "USD *****"}
          </span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-[#5b9bd5] text-white leading-tight">Monthly</span>
          <span className="text-[9px] px-1 py-0.2 rounded bg-[#5b9bd5] text-white leading-tight">Gross</span>
          <button
            type="button"
            onClick={onToggleRate}
            className="text-slate-400 hover:text-slate-600 transition-colors cursor-pointer ml-0.5"
          >
            <i className={showRate ? "ri-eye-off-line text-xs" : "ri-eye-line text-xs"} />
          </button>
        </div>
      </div>
    </div>
  );
};
