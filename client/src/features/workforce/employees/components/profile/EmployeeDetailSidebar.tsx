import { memo, useRef } from "react";
import type { Employee } from "../../types";
import { DefaultAvatarSvg } from "@/components/DefaultAvatarSvg";
import { formatKhmerFullName } from "../../nameUtils";

interface EmployeeDetailSidebarProps {
  employee: Employee;
  canEdit?: boolean;
  uploadingAvatar?: boolean;
  onUploadAvatar?: (file: File) => Promise<boolean | void>;
}

export const EmployeeDetailSidebar = memo(function EmployeeDetailSidebar({
  employee,
  canEdit = false,
  uploadingAvatar = false,
  onUploadAvatar,
}: EmployeeDetailSidebarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fullName = formatKhmerFullName(employee);

  const honorific =
    employee.title && ["Mr", "Ms", "Mrs", "Miss", "Dr"].includes(employee.title)
      ? employee.title
      : employee.gender?.toLowerCase() === "female"
      ? "Ms"
      : "Mr";

  const positionText =
    employee.position ||
    employee.role ||
    employee.employee_level ||
    "Admin / Accountant";

  const buName =
    employee.bu_full_name ||
    employee.code_bu ||
    employee.branches?.name ||
    (employee as any).company ||
    "";

  const departmentName = employee.department || employee.division || "";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUploadAvatar) {
      onUploadAvatar(file);
    }
  };

  return (
    <div className="w-full lg:w-72 xl:w-80 shrink-0">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-md p-6 text-center flex flex-col items-center">
        {/* Profile Avatar */}
        <div className="relative group mb-3.5">
          <div className="w-36 h-36 sm:w-40 sm:h-40 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center">
            {employee.avatar_url ? (
              <img
                src={employee.avatar_url}
                alt={fullName}
                className="w-full h-full object-cover"
              />
            ) : (
              <DefaultAvatarSvg />
            )}
          </div>

          {canEdit && onUploadAvatar && (
            <>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 rounded-full bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[11px] font-medium transition-opacity cursor-pointer"
                title="Change Photo"
              >
                {uploadingAvatar ? "..." : "Change"}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </>
          )}
        </div>

        {/* Employee Full Name + Honorific Tag */}
        <div className="flex items-center justify-center gap-1.5 flex-wrap">
          <h2 className="text-[15px] font-semibold text-slate-800 dark:text-slate-100 tracking-tight">
            {fullName}
          </h2>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[11px] font-medium border border-slate-200/80 dark:border-slate-700">
            {honorific}
          </span>
        </div>

        {/* Position / Role Subtitle */}
        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-normal mt-0.5">
          {positionText}
        </p>

        {/* Subtle, compact Info Pills */}
        <div className="flex items-center justify-center gap-1.5 mt-3.5 flex-wrap">
          {buName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
              <i className="ri-building-line text-slate-400 text-[11px]" />
              <span className="truncate max-w-[180px]">{buName}</span>
            </span>
          )}

          {departmentName && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200 dark:border-slate-700">
              <i className="ri-team-line text-slate-400 text-[11px]" />
              <span className="truncate max-w-[180px]">{departmentName}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
});

