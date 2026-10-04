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
  onViewAttendanceLog: () => void;
  onCreateLeave: (mode: "self" | "for_employee") => void;
  onCreateMission: (mode: "self" | "for_employee") => void;
}

export const ScheduleMatrixContextMenu = memo(function ScheduleMatrixContextMenu({
  position,
  target,
  onClose,
  onViewAttendanceLog,
  onCreateLeave,
  onCreateMission,
}: ScheduleMatrixContextMenuProps) {
  const [activeSubmenu, setActiveSubmenu] = useState<"leave" | "mission" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const leaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    };
  }, []);

  const handleMouseEnter = (menu: "leave" | "mission") => {
    if (leaveTimerRef.current) {
      clearTimeout(leaveTimerRef.current);
      leaveTimerRef.current = null;
    }
    setActiveSubmenu(menu);
  };

  const handleMouseLeave = () => {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    leaveTimerRef.current = setTimeout(() => {
      setActiveSubmenu(null);
    }, 250);
  };

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
  const menuX = Math.min(position.x, window.innerWidth - 240);
  const menuY = Math.min(position.y, window.innerHeight - 280);
  const opensLeft = menuX + 224 + 215 > window.innerWidth;

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

      <div className="border-t border-gray-100 my-1" />

      {/* 2. Leave with Submenu */}
      <div
        className="relative"
        onMouseEnter={() => handleMouseEnter("leave")}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => setActiveSubmenu(activeSubmenu === "leave" ? null : "leave")}
          className={`flex items-center justify-between w-full px-3.5 py-2 transition-colors text-left cursor-pointer ${
            activeSubmenu === "leave"
              ? "bg-blue-50 text-blue-700 font-semibold"
              : "hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i className="ri-calendar-event-line text-sm text-gray-500" />
            <span className="font-medium">Leave</span>
          </div>
          <i
            className={`text-sm ${
              activeSubmenu === "leave"
                ? "ri-arrow-down-s-line text-blue-600"
                : "ri-arrow-right-s-line text-gray-400"
            }`}
          />
        </button>

        {activeSubmenu === "leave" && (
          <div
            onMouseEnter={() => handleMouseEnter("leave")}
            onMouseLeave={handleMouseLeave}
            className={`absolute ${
              opensLeft ? "right-full mr-1 before:-right-3" : "left-full ml-1 before:-left-3"
            } top-0 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 text-xs animate-in fade-in-50 zoom-in-95 duration-75 z-50 before:absolute before:top-0 before:bottom-0 before:w-3 before:content-['']`}
          >
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

      {/* 3. Mission with Submenu */}
      <div
        className="relative"
        onMouseEnter={() => handleMouseEnter("mission")}
        onMouseLeave={handleMouseLeave}
      >
        <button
          type="button"
          onClick={() => setActiveSubmenu(activeSubmenu === "mission" ? null : "mission")}
          className={`flex items-center justify-between w-full px-3.5 py-2 transition-colors text-left cursor-pointer ${
            activeSubmenu === "mission"
              ? "bg-blue-50 text-blue-700 font-semibold"
              : "hover:bg-blue-50 hover:text-blue-700"
          }`}
        >
          <div className="flex items-center gap-2.5">
            <i className="ri-flight-takeoff-line text-sm text-gray-500" />
            <span className="font-medium">Mission</span>
          </div>
          <i
            className={`text-sm ${
              activeSubmenu === "mission"
                ? "ri-arrow-down-s-line text-blue-600"
                : "ri-arrow-right-s-line text-gray-400"
            }`}
          />
        </button>

        {activeSubmenu === "mission" && (
          <div
            onMouseEnter={() => handleMouseEnter("mission")}
            onMouseLeave={handleMouseLeave}
            className={`absolute ${
              opensLeft ? "right-full mr-1 before:-right-3" : "left-full ml-1 before:-left-3"
            } top-0 bg-white border border-gray-200 rounded-xl shadow-xl py-1 w-52 text-xs animate-in fade-in-50 zoom-in-95 duration-75 z-50 before:absolute before:top-0 before:bottom-0 before:w-3 before:content-['']`}
          >
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
