import { memo } from "react";
import type { Enrollment } from "../../types";
import { initials, formatDate } from "../../trainingUtils";

interface CertificateCardProps {
  enrollment: Enrollment;
}

export const CertificateCard = memo(function CertificateCard({
  enrollment,
}: CertificateCardProps) {
  const emp = enrollment.employees;
  const course = enrollment.training_courses;
  const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";

  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between relative overflow-hidden group">
      {/* Decorative Gold Certificate Badge Icon */}
      <div className="absolute -right-3 -top-3 w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center text-3xl opacity-50 group-hover:scale-110 transition-transform">
        <i className="ri-award-fill" />
      </div>

      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-amber-700">
          <i className="ri-medal-line text-sm" />
          Official Credential
        </div>

        <div>
          <h3 className="text-sm font-bold text-gray-900 leading-snug">{course?.title || "Training Program"}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{course?.category || "General"}</p>
        </div>

        <div className="flex items-center gap-2.5 pt-2 border-t border-gray-50">
          {emp?.avatar_url ? (
            <img
              src={emp.avatar_url}
              alt={empName}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center">
              {initials(emp?.first_name, emp?.last_name)}
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-800">{empName}</p>
            <p className="text-[10px] text-gray-400">
              Completed on {formatDate(enrollment.completed_at || enrollment.enrolled_at)}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-gray-50 flex items-center justify-between text-xs">
        <span className="text-[10px] text-gray-400 font-mono">ID: {enrollment.id.substring(0, 8)}</span>
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600">
          <i className="ri-checkbox-circle-fill text-xs" />
          Verified
        </span>
      </div>
    </div>
  );
});
