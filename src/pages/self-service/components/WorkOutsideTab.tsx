import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { OutsideWorkCard, type OutsideWorkRecord } from "./outside-work/OutsideWorkCard";
import { OutsideWorkActiveBanner } from "./outside-work/OutsideWorkActiveBanner";
import { OutsideWorkStats } from "./outside-work/OutsideWorkStats";
import { MediaLightboxModal } from "./outside-work/MediaLightboxModal";

interface Props {
  employeeId: string;
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

export default function WorkOutsideTab({ employeeId }: Props) {
  const [records, setRecords] = useState<OutsideWorkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterMonth, setFilterMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [lightbox, setLightbox] = useState<{ url: string; type: "image" | "video" } | null>(null);
  const [activeRecord, setActiveRecord] = useState<OutsideWorkRecord | null>(null);

  useEffect(() => {
    if (!employeeId) return;
    setLoading(true);

    // Fetch any currently active (checked-in) outside work record
    supabase
      .from("tasks")
      .select("id, title, work_status, work_checked_in_at, work_checked_out_at, work_address, work_lat, work_lng, work_image_url, work_media_urls, work_check_out_address, work_check_out_lat, work_check_out_lng, work_check_out_image_url, work_check_out_media_urls")
      .eq("assigned_to", employeeId)
      .eq("is_outside_work", true)
      .eq("work_status", "checked_in")
      .is("deleted_at", null)
      .maybeSingle()
      .then(({ data }) => setActiveRecord(data as OutsideWorkRecord | null));

    supabase
      .from("tasks")
      .select("id, title, work_status, work_checked_in_at, work_checked_out_at, work_address, work_lat, work_lng, work_image_url, work_media_urls, work_check_out_address, work_check_out_lat, work_check_out_lng, work_check_out_image_url, work_check_out_media_urls")
      .eq("assigned_to", employeeId)
      .eq("is_outside_work", true)
      .is("deleted_at", null)
      .not("work_checked_in_at", "is", null)
      .order("work_checked_in_at", { ascending: false })
      .then(({ data }) => {
        const filtered = (data || []).filter((r: OutsideWorkRecord) => {
          if (!r.work_checked_in_at) return false;
          const d = new Date(r.work_checked_in_at);
          const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
          return ym === filterMonth;
        });
        setRecords(filtered);
        setLoading(false);
      });
  }, [employeeId, filterMonth]);

  const totalDuration = records.reduce((sum, r) => {
    if (r.work_checked_in_at && r.work_checked_out_at) {
      return sum + (new Date(r.work_checked_out_at).getTime() - new Date(r.work_checked_in_at).getTime());
    }
    return sum;
  }, 0);

  const totalHours = totalDuration / 3600000;
  const completedCount = records.filter((r) => r.work_status === "checked_out").length;

  const monthOptions: { value: string; label: string }[] = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const val = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthOptions.push({ value: val, label: `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}` });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-7 h-7 border-2 border-[#253C7D] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Active outside work banner */}
      {activeRecord && <OutsideWorkActiveBanner activeRecord={activeRecord} />}

      {/* Header + Month filter */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <i className="ri-map-pin-user-line text-[#253C7D]" />
          <span className="text-sm font-semibold text-gray-800">Outside Work History</span>
        </div>
        <select
          value={filterMonth}
          onChange={(e) => setFilterMonth(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-xs bg-white focus:outline-none focus:ring-1 focus:ring-[#253C7D]/30 cursor-pointer"
        >
          {monthOptions.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Stats */}
      <OutsideWorkStats
        totalDays={records.length}
        completedCount={completedCount}
        totalHours={totalHours}
      />

      {/* Records */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-map-pin-user-line text-3xl mb-2" />
          <p className="text-sm">No outside work records for this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => (
            <OutsideWorkCard
              key={r.id}
              record={r}
              onOpenLightbox={(url, type) => setLightbox({ url, type })}
            />
          ))}
        </div>
      )}

      {/* Lightbox popup */}
      <MediaLightboxModal
        lightbox={lightbox}
        onClose={() => setLightbox(null)}
      />
    </div>
  );
}
