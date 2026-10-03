import { memo, useState } from "react";
import type { Employee } from "../../../types";

interface Props {
  employee: Employee;
}

export const ProfileEmergencyAndFamilySection = memo(function ProfileEmergencyAndFamilySection({
  employee,
}: Props) {
  const [showEmergencyPrivacy, setShowEmergencyPrivacy] = useState(false);
  const [showFamilyPrivacy, setShowFamilyPrivacy] = useState(false);

  const emergencyContacts = employee.emergency_contacts || [];
  const familyMembers = employee.family_members || [];

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* 1. Emergency Contacts */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            EMERGENCY CONTACTS
          </h3>
          <button
            type="button"
            onClick={() => setShowEmergencyPrivacy((prev) => !prev)}
            className="border border-sky-400 text-sky-600 dark:text-sky-400 text-xs px-3 py-0.5 rounded-full font-medium hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
          >
            {showEmergencyPrivacy ? "Hide Privacy" : "Show Privacy"}
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-4">Contact Person</th>
                <th className="py-2 px-4">Relationship</th>
                <th className="py-2 px-4">Phone Number</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {emergencyContacts.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Emergency Contacts
                  </td>
                </tr>
              ) : (
                emergencyContacts.map((c, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-4">{c.contact_person || "-"}</td>
                    <td className="py-2 px-4">{c.relationship || "-"}</td>
                    <td className="py-2 px-4">
                      {showEmergencyPrivacy ? c.phone_number || "-" : "*****"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Family Member Info */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            FAMILY MEMBER INFO
          </h3>
          <button
            type="button"
            onClick={() => setShowFamilyPrivacy((prev) => !prev)}
            className="border border-sky-400 text-sky-600 dark:text-sky-400 text-xs px-3 py-0.5 rounded-full font-medium hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
          >
            {showFamilyPrivacy ? "Hide Privacy" : "Show Privacy"}
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-3">Name</th>
                <th className="py-2 px-3">Relationship</th>
                <th className="py-2 px-3">Date of Birth</th>
                <th className="py-2 px-3">Gender</th>
                <th className="py-2 px-3">Nationality</th>
                <th className="py-2 px-3">Tax Filing</th>
                <th className="py-2 px-3">Phone Number</th>
                <th className="py-2 px-3">Remark</th>
                <th className="py-2 px-3">Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {familyMembers.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Family Members
                  </td>
                </tr>
              ) : (
                familyMembers.map((f, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-3">{f.name || "-"}</td>
                    <td className="py-2 px-3">{f.relationship || "-"}</td>
                    <td className="py-2 px-3">
                      {showFamilyPrivacy ? f.date_of_birth || "-" : "*****"}
                    </td>
                    <td className="py-2 px-3">{f.gender || "-"}</td>
                    <td className="py-2 px-3">{f.nationality || "-"}</td>
                    <td className="py-2 px-3">{f.tax_filing ? "Yes" : "No"}</td>
                    <td className="py-2 px-3">
                      {showFamilyPrivacy ? f.phone_number || "-" : "*****"}
                    </td>
                    <td className="py-2 px-3">{f.remark || "-"}</td>
                    <td className="py-2 px-3">{f.attachment || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
});
