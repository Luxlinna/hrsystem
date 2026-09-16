import { memo } from "react";
import type { EmployeeAchievementItem } from "../../../types";

interface Props {
  ach: EmployeeAchievementItem;
}

export const ProfileAchievementViewCard = memo(function ProfileAchievementViewCard({
  ach,
}: Props) {
  return (
    <div className="p-4 border border-amber-200/80 rounded-xl bg-amber-50/20 hover:bg-amber-50/40 transition-colors flex flex-col justify-between">
      <div>
        <div className="flex items-start justify-between gap-2">
          <span className="text-xs font-bold text-slate-900">{ach.title}</span>
          {ach.year_awarded && (
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-900">
              {ach.year_awarded}
            </span>
          )}
        </div>
        {ach.program_name && (
          <p className="text-xs text-[#253C7D] font-bold mt-1">{ach.program_name}</p>
        )}
        {ach.organizer_name && (
          <p className="text-[11px] text-slate-500 mt-0.5">
            Organizer: {ach.organizer_name} {ach.country ? `· ${ach.country}` : ""}
          </p>
        )}
        {ach.remark && (
          <p className="text-[11px] text-slate-600 italic mt-1.5">{ach.remark}</p>
        )}
      </div>

      {ach.attachment && (
        <div className="pt-2 mt-2 border-t border-amber-100">
          <a
            href={ach.attachment}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-[#253C7D] hover:underline inline-flex items-center gap-1"
          >
            <i className="ri-attachment-line text-sm" />
            <span>View Certificate / Evidence &rarr;</span>
          </a>
        </div>
      )}
    </div>
  );
});
