import React from "react";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";

interface DetailEmployeeInfoProps {
  emp: any;
  fullName: string;
  employeeCode: string;
  designation: string;
  department: string;
  supervisorName: string;
  employmentType: string;
  contractType: string;
  siteName: string;
  joiningDate: string;
  salary: string | number;
  showRate: boolean;
  onToggleRate: () => void;
}

export const DetailEmployeeInfo: React.FC<DetailEmployeeInfoProps> = ({
  emp,
  fullName,
  employeeCode,
  designation,
  department,
  supervisorName,
  employmentType,
  contractType,
  siteName,
  joiningDate,
  salary,
  showRate,
  onToggleRate,
}) => {
  return (
    <div>
      <h2 className="text-xs font-bold text-[#29ABE2] uppercase tracking-wider mb-4">
        EMPLOYEE INFO
      </h2>

      <div className="flex flex-col md:flex-row items-start gap-6 pt-1">
        <div className="flex flex-col items-center justify-center shrink-0 w-24">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 shadow-xs flex items-center justify-center bg-slate-100">
            {emp?.avatar_url ? (
              <img src={emp.avatar_url} alt={fullName} className="w-full h-full object-cover" />
            ) : (
              <DefaultAvatarSvg className="w-full h-full" />
            )}
          </div>
          <span className="inline-block text-[10px] font-medium px-2.5 py-0.5 rounded-[2px] bg-[#2ecc71] text-white leading-tight whitespace-nowrap mt-2.5">
            Employed
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 flex-1 text-xs">
          <div className="space-y-3">
            <div>
              <p className="font-semibold text-slate-800 text-xs">{fullName}</p>
            </div>
            <div>
              <p className="font-normal text-slate-800 text-xs">{employeeCode}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Employee Code</p>
            </div>
            <div>
              <p className="font-normal text-slate-800 text-xs">{designation}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Position</p>
            </div>
            <div>
              <p className="font-normal text-slate-800 text-xs">{department}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Department</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-normal text-slate-800 text-xs">{supervisorName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Supervisor</p>
            </div>
            <div>
              <p className="font-normal text-slate-800 text-xs">{employmentType}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Employee Type</p>
            </div>
            <div>
              <p className="font-normal text-slate-800 text-xs">{contractType}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Contract Type</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="font-normal text-slate-800 text-xs">{siteName}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Site</p>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-normal text-slate-800 text-xs">
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
              <p className="text-[10px] text-slate-400 mt-0.5">Rate</p>
            </div>
            <div>
              <p className="font-normal text-slate-800 text-xs">{joiningDate}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Joining Date</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
