import { memo, useState, useRef, useEffect } from "react";
import type { LeaveRequest } from "../../types";

interface LeaveRowActionsDropdownProps {
  request: LeaveRequest;
  canAct: boolean;
  actionLabel: string;
  canCancel: boolean;
  canDelete?: boolean;
  onInspect: (req: LeaveRequest) => void;
  onApprove: (req: LeaveRequest) => void;
  onReject: (req: LeaveRequest) => void;
  onCancel: (req: LeaveRequest) => void;
  onDelete?: (req: LeaveRequest) => void;
}

export const LeaveRowActionsDropdown = memo(function LeaveRowActionsDropdown({
  request,
  canAct,
  actionLabel,
  canCancel,
  canDelete = false,
  onInspect,
  onApprove,
  onReject,
  onCancel,
  onDelete,
}: LeaveRowActionsDropdownProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClick);
    }
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center gap-1 px-2 py-1 border border-sky-300 bg-white hover:bg-sky-50 text-sky-600 rounded-md text-xs font-medium shadow-2xs transition-colors cursor-pointer"
        title="Actions"
      >
        <i className="ri-settings-3-line text-sm" />
        <i className={`ri-arrow-down-s-fill text-[10px] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute right-0 mt-1 w-44 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50 animate-in fade-in zoom-in-95 duration-100">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onInspect(request);
            }}
            className="w-full px-3 py-1.5 text-left text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-2 cursor-pointer font-medium"
          >
            <i className="ri-eye-line text-sky-600 text-sm" />
            <span>View Details</span>
          </button>

          {canAct && (
            <>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onApprove(request);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-emerald-700 hover:bg-emerald-50 flex items-center gap-2 cursor-pointer font-semibold"
              >
                <i className="ri-checkbox-circle-line text-emerald-600 text-sm" />
                <span>{actionLabel || "Approve"}</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  onReject(request);
                }}
                className="w-full px-3 py-1.5 text-left text-xs text-rose-700 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-semibold"
              >
                <i className="ri-close-circle-line text-rose-600 text-sm" />
                <span>Reject</span>
              </button>
            </>
          )}

          {canCancel && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onCancel(request);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-amber-700 hover:bg-amber-50 flex items-center gap-2 cursor-pointer font-medium border-t border-gray-100"
            >
              <i className="ri-indeterminate-circle-line text-amber-600 text-sm" />
              <span>Cancel Request</span>
            </button>
          )}

          {canDelete && onDelete && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onDelete(request);
              }}
              className="w-full px-3 py-1.5 text-left text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2 cursor-pointer font-medium border-t border-gray-100"
            >
              <i className="ri-delete-bin-line text-rose-500 text-sm" />
              <span>Delete Request</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
});
