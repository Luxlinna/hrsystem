import { memo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import type { ComplaintSuggestion } from "../types";

interface ComplaintRowMenuProps {
  isOpen: boolean;
  onClose: () => void;
  buttonRef: React.RefObject<HTMLButtonElement | null>;
  record: ComplaintSuggestion;
  onView: (record: ComplaintSuggestion) => void;
  onEdit: (record: ComplaintSuggestion) => void;
  onDelete: (id: string) => void;
  onPreview: (url: string, name: string) => void;
}

export const ComplaintRowMenu = memo(function ComplaintRowMenu({
  isOpen,
  onClose,
  buttonRef,
  record,
  onView,
  onEdit,
  onDelete,
  onPreview,
}: ComplaintRowMenuProps) {
  const [coords, setCoords] = useState<{ top?: number; bottom?: number; right: number } | null>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const right = window.innerWidth - rect.right;
      if (spaceBelow < 220 && rect.top > 200) {
        setCoords({ bottom: window.innerHeight - rect.top + 6, right: Math.max(12, right) });
      } else {
        setCoords({ top: rect.bottom + 6, right: Math.max(12, right) });
      }
    }
  }, [isOpen, buttonRef]);

  if (!isOpen || !coords) return null;

  return createPortal(
    <>
      <div
        className="fixed inset-0 z-[9998] cursor-default"
        onClick={(e) => {
          e.stopPropagation();
          onClose();
        }}
      />
      <div
        style={{
          position: "fixed",
          top: coords.top !== undefined ? `${coords.top}px` : undefined,
          bottom: coords.bottom !== undefined ? `${coords.bottom}px` : undefined,
          right: `${coords.right}px`,
        }}
        className="w-60 bg-white border border-slate-200/95 rounded-md shadow-2xl py-1.5 z-[9999] animate-in fade-in zoom-in-95 duration-100 text-left text-neutral-700 font-sans select-none text-xs"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={() => {
            onClose();
            onView(record);
          }}
          className="w-full px-3.5 py-2 text-xs text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
        >
          <i className="ri-eye-line text-sm text-neutral-500 shrink-0" />
          <span>View this complaint/suggestion</span>
        </button>

        <button
          type="button"
          onClick={() => {
            onClose();
            onEdit(record);
          }}
          className="w-full px-3.5 py-2 text-xs text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
        >
          <i className="ri-edit-box-line text-sm text-neutral-500 shrink-0" />
          <span>Edit this complaint/suggestion</span>
        </button>

        {record.attachment_url && (
          <button
            type="button"
            onClick={() => {
              onClose();
              onPreview(record.attachment_url!, record.attachment_name || "Attachment");
            }}
            className="w-full px-3.5 py-2 text-xs text-neutral-700 hover:bg-slate-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors"
          >
            <i className="ri-attachment-line text-sm text-neutral-500 shrink-0" />
            <span>Preview Attachment</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            onClose();
            onDelete(record.id);
          }}
          className="w-full px-3.5 py-2 text-xs text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 cursor-pointer font-normal transition-colors border-t border-slate-100"
        >
          <i className="ri-delete-bin-line text-sm text-rose-500 shrink-0" />
          <span>Delete this complaint/suggestion</span>
        </button>
      </div>
    </>,
    document.body
  );
});
