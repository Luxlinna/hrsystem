import { memo, useState } from "react";
import type { Employee } from "../../../types";
import { formatDMY } from "../../../dateUtils";

interface Props {
  employee: Employee;
}

export const ProfileEducationTrainingAndWorkSection = memo(function ProfileEducationTrainingAndWorkSection({
  employee,
}: Props) {
  const [showWorkPrivacy, setShowWorkPrivacy] = useState(false);

  const educationHistory = employee.education_history || [];
  const trainingHistory = employee.training_history || [];
  const employmentHistory = employee.employment_history || [];

  return (
    <div className="space-y-6 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* 1. Education History Info */}
      <div>
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2.5">
          EDUCATION HISTORY INFO
        </h3>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-3">Institue</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Degree</th>
                <th className="py-2 px-3">Start Date</th>
                <th className="py-2 px-3">End Date</th>
                <th className="py-2 px-3">Remark</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {educationHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Education Histories
                  </td>
                </tr>
              ) : (
                educationHistory.map((edu, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-3">{edu.institue || "-"}</td>
                    <td className="py-2 px-3">{edu.subject || "-"}</td>
                    <td className="py-2 px-3">{edu.degree || "-"}</td>
                    <td className="py-2 px-3">{formatDMY(edu.start_date)}</td>
                    <td className="py-2 px-3">{formatDMY(edu.end_date)}</td>
                    <td className="py-2 px-3">{edu.remark || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Tranning History Info */}
      <div>
        <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider mb-2.5">
          TRANNING HISTORY INFO
        </h3>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[600px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-3">Institue</th>
                <th className="py-2 px-3">Subject</th>
                <th className="py-2 px-3">Start Date</th>
                <th className="py-2 px-3">End Date</th>
                <th className="py-2 px-3">Remark</th>
                <th className="py-2 px-3">Attachment</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {trainingHistory.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Tranning Histories
                  </td>
                </tr>
              ) : (
                trainingHistory.map((tr, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-3">{tr.institue || "-"}</td>
                    <td className="py-2 px-3">{tr.subject || "-"}</td>
                    <td className="py-2 px-3">{formatDMY(tr.start_date)}</td>
                    <td className="py-2 px-3">{formatDMY(tr.end_date)}</td>
                    <td className="py-2 px-3">{tr.remark || "-"}</td>
                    <td className="py-2 px-3">{tr.attachment || "-"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. Employment History Info */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h3 className="text-[13px] font-bold text-sky-600 dark:text-sky-400 uppercase tracking-wider">
            EMPLOYMENT HISTORY INFO
          </h3>
          <button
            type="button"
            onClick={() => setShowWorkPrivacy((prev) => !prev)}
            className="border border-sky-400 text-sky-600 dark:text-sky-400 text-xs px-3 py-0.5 rounded-full font-medium hover:bg-sky-50 dark:hover:bg-sky-950/40 cursor-pointer"
          >
            {showWorkPrivacy ? "Hide Privacy" : "Show Privacy"}
          </button>
        </div>

        <div className="border border-slate-200 dark:border-slate-800 rounded-sm overflow-x-auto">
          <table className="w-full text-[13px] text-left min-w-[700px]">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
              <tr>
                <th className="py-2 px-3 w-12 text-center">No.</th>
                <th className="py-2 px-3">Company Name</th>
                <th className="py-2 px-3">Start Date</th>
                <th className="py-2 px-3">End Date</th>
                <th className="py-2 px-3">Position</th>
                <th className="py-2 px-3">Supervisor Name</th>
                <th className="py-2 px-3">Supervisor phone number</th>
                <th className="py-2 px-3">Remark</th>
                <th className="py-2 px-3">Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
              {employmentHistory.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-3 text-center text-[13px] text-slate-500">
                    Empty Employment Histories
                  </td>
                </tr>
              ) : (
                employmentHistory.map((work, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                    <td className="py-2 px-3 text-center">{idx + 1}</td>
                    <td className="py-2 px-3">{work.company_name || "-"}</td>
                    <td className="py-2 px-3">{formatDMY(work.start_date)}</td>
                    <td className="py-2 px-3">{formatDMY(work.end_date)}</td>
                    <td className="py-2 px-3">{work.designation || "-"}</td>
                    <td className="py-2 px-3">{work.supervisor_name || "-"}</td>
                    <td className="py-2 px-3">
                      {showWorkPrivacy ? work.supervisor_phone_number || "-" : "*****"}
                    </td>
                    <td className="py-2 px-3">{work.remark || "-"}</td>
                    <td className="py-2 px-3">
                      {showWorkPrivacy ? work.rate || "-" : "*****"}
                    </td>
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
