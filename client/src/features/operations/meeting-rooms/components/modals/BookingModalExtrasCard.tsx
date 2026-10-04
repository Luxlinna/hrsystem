import { memo, useState } from "react";
import type { BookingFormData } from "../../types";

interface BookingModalExtrasCardProps {
  bookingForm: BookingFormData;
  setBookingForm: React.Dispatch<React.SetStateAction<BookingFormData>>;
}

const EQUIPMENT_LIST = [
  { id: "Projector", label: "Projector" },
  { id: "Whiteboard", label: "Whiteboard" },
  { id: "TV Screen", label: "TV Screen" },
];

const REFRESHMENTS_LIST = [
  { id: "Coffee", label: "Coffee" },
  { id: "Tea", label: "Tea" },
  { id: "Water", label: "Water" },
  { id: "Snacks", label: "Snacks" },
];

export const BookingModalExtrasCard = memo(function BookingModalExtrasCard({
  bookingForm,
  setBookingForm,
}: BookingModalExtrasCardProps) {
  const [isOpen, setIsOpen] = useState(true);

  const toggleReq = (label: string) => {
    setBookingForm((prev) => ({
      ...prev,
      selected_requirements: prev.selected_requirements.includes(label)
        ? prev.selected_requirements.filter((r) => r !== label)
        : [...prev.selected_requirements, label],
    }));
  };

  const toggleRef = (label: string) => {
    setBookingForm((prev) => ({
      ...prev,
      selected_refreshments: prev.selected_refreshments.includes(label)
        ? prev.selected_refreshments.filter((r) => r !== label)
        : [...prev.selected_refreshments, label],
    }));
  };

  const totalSelected =
    bookingForm.selected_requirements.length + bookingForm.selected_refreshments.length;

  return (
    <div className="space-y-2 pt-1">
      {/* Accordion Toggle Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-slate-50/90 dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-lg bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs shrink-0">
            <i className="ri-settings-4-fill" />
          </div>
          <span className="font-semibold text-slate-800 dark:text-slate-200">
            Equipment &amp; Refreshments (Optional)
          </span>
          {totalSelected > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#253C7D] dark:bg-sky-500 text-white">
              {totalSelected}
            </span>
          )}
        </div>
        <i
          className={`ri-arrow-down-s-line text-slate-400 text-base transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Accordion Content */}
      {isOpen && (
        <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-50/60 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-700/60 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in fade-in duration-150">
          {/* Column 1: Equipment */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="w-5 h-5 rounded-md bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
                <i className="ri-tv-line" />
              </div>
              <span>Equipment</span>
            </div>
            <div className="space-y-2 pl-0.5">
              {EQUIPMENT_LIST.map((item) => {
                const checked = bookingForm.selected_requirements.includes(item.id);
                return (
                  <label
                    key={item.id}
                    onClick={() => toggleReq(item.id)}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Column 2: Refreshments */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800 dark:text-slate-200">
              <div className="w-5 h-5 rounded-md bg-[#253C7D]/10 dark:bg-sky-500/20 text-[#253C7D] dark:text-sky-400 flex items-center justify-center text-xs">
                <i className="ri-cup-line" />
              </div>
              <span>Refreshments</span>
            </div>
            <div className="space-y-2 pl-0.5">
              {REFRESHMENTS_LIST.map((item) => {
                const checked = bookingForm.selected_refreshments.includes(item.id);
                return (
                  <label
                    key={item.id}
                    onClick={() => toggleRef(item.id)}
                    className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 font-medium cursor-pointer hover:text-slate-900 dark:hover:text-white transition-colors select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {}}
                      className="w-4 h-4 rounded-md border-slate-300 dark:border-slate-600 text-[#253C7D] focus:ring-[#253C7D] cursor-pointer"
                    />
                    <span>{item.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
