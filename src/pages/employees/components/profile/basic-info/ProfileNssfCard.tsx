import React from "react";
import type { Employee, EmployeeNssfInfo } from "../../../types";

interface ProfileNssfCardProps {
  employee: Employee;
  form: Partial<Employee>;
  setForm: React.Dispatch<React.SetStateAction<Partial<Employee>>>;
  editing: boolean;
}

export const ProfileNssfCard: React.FC<ProfileNssfCardProps> = ({
  employee,
  form,
  setForm,
  editing,
}) => {
  const currentNssfInfo: EmployeeNssfInfo =
    form.nssf_info ||
    employee.nssf_info ||
    (employee as any).hiring_info?.nssf_info || {};

  const currentCode =
    form.nssf_number ||
    currentNssfInfo.identity_code ||
    employee.nssf_number ||
    "";

  const isEnrolled = Boolean(
    form.register_nssf ?? (currentNssfInfo.register_nssf || currentCode)
  );

  const handleCodeChange = (val: string) => {
    const clean = val.trim();
    const updatedNssf: EmployeeNssfInfo = {
      ...currentNssfInfo,
      identity_code: val,
      register_nssf: clean ? true : isEnrolled,
    };
    setForm({
      ...form,
      nssf_number: val,
      register_nssf: clean ? true : form.register_nssf,
      nssf_info: updatedNssf,
    });
  };

  const handleEnrollToggle = (checked: boolean) => {
    const updatedNssf: EmployeeNssfInfo = {
      ...currentNssfInfo,
      register_nssf: checked,
    };
    setForm({
      ...form,
      register_nssf: checked,
      nssf_info: updatedNssf,
    });
  };

  return (
    <div className="p-3.5 rounded-xl border border-teal-200/80 bg-teal-50/20">
      <span className="text-[10px] font-black uppercase text-teal-700 tracking-wider block mb-1">
        NSSF Identity Code
      </span>

      {editing ? (
        <div className="space-y-1">
          <input
            type="text"
            placeholder="e.g. 10293847"
            value={currentCode}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="w-full px-2 py-1 rounded-lg border border-teal-300 text-xs font-mono font-bold focus:outline-none focus:border-teal-600 bg-white"
          />
          <label className="flex items-center gap-1.5 text-[10px] text-slate-600 cursor-pointer pt-0.5">
            <input
              type="checkbox"
              checked={isEnrolled}
              onChange={(e) => handleEnrollToggle(e.target.checked)}
              className="rounded text-teal-700 cursor-pointer"
            />
            <span>Register in NSSF</span>
          </label>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold text-teal-900 font-mono">
            {currentCode || (isEnrolled ? "Enrolled (Pending Code)" : "Pending Registration")}
          </p>
          <div className="flex items-center gap-1 mt-1">
            <span
              className={`inline-block text-[9px] font-bold px-1.5 py-0.2 rounded ${
                currentCode
                  ? "bg-teal-100 text-teal-800"
                  : isEnrolled
                  ? "bg-blue-100 text-blue-800"
                  : "bg-slate-200 text-slate-700"
              }`}
            >
              {currentCode ? "Active MLVT" : isEnrolled ? "Enrolled" : "Not Linked"}
            </span>
            {currentNssfInfo.joining_date && (
              <span className="text-[9px] text-slate-400 font-medium">
                {currentNssfInfo.joining_date}
              </span>
            )}
          </div>
        </>
      )}
    </div>
  );
};
