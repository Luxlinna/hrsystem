import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";
import type { MediaItem } from "@/lib/s3-storage";

interface OutsideWorkRecord {
  id: string;
  title: string;
  work_status: "checked_in" | "checked_out" | null;
  work_checked_in_at: string | null;
  work_checked_out_at: string | null;
  work_address: string | null;
  work_lat: number | null;
  work_lng: number | null;
  work_image_url: string | null;
  work_media_urls: MediaItem[] | null;
  work_check_out_address: string | null;
  work_check_out_lat: number | null;
  work_check_out_lng: number | null;
  work_check_out_image_url: string | null;
  work_check_out_media_urls: MediaItem[] | null;
}

interface Props {
  employeeId: string;
}

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function formatExact(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

function fmtDuration(from: string, to: string | null) {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  if (ms < 0) return "--";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

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
  const activeCount = records.filter((r) => r.work_status === "checked_in").length;

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
      {activeRecord && (
        <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/70 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
              <i className="ri-map-pin-user-fill text-emerald-600 text-lg" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Currently Working Outside</p>
              <p className="text-sm font-bold text-gray-900 truncate mt-0.5">{activeRecord.title}</p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="flex items-center gap-1 text-[11px] text-emerald-700 font-semibold">
                  <i className="ri-login-circle-line" />
                  Checked in {activeRecord.work_checked_in_at ? new Date(activeRecord.work_checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }) : ""}
                </span>
                <span className="flex items-center gap-1 text-[11px] text-gray-600 font-semibold">
                  <i className="ri-timer-line" />
                  {fmtDuration(activeRecord.work_checked_in_at!, null)}
                </span>
              </div>
            </div>
            <div className="shrink-0 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-full">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Active
              </span>
              <Link
                to="/tasks"
                className="inline-flex items-center gap-1 text-[11px] font-bold text-white bg-[#253C7D] hover:bg-[#1f3268] px-3 py-1.5 rounded-lg transition-colors"
              >
                <i className="ri-task-line" />
                Go to Tasks
              </Link>
            </div>
          </div>
          {activeRecord.work_address && (
            <p className="text-[11px] text-gray-600 mt-2 ml-13 flex items-center gap-1">
              <i className="ri-map-pin-2-fill text-emerald-500" />
              {activeRecord.work_address}
            </p>
          )}
        </div>
      )}

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
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Days", value: records.length, icon: "ri-calendar-check-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
          { label: "Completed", value: completedCount, icon: "ri-checkbox-circle-line", color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Total Hours", value: totalHours > 0 ? `${Math.floor(totalHours)}h ${Math.round((totalHours % 1) * 60)}m` : "0h", icon: "ri-timer-line", color: "text-[#253C7D]", bg: "bg-[#253C7D]/10" },
        ].map((s) => (
          <div key={s.label} className={`${s.bg} rounded-xl p-4 flex items-center gap-3`}>
            <div className="w-8 h-8 flex items-center justify-center shrink-0">
              <i className={`${s.icon} text-xl ${s.color}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-[11px] text-gray-600">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Records */}
      {records.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 bg-gray-50 rounded-xl text-gray-400">
          <i className="ri-map-pin-user-line text-3xl mb-2" />
          <p className="text-sm">No outside work records for this period</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map((r) => {
            const d = new Date(r.work_checked_in_at!);
            const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
            const dayNum = d.getDate();
            const monthName = MONTHS_SHORT[d.getMonth()];
            const isActive = r.work_status === "checked_in";

            return (
              <div key={r.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {/* Header row */}
                <div className="flex items-center gap-4 px-4 py-3.5 border-b border-gray-50">
                  <div className="shrink-0 text-center w-10">
                    <p className="text-[10px] font-semibold text-gray-400 uppercase">{dayName}</p>
                    <p className="text-[18px] font-bold text-gray-900 leading-tight">{dayNum}</p>
                    <p className="text-[10px] text-gray-400">{monthName}</p>
                  </div>
                  <div className="w-px h-10 bg-gray-100 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">{r.title}</p>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {r.work_checked_in_at && (
                        <span className="flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                          <i className="ri-login-circle-line" />
                          In {new Date(r.work_checked_in_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                      {r.work_checked_out_at && (
                        <span className="flex items-center gap-1 text-[11px] text-[#253C7D] font-semibold">
                          <i className="ri-logout-circle-r-line" />
                          Out {new Date(r.work_checked_out_at).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                        </span>
                      )}
                      {r.work_checked_in_at && r.work_checked_out_at && (
                        <span className="flex items-center gap-1 text-[11px] text-gray-500 font-semibold">
                          <i className="ri-timer-line" />
                          {fmtDuration(r.work_checked_in_at, r.work_checked_out_at)}
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    isActive
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
                      : "bg-gray-100 text-gray-600 border border-gray-200"
                  }`}>
                    {isActive ? "Active" : "Done"}
                  </span>
                </div>

                {/* Details */}
                <div className="px-4 py-3 space-y-2">
                  {/* Check-in details */}
                  {r.work_checked_in_at && (
                    <div className="flex items-start gap-2">
                      <i className="ri-map-pin-2-fill text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-semibold">Check-in Location</p>
                        <p className="text-[12px] text-gray-700 truncate">{r.work_address || (r.work_lat != null ? `${r.work_lat}, ${r.work_lng}` : "--")}</p>
                      </div>
                    </div>
                  )}

                  {/* Check-in media */}
                  {((r.work_media_urls && r.work_media_urls.length > 0) || r.work_image_url) && (
                    <div className="flex items-start gap-2">
                      <i className="ri-camera-fill text-emerald-500 text-sm mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-semibold">Check-in Media</p>
                        {r.work_media_urls && r.work_media_urls.length > 0 ? (
                          <div className="flex gap-1.5 mt-1">
                            {r.work_media_urls.map((m, i) => (
                              <button key={i} type="button" onClick={() => setLightbox({ url: m.url, type: m.type })} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                                {m.type === "video" ? (
                                  <>
                                    <video src={m.url} muted preload="metadata" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
                                      <i className="ri-play-fill text-white text-sm drop-shadow" />
                                    </div>
                                  </>
                                ) : (
                                  <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : r.work_image_url ? (
                          <button type="button" onClick={() => setLightbox({ url: r.work_image_url!, type: "image" })} className="mt-1 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                            <img src={r.work_image_url} alt="Check-in proof" className="w-full h-full object-cover" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}

                  {/* Check-out details */}
                  {r.work_checked_out_at && (
                    <div className="flex items-start gap-2">
                      <i className="ri-map-pin-2-fill text-[#253C7D] text-sm mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-semibold">Check-out Location</p>
                        <p className="text-[12px] text-gray-700 truncate">{r.work_check_out_address || (r.work_check_out_lat != null ? `${r.work_check_out_lat}, ${r.work_check_out_lng}` : "--")}</p>
                      </div>
                    </div>
                  )}

                  {/* Check-out media */}
                  {((r.work_check_out_media_urls && r.work_check_out_media_urls.length > 0) || r.work_check_out_image_url) && (
                    <div className="flex items-start gap-2">
                      <i className="ri-camera-fill text-[#253C7D] text-sm mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-[11px] text-gray-500 font-semibold">Check-out Media</p>
                        {r.work_check_out_media_urls && r.work_check_out_media_urls.length > 0 ? (
                          <div className="flex gap-1.5 mt-1">
                            {r.work_check_out_media_urls.map((m, i) => (
                              <button key={i} type="button" onClick={() => setLightbox({ url: m.url, type: m.type })} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                                {m.type === "video" ? (
                                  <>
                                    <video src={m.url} muted preload="metadata" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/30 transition">
                                      <i className="ri-play-fill text-white text-sm drop-shadow" />
                                    </div>
                                  </>
                                ) : (
                                  <img src={m.url} alt={m.name} className="w-full h-full object-cover" />
                                )}
                              </button>
                            ))}
                          </div>
                        ) : r.work_check_out_image_url ? (
                          <button type="button" onClick={() => setLightbox({ url: r.work_check_out_image_url!, type: "image" })} className="mt-1 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                            <img src={r.work_check_out_image_url} alt="Check-out proof" className="w-full h-full object-cover" />
                          </button>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lightbox popup */}
      {lightbox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setLightbox(null)}>
          <button type="button" onClick={() => setLightbox(null)} className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-white/20 text-white hover:bg-white/30 transition">
            <i className="ri-close-line text-xl" />
          </button>
          <div className="max-w-full max-h-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            {lightbox.type === "video" ? (
              <video src={lightbox.url} controls autoPlay className="max-w-full max-h-[85vh] rounded-lg" />
            ) : (
              <img src={lightbox.url} alt="" className="max-w-full max-h-[85vh] rounded-lg object-contain" />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
