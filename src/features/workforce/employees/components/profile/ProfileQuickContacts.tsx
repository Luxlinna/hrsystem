import { memo } from "react";
import type { Employee } from "../../types";
import { isPhoneSyntheticEmail } from "@/lib/phoneUtils";

interface ProfileQuickContactsProps {
  employee: Employee;
  hasBiometric: boolean;
}

export const ProfileQuickContacts = memo(function ProfileQuickContacts({
  employee,
  hasBiometric,
}: ProfileQuickContactsProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 pt-4 border-t border-gray-100">
      <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#253C7D] flex items-center justify-center shrink-0 text-sm font-bold">
          <i className="ri-mail-line" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Email</span>
          <p className="text-xs font-semibold text-gray-800 truncate select-all">
            {employee.email && !isPhoneSyntheticEmail(employee.email) ? employee.email : "Not assigned"}
          </p>
        </div>
      </div>

      <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 text-sm font-bold">
          <i className="ri-phone-line" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Phone</span>
          <p className="text-xs font-semibold text-gray-800 truncate select-all">
            {employee.phone || "—"}
          </p>
        </div>
      </div>

      <div className="p-3 bg-gray-50/80 rounded-xl border border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center shrink-0 text-sm font-bold">
          <i className="ri-fingerprint-line" />
        </div>
        <div className="min-w-0">
          <span className="text-[10px] uppercase font-bold text-gray-400 block tracking-wider">Biometrics</span>
          <p className="text-xs font-semibold text-gray-800 truncate">
            {employee.biometric_user_id ? `ID #${employee.biometric_user_id}` : hasBiometric ? "Biometric Only" : "Not Enrolled"}
          </p>
        </div>
      </div>
    </div>
  );
});
