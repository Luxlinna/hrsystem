import { memo } from "react";
import type { MyEmployee } from "../types";
import { STATUS_STYLES } from "../constants";
import { isPhoneSyntheticEmail, syntheticEmailToPhone, formatDisplayPhone } from "@/lib/phoneUtils";
import { formatDMY } from "@/features/workforce/employees/dateUtils";

interface ProfileJobDetailsCardProps {
  employee: MyEmployee | null;
  employeeLoading: boolean;
  tenure: number | null;
  email?: string;
}

export const ProfileJobDetailsCard = memo(function ProfileJobDetailsCard({
  employee,
  employeeLoading,
  tenure,
  email,
}: ProfileJobDetailsCardProps) {
  return (
    <div className="pt-2 border-t border-gray-100">
      <label className="text-[12px] font-bold text-gray-900 uppercase tracking-wider flex items-center gap-1.5 mb-3">
        <i className="ri-briefcase-line text-[#253C7D] text-sm" />
        Job Details
      </label>
      {employeeLoading ? (
        <p className="text-[13px] text-gray-400 mt-1.5 flex items-center gap-1.5">
          <i className="ri-loader-4-line animate-spin" /> Loading job details...
        </p>
      ) : employee ? (
        <div className="border border-gray-100 rounded-2xl divide-y divide-gray-50 overflow-hidden shadow-2xs">
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            <span className="text-[12px] text-gray-500">Job Title</span>
            <span className="text-[13px] font-medium text-gray-900 text-right">
              {employee.role || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            <span className="text-[12px] text-gray-500">Department</span>
            <span className="text-[13px] font-medium text-gray-900 text-right">
              {employee.department || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            <span className="text-[12px] text-gray-500">Branch</span>
            <span className="text-[13px] font-medium text-gray-900 text-right">
              {employee.branches?.name || "—"}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            <span className="text-[12px] text-gray-500">Status</span>
            <span
              className={`text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${
                STATUS_STYLES[employee.status] || "bg-gray-100 text-gray-500"
              }`}
            >
              {employee.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-white">
            <span className="text-[12px] text-gray-500">Joined</span>
            <span className="text-[13px] font-medium text-gray-900 text-right">
              {formatDMY(employee.join_date)}
              {tenure !== null && (
                <span className="text-gray-400">
                  {" "}
                  &middot; {tenure} yr{tenure !== 1 ? "s" : ""}
                </span>
              )}
            </span>
          </div>
          {employee.candidate_code && (
            <div className="flex items-center justify-between px-4 py-3 bg-blue-50/50">
              <span className="text-[12px] text-gray-600 flex items-center gap-1.5 font-medium">
                <i className="ri-fingerprint-line text-[#253C7D]"></i>
                Candidate ID
              </span>
              <span className="text-[12px] font-bold text-[#253C7D] font-mono px-2 py-0.5 bg-white border border-blue-200/60 rounded">
                {employee.candidate_code}
              </span>
            </div>
          )}
          {employee.location && (
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-[12px] text-gray-500">Location</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {employee.location}
              </span>
            </div>
          )}
          {employee.notice_period && (
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-[12px] text-gray-500">Notice Period</span>
              <span className="text-[13px] font-medium text-gray-900 text-right">
                {employee.notice_period}
              </span>
            </div>
          )}
          {employee.resume_url && (
            <div className="flex items-center justify-between px-4 py-3 bg-white">
              <span className="text-[12px] text-gray-500">Resume / CV</span>
              <a
                href={employee.resume_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[12px] font-semibold text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-1"
              >
                <i className="ri-file-pdf-line"></i> View CV
              </a>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[13px] text-gray-400 mt-1.5">
          We couldn't find an employee record matching your account{" "}
          {isPhoneSyntheticEmail(email) ? "phone" : "email"} (
          {isPhoneSyntheticEmail(email)
            ? formatDisplayPhone(syntheticEmailToPhone(email))
            : email}
          ).
        </p>
      )}
    </div>
  );
});
