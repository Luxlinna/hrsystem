import React, { useState, useEffect, useRef, memo } from "react";

interface DatePickerDMYProps {
  value?: string | null; // ISO YYYY-MM-DD or empty
  onChange: (isoValue: string) => void;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
  min?: string;
  max?: string;
  id?: string;
  name?: string;
}

export const DatePickerDMY = memo(function DatePickerDMY({
  value,
  onChange,
  required = false,
  disabled = false,
  placeholder = "DD/MM/YYYY",
  className = "",
  min,
  max,
  id,
  name,
}: DatePickerDMYProps) {
  // Convert YYYY-MM-DD -> DD/MM/YYYY for display
  const isoToDmy = (iso?: string | null): string => {
    if (!iso) return "";
    const parts = iso.split("T")[0].split("-");
    if (parts.length === 3) {
      return `${parts[2].padStart(2, "0")}/${parts[1].padStart(2, "0")}/${parts[0]}`;
    }
    return iso;
  };

  // Convert DD/MM/YYYY -> YYYY-MM-DD for state
  const dmyToIso = (dmy: string): string => {
    const clean = dmy.trim();
    const parts = clean.split("/");
    if (parts.length === 3) {
      const d = parts[0].padStart(2, "0");
      const m = parts[1].padStart(2, "0");
      const y = parts[2];
      if (y.length === 4 && Number(m) >= 1 && Number(m) <= 12 && Number(d) >= 1 && Number(d) <= 31) {
        return `${y}-${m}-${d}`;
      }
    }
    return "";
  };

  const [text, setText] = useState(() => isoToDmy(value));
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setText(isoToDmy(value));
  }, [value]);

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/[^0-9/]/g, "");
    
    // Auto-insert slash when typing digits
    if (raw.length === 2 && !raw.includes("/") && text.length < 2) {
      raw = `${raw}/`;
    } else if (raw.length === 5 && raw.split("/").length === 2 && text.length < 5) {
      raw = `${raw}/`;
    }
    
    if (raw.length <= 10) {
      setText(raw);
      const iso = dmyToIso(raw);
      if (iso) {
        onChange(iso);
      } else if (raw === "") {
        onChange("");
      }
    }
  };

  const handleNativePickerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const isoVal = e.target.value;
    onChange(isoVal);
    setText(isoToDmy(isoVal));
  };

  const openCalendar = () => {
    if (disabled) return;
    if (hiddenInputRef.current) {
      try {
        if ("showPicker" in HTMLInputElement.prototype) {
          hiddenInputRef.current.showPicker();
        } else {
          hiddenInputRef.current.focus();
        }
      } catch {
        hiddenInputRef.current.focus();
      }
    }
  };

  return (
    <div className="relative inline-flex items-center w-full">
      <input
        type="text"
        id={id}
        name={name}
        required={required}
        disabled={disabled}
        placeholder={placeholder}
        value={text}
        onChange={handleTextChange}
        maxLength={10}
        className={
          className ||
          "w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-sky-500 font-mono tracking-wider pr-8"
        }
      />
      
      {/* Calendar Icon Button */}
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        onClick={openCalendar}
        className="absolute right-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer p-0.5 transition-colors"
        title="Choose date (DD/MM/YYYY)"
      >
        <i className="ri-calendar-line text-sm pointer-events-none" />
      </button>

      {/* Hidden Native Picker used solely as the calendar UI popup */}
      <input
        ref={hiddenInputRef}
        type="date"
        tabIndex={-1}
        min={min}
        max={max}
        value={value ? value.split("T")[0] : ""}
        onChange={handleNativePickerChange}
        className="sr-only pointer-events-none absolute opacity-0 w-0 h-0"
      />
    </div>
  );
});
