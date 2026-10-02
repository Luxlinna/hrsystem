import { memo } from "react";

interface MobileQuickShortcutsCardProps {
  onNavigateTab: (tab: string) => void;
  onNavigatePath: (path: string) => void;
  canAnnouncements: boolean;
  canPerformance: boolean;
  canEmployees: boolean;
}

export const MobileQuickShortcutsCard = memo(function MobileQuickShortcutsCard({
  onNavigateTab,
  onNavigatePath,
  canAnnouncements,
  canPerformance,
  canEmployees,
}: MobileQuickShortcutsCardProps) {
  const quickShortcuts = [
    { id: "leave", label: "Ask Leave", icon: "ri-calendar-event-line", action: () => onNavigateTab("leave"), hasDot: false },
    { id: "attendance", label: "Attendance", icon: "ri-fingerprint-line", action: () => onNavigateTab("attendance"), hasDot: false },
    { id: "announcements", label: "Announcement", icon: "ri-megaphone-line", action: () => onNavigatePath("/announcements"), hasDot: true },
    { id: "meeting-rooms", label: "Booking Room", icon: "ri-door-open-line", action: () => onNavigatePath("/meeting-rooms"), hasDot: false },
    { id: "training", label: "Training", icon: "ri-graduation-cap-line", action: () => onNavigatePath("/training"), hasDot: false },
    { id: "assignments", label: "Assignments", icon: "ri-edit-box-line", action: () => onNavigateTab("daily-report"), hasDot: true },
  ];

  return (
    <div className="bg-white rounded-[24px] border border-[#E7ECF5] shadow-[0_4px_20px_rgba(37,60,125,0.04)] grid grid-cols-3 divide-x divide-y divide-[#EDF2FA] overflow-hidden">
      {quickShortcuts.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={item.action}
          className="flex flex-col items-center justify-center py-4 px-2 hover:bg-[#F5F8FD] transition-colors text-center cursor-pointer group active:scale-95"
        >
          <div className="w-11 h-11 rounded-2xl bg-[#EEF3FA] flex items-center justify-center text-xl text-[#253C7D] mb-2 transition-transform group-hover:scale-105 relative">
            <i className={item.icon} />
            {item.hasDot && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5C77] rounded-full ring-1 ring-white" />
            )}
          </div>
          <span className="text-[11.5px] font-semibold text-[#14234B] group-hover:text-[#253C7D] transition-colors flex items-center gap-1">
            {item.label}
            {item.hasDot && <span className="w-1 h-1 rounded-full bg-[#FF5C77]" />}
          </span>
        </button>
      ))}
    </div>
  );
});
