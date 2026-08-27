import { memo } from "react";
import type { Enrollment } from "../../types";
import { ENROLL_STATUS_CONFIG } from "../../constants";
import { initials, formatDate } from "../../trainingUtils";

interface EnrollmentTableRowProps {
  enrollment: Enrollment;
  canManage: boolean;
  onUpdate: (id: string, updates: Partial<Enrollment>) => void;
  onDelete: (e: Enrollment) => void;
}

export const EnrollmentTableRow = memo(function EnrollmentTableRow({
  enrollment,
  canManage,
  onUpdate,
  onDelete,
}: EnrollmentTableRowProps) {
  const emp = enrollment.employees;
  const course = enrollment.training_courses;
  const empName = emp ? `${emp.first_name} ${emp.last_name}` : "Unknown Staff";
  const stConfig = ENROLL_STATUS_CONFIG[enrollment.status] || ENROLL_STATUS_CONFIG.enrolled;

  return (
    <tr className="hover:bg-slate-50/80 transition-colors text-xs">
      {/* Learner */}
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="flex items-center gap-2.5">
          {emp?.avatar_url ? (
            <img
              src={emp.avatar_url}
              alt={empName}
              className="w-7 h-7 rounded-full object-cover ring-1 ring-gray-200 shrink-0"
            />
          ) : (
            <div className="w-7 h-7 rounded-full bg-[#253C7D] text-white text-[9px] font-bold flex items-center justify-center shrink-0">
              {initials(emp?.first_name, emp?.last_name)}
            </div>
          )}
          <div>
            <p className="font-bold text-gray-900">{empName}</p>
            <p className="text-[10px] text-gray-400">{emp?.department || "General"}</p>
          </div>
        </div>
      </td>

      {/* Course Title */}
      <td className="px-4 py-3">
        <p className="font-semibold text-gray-800">{course?.title || "—"}</p>
        <p className="text-[10px] text-gray-400">{course?.category || "General"}</p>
      </td>

      {/* Status */}
      <td className="px-4 py-3 whitespace-nowrap">
        {canManage ? (
          <select
            value={enrollment.status}
            onChange={(e) =>
              onUpdate(enrollment.id, {
                status: e.target.value as Enrollment["status"],
                completed_at: e.target.value === "completed" ? new Date().toISOString() : null,
                progress: e.target.value === "completed" ? 100 : enrollment.progress,
              })
            }
            className="px-2.5 py-1 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-gray-700 focus:outline-none cursor-pointer"
          >
            <option value="enrolled">Enrolled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
            <option value="dropped">Dropped</option>
          </select>
        ) : (
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold ${stConfig.color}`}
          >
            {stConfig.label}
          </span>
        )}
      </td>

      {/* Progress Slider / Bar */}
      <td className="px-4 py-3 min-w-[140px]">
        <div className="flex items-center gap-2">
          <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all ${
                enrollment.status === "completed" ? "bg-emerald-500" : "bg-[#253C7D]"
              }`}
              style={{ width: `${enrollment.progress}%` }}
            />
          </div>
          <span className="text-[11px] font-bold text-gray-700 w-8 text-right">
            {enrollment.progress}%
          </span>
        </div>
      </td>

      {/* Due Date */}
      <td className="px-4 py-3 whitespace-nowrap text-gray-500">
        {formatDate(enrollment.due_date)}
      </td>

      {/* Certificate Issued Checkbox */}
      <td className="px-4 py-3 whitespace-nowrap text-center">
        {canManage ? (
          <input
            type="checkbox"
            checked={enrollment.certificate_issued}
            onChange={(e) =>
              onUpdate(enrollment.id, { certificate_issued: e.target.checked })
            }
            className="w-4 h-4 rounded text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
          />
        ) : enrollment.certificate_issued ? (
          <span className="text-emerald-600 font-bold">
            <i className="ri-award-fill text-sm" />
          </span>
        ) : (
          <span className="text-gray-300">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="px-4 py-3 whitespace-nowrap text-right">
        {canManage && (
          <button
            onClick={() => onDelete(enrollment)}
            title="Delete enrollment"
            className="p-1 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition-colors"
          >
            <i className="ri-delete-bin-line text-sm" />
          </button>
        )}
      </td>
    </tr>
  );
});
