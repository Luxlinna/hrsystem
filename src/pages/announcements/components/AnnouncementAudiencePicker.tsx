import { memo, useState, useRef, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import type { AnnouncementFormState } from "../types";
import { AUDIENCE_CONFIG } from "../constants";

interface AnnouncementAudiencePickerProps {
  form: AnnouncementFormState;
  setForm: React.Dispatch<React.SetStateAction<AnnouncementFormState>>;
}

export const AnnouncementAudiencePicker = memo(function AnnouncementAudiencePicker({
  form,
  setForm,
}: AnnouncementAudiencePickerProps) {
  const [open, setOpen] = useState(false);
  const [roles, setRoles] = useState<{ id: number; name: string; color?: string }[]>([]);
  const [audienceSearch, setAudienceSearch] = useState("");
  const [customAudience, setCustomAudience] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.from("app_roles").select("id, name, color").order("name").then(({ data }) => {
      if (data && data.length > 0) setRoles(data);
    });
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getAudienceDisplay = (val: string) => {
    if (val === "all") return { label: "All Staff (Everyone)", icon: "ri-global-line", color: "#253C7D" };
    if (val === "hq") return { label: "HQ Staff Only", icon: "ri-building-line", color: "#475569" };
    if (val === "management") return { label: "Management Only", icon: "ri-shield-user-line", color: "#7C3AED" };
    const matchedRole = roles.find((r) => r.name.toLowerCase() === val.toLowerCase() || String(r.id) === val);
    if (matchedRole) return { label: `Role: ${matchedRole.name}`, icon: "ri-user-star-line", color: matchedRole.color || "#253C7D" };
    return { label: `Target: ${val}`, icon: "ri-user-settings-line", color: "#253C7D" };
  };

  const current = getAudienceDisplay(form.visible_to);

  return (
    <div className="relative" ref={dropdownRef}>
      <label className="text-[11px] font-extrabold text-gray-500 uppercase tracking-wider block mb-1.5">
        Target Audience Visibility
      </label>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={`w-full px-3.5 py-2.5 bg-gray-50/80 hover:bg-white border rounded-xl text-xs text-left font-semibold flex items-center justify-between gap-2 transition-all cursor-pointer ${
          open ? "border-[#253C7D] ring-2 ring-[#253C7D]/10 bg-white" : "border-gray-200 hover:border-gray-300"
        }`}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center text-sm shrink-0" style={{ color: current.color }}>
            <i className={current.icon} />
          </div>
          <p className="text-xs font-bold text-gray-900 truncate">{current.label}</p>
        </div>
        <i className={`ri-arrow-down-s-line text-gray-400 text-base transition-transform duration-200 shrink-0 ${open ? "rotate-180 text-[#253C7D]" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 p-2 space-y-1.5 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-100">
          <div className="relative">
            <i className="ri-search-line absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
            <input
              type="text"
              value={audienceSearch}
              onChange={(e) => setAudienceSearch(e.target.value)}
              placeholder="Search audience..."
              className="w-full pl-7 pr-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs font-medium focus:outline-none focus:border-[#253C7D]"
            />
          </div>

          <div className="space-y-1 max-h-44 overflow-y-auto">
            {Object.entries(AUDIENCE_CONFIG).map(([key, cfg]) => (
              <div
                key={key}
                onClick={() => { setForm((prev) => ({ ...prev, visible_to: key })); setOpen(false); }}
                className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs ${form.visible_to === key ? "bg-[#253C7D]/10 text-[#253C7D] font-bold" : "hover:bg-gray-50 text-gray-700 font-semibold"}`}
              >
                <span>{cfg.label}</span>
                {form.visible_to === key && <i className="ri-checkbox-circle-fill text-[#253C7D]" />}
              </div>
            ))}

            {roles.length > 0 && (
              <div className="pt-1.5 border-t border-gray-100">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 py-1">By Organizational Role</p>
                {roles.filter((r) => r.name.toLowerCase().includes(audienceSearch.toLowerCase())).map((r) => (
                  <div
                    key={r.id}
                    onClick={() => { setForm((prev) => ({ ...prev, visible_to: r.name })); setOpen(false); }}
                    className={`p-2 rounded-xl flex items-center justify-between cursor-pointer transition-colors text-xs ${form.visible_to === r.name ? "bg-[#253C7D]/10 text-[#253C7D] font-bold" : "hover:bg-gray-50 text-gray-700 font-semibold"}`}
                  >
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: r.color || "#253C7D" }} />
                      {r.name}
                    </span>
                    {form.visible_to === r.name && <i className="ri-checkbox-circle-fill text-[#253C7D]" />}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-gray-100 bg-gray-50/70 p-2 rounded-xl space-y-1">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={customAudience}
                onChange={(e) => setCustomAudience(e.target.value)}
                placeholder="Custom group..."
                className="flex-1 px-2.5 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-semibold focus:outline-none focus:border-[#253C7D]"
              />
              <button
                type="button"
                onClick={() => {
                  if (customAudience.trim()) {
                    setForm((prev) => ({ ...prev, visible_to: customAudience.trim() }));
                    setCustomAudience("");
                    setOpen(false);
                  }
                }}
                disabled={!customAudience.trim()}
                className="px-3 py-1.5 bg-[#253C7D] text-white text-xs font-bold rounded-lg disabled:opacity-50 cursor-pointer"
              >
                Set
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});
