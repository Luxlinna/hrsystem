import { useState, useEffect } from "react";
import type { SetUpPhoneAccountModalProps, SuccessData } from "./phone-account/types";
import { SetUpPhoneAccountForm } from "./phone-account/SetUpPhoneAccountForm";
import { SetUpPhoneAccountSuccess } from "./phone-account/SetUpPhoneAccountSuccess";

export function SetUpPhoneAccountModal({
  employee,
  roles,
  isOpen,
  onClose,
  onSubmit,
}: SetUpPhoneAccountModalProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string>("");
  const [successData, setSuccessData] = useState<SuccessData | null>(null);

  useEffect(() => {
    if (isOpen && employee) {
      setSuccessData(null);
      const matchedRole = roles.find(
        (r) => r.name.toLowerCase() === (employee.role || "staff").toLowerCase()
      );
      if (matchedRole) {
        setSelectedRoleId(String(matchedRole.id));
      } else if (roles.length > 0) {
        const staffRole = roles.find((r) => r.name.toLowerCase() === "staff");
        setSelectedRoleId(staffRole ? String(staffRole.id) : String(roles[0].id));
      }
    }
  }, [isOpen, employee, roles]);

  if (!isOpen || !employee) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-800 rounded-lg max-w-lg w-full shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50/80 dark:bg-slate-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-[#253C7D] text-white flex items-center justify-center text-sm shadow-2xs">
              <i className={successData ? "ri-checkbox-circle-line" : "ri-user-settings-line"} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">
                {successData ? "User Account Configured" : "Update User Account"}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {successData
                  ? "Access credentials ready to deliver"
                  : "Configure access role and authentication method"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 dark:hover:bg-slate-700 flex items-center justify-center transition-colors cursor-pointer"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {/* Content View */}
        {successData ? (
          <SetUpPhoneAccountSuccess successData={successData} onClose={onClose} />
        ) : (
          <SetUpPhoneAccountForm
            employee={employee}
            roles={roles}
            selectedRoleId={selectedRoleId}
            setSelectedRoleId={setSelectedRoleId}
            onSubmit={onSubmit}
            onSuccess={setSuccessData}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  );
}
