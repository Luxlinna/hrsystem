import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { FormRow } from "./FormRow";

export interface SelectedSiteData {
  id: string;
  name: string;
  site_type?: string | null;
  address?: string | null;
  city?: string | null;
  province?: string | null;
  postal_code?: string | null;
  country?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  geofence_radius_m?: number | null;
}

interface Props {
  onSelectSite: (site: SelectedSiteData) => void;
  selectedSiteName?: string | null;
  onClearSite?: () => void;
}

export function SiteSearchSelector({ onSelectSite, selectedSiteName, onClearSite }: Props) {
  const [sites, setSites] = useState<SelectedSiteData[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("work_locations")
        .select("id, name, site_type, address, city, province, postal_code, country, latitude, longitude, geofence_radius_m")
        .is("deleted_at", null)
        .order("name");
      if (data) setSites(data as SelectedSiteData[]);
      setLoading(false);
    })();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = sites.filter((s) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      (s.site_type || "").toLowerCase().includes(q) ||
      (s.city || "").toLowerCase().includes(q) ||
      (s.address || "").toLowerCase().includes(q)
    );
  });

  return (
    <FormRow label="Select Site">
      <div ref={dropdownRef} className="relative w-full">
        {selectedSiteName ? (
          <div className="flex items-center justify-between px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded text-xs">
            <div className="flex items-center gap-2 truncate">
              <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
              <span className="text-emerald-900 dark:text-emerald-200 font-medium truncate">
                Auto-filled from site: <strong className="font-semibold">{selectedSiteName}</strong>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-xs text-[#2b8de3] font-semibold hover:underline cursor-pointer"
              >
                Change
              </button>
              {onClearSite && (
                <button
                  type="button"
                  onClick={onClearSite}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs cursor-pointer p-0.5"
                  title="Clear site"
                >
                  <i className="ri-close-line" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="relative">
            <input
              type="text"
              value={search}
              onFocus={() => setIsOpen(true)}
              onChange={(e) => {
                setSearch(e.target.value);
                setIsOpen(true);
              }}
              placeholder="Search existing site to auto-fill address (e.g. Kampong Thom, Main Office)..."
              className="w-full pl-7 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-xs text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-[#2b8de3]"
            />
            <i className="ri-search-line absolute left-2.5 top-2 text-slate-400 text-xs" />
          </div>
        )}

        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-56 overflow-y-auto z-50 text-xs divide-y divide-slate-100 dark:divide-slate-800">
            {loading ? (
              <div className="p-3 text-center text-slate-400">Loading sites...</div>
            ) : filtered.length === 0 ? (
              <div className="p-3 text-center text-slate-400 italic">No matching sites found.</div>
            ) : (
              filtered.map((site) => (
                <button
                  key={site.id}
                  type="button"
                  onClick={() => {
                    onSelectSite(site);
                    setIsOpen(false);
                    setSearch("");
                  }}
                  className="w-full text-left p-2.5 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-between gap-2 cursor-pointer"
                >
                  <div>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 block">
                      {site.name}
                    </span>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      {[site.address, site.city, site.country].filter(Boolean).join(", ") || "No address specified"}
                    </span>
                  </div>
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 shrink-0">
                    {site.site_type || "Site"}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
      </div>
    </FormRow>
  );
}
