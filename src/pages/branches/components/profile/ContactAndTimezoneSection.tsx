import React from "react";
import { FormRow } from "./FormRow";
import type { BranchFormState } from "../../types";

interface ContactAndTimezoneSectionProps {
  form: BranchFormState;
  setForm: React.Dispatch<React.SetStateAction<BranchFormState>>;
}

const TIMEZONE_OPTIONS = [
  "(UTC+07:00) Bangkok, Hanoi, Jakarta",
  "(UTC+08:00) Singapore, Kuala Lumpur, Hong Kong, Beijing",
  "(UTC+09:00) Tokyo, Seoul",
  "(UTC+06:30) Yangon",
  "(UTC+05:30) Chennai, Kolkata, Mumbai, New Delhi",
  "(UTC+00:00) UTC / London",
  "(UTC-05:00) Eastern Time (US & Canada)",
  "(UTC-08:00) Pacific Time (US & Canada)",
];

const COUNTRY_DIAL_CODES = [
  { code: "+855", country: "Cambodia", flag: "🇰🇭" },
  { code: "+66", country: "Thailand", flag: "🇹🇭" },
  { code: "+84", country: "Vietnam", flag: "🇻🇳" },
  { code: "+65", country: "Singapore", flag: "🇸🇬" },
  { code: "+60", country: "Malaysia", flag: "🇲🇾" },
  { code: "+63", country: "Philippines", flag: "🇵🇭" },
  { code: "+62", country: "Indonesia", flag: "🇮🇩" },
  { code: "+1", country: "United States", flag: "🇺🇸" },
  { code: "+44", country: "United Kingdom", flag: "🇬🇧" },
  { code: "+86", country: "China", flag: "🇨🇳" },
  { code: "+81", country: "Japan", flag: "🇯🇵" },
  { code: "+82", country: "South Korea", flag: "🇰🇷" },
];

export function ContactAndTimezoneSection({
  form,
  setForm,
}: ContactAndTimezoneSectionProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-slate-800">
      {/* 1. CONTACT INFO */}
      <div className="space-y-1">
        <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
          Contact Info
        </h3>

        {/* Phone Number */}
        <FormRow label="Phone Number">
          <div className="flex items-center rounded border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden text-xs">
            <div className="px-2 py-1.5 bg-slate-50 dark:bg-slate-900 border-r border-slate-300 dark:border-slate-700 flex items-center gap-1 shrink-0">
              <span className="text-base leading-none">🇰🇭</span>
              <i className="ri-arrow-down-s-fill text-[10px] text-slate-400" />
            </div>
            <input
              type="text"
              value={form.phone_number}
              onChange={(e) => setForm((prev) => ({ ...prev, phone_number: e.target.value }))}
              placeholder="+85578777301"
              className="w-full px-3 py-1.5 bg-transparent text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none"
            />
          </div>
        </FormRow>

        {/* Email */}
        <FormRow label="Email">
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            placeholder="Email"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
          />
        </FormRow>

        {/* Website */}
        <FormRow label="Website">
          <input
            type="text"
            value={form.website}
            onChange={(e) => setForm((prev) => ({ ...prev, website: e.target.value }))}
            placeholder="Website"
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
          />
        </FormRow>
      </div>

      {/* 2. TIMEZONE INFO */}
      <div className="space-y-1 pt-4 border-t border-slate-100 dark:border-slate-800">
        <h3 className="text-xs font-bold text-[#0088cc] uppercase tracking-wider mb-3">
          Timezone Info
        </h3>

        <FormRow label="Time Zone" required>
          <select
            value={form.time_zone || TIMEZONE_OPTIONS[0]}
            onChange={(e) => setForm((prev) => ({ ...prev, time_zone: e.target.value }))}
            className="w-full px-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-[#2b8de3] cursor-pointer"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </FormRow>
      </div>
    </div>
  );
}
