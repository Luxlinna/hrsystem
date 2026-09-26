import { useState, useRef, useEffect, memo } from "react";

export interface ContextMenuTarget {
  empId: string;
  empName: string;
  employeeCode: string;
  dateString: string;
  dayNumber: number;
  currentCode: string;
  status?: string;
  clockIn?: string | null;
  clockOut?: string | null;
}

interface ScheduleMatrixContextMenuProps {
  position: { x: number; y: number } | null;
  target: ContextMenuTarget | null;
  onClose: () => void;
  onChangeShift: () => void;
  onViewAttendanceLog: () => void;
  onCreateLeave: (mode: "self" | "for_employee") => void;
  onCreateMission: (mode: "self" | "for_employee") => void;
}

export const ScheduleMatrixContextMenu = memo(function ScheduleMatrixContextMenu({
  position,
  target,
  onClose,
  onChangeShift,
  onViewAttendanceLog,
  onCreateLeave,
  onCreateMission,
}: ScheduleMatrixContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<"leave" | "mission" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, [onClose]);

  if (!position || !target) return null;

  // Ensure menu doesn't overflow screen
  const menuX = Math.min(position.x, window.innerWidth - 320);
  const menuY = Math.min(position.y, window.innerHeight - 280);

  return (
    <div
      ref={menuRef}
      style={{ left: `${menuX}px`, top: `${menuY}px` }}
      className="fixed z-50 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-56 text-xs text-gray-700 animate-in fade-in-50 zoom-in-95 duration-75 select-none"
    >
      {/* 1. View Attendance Log */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onViewAttendanceLog();
        }}
        className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
      >
        <i className="ri-eye-line text-sm text-gray-500" />
        <span className="font-medium">View Attendance Log</span>
      </button>

      {/* 2. Change Day Shift */}
      <button
        type="button"
        onClick={() => {
          onClose();
          onChangeShift();
        }}
        className="flex items-center gap-2.5 w-full px-3.5 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
      >
        <i className="ri-edit-line text-sm text-gray-500" />
        <span className="font-medium">Change Day Shift</span>
      </button>

      <div className="border-t border-gray-100 my-1" />

      {/* 3. Leave with Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu("leave")}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="flex items-center justify-between w-full px-3.5 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <i className="ri-calendar-event-line text-sm text-gray-500" />
            <span className="font-medium">Leave</span>
          </div>
          <i className="ri-arrow-right-s-line text-gray-400 text-sm" />
        </button>

        {activeSubmenu === "leave" && (
          <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 text-xs animate-in fade-in-50 zoom-in-95 duration-75">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateLeave("self");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer"
            >
              <i className="ri-add-line text-sm text-blue-600" />
              <span>Create Leave</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateLeave("for_employee");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer truncate"
            >
              <i className="ri-user-shared-line text-sm text-indigo-600" />
              <span className="truncate">Create Leave Request for...</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. Mission with Submenu */}
      <div
        className="relative"
        onMouseEnter={() => setActiveSubmenu("mission")}
        onMouseLeave={() => setActiveSubmenu(null)}
      >
        <button
          type="button"
          className="flex items-center justify-between w-full px-3.5 py-2 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left cursor-pointer"
        >
          <div className="flex items-center gap-2.5">
            <i className="ri-flight-takeoff-line text-sm text-gray-500" />
            <span className="font-medium">Mission</span>
          </div>
          <i className="ri-arrow-right-s-line text-gray-400 text-sm" />
        </button>

        {activeSubmenu === "mission" && (
          <div className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 text-xs animate-in fade-in-50 zoom-in-95 duration-75">
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateMission("self");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer"
            >
              <i className="ri-add-line text-sm text-emerald-600" />
              <span>Create Mission</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onCreateMission("for_employee");
              }}
              className="flex items-center gap-2 w-full px-3 py-2 hover:bg-blue-50 hover:text-blue-700 text-left cursor-pointer truncate"
            >
              <i className="ri-user-shared-line text-sm text-teal-600" />
              <span className="truncate">Create Mission Request for...</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
});
