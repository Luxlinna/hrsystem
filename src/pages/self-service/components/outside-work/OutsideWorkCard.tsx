import React from "react";
import type { MediaItem } from "@/lib/s3-storage";

export interface OutsideWorkRecord {
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

const MONTHS_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function fmtDuration(from: string, to: string | null) {
  const ms = (to ? new Date(to).getTime() : Date.now()) - new Date(from).getTime();
  if (ms < 0) return "--";
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return "<1m";
  if (mins < 60) return `${mins}m`;
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

interface OutsideWorkCardProps {
  record: OutsideWorkRecord;
  onOpenLightbox: (url: string, type: "image" | "video") => void;
}

export function OutsideWorkCard({ record: r, onOpenLightbox }: OutsideWorkCardProps) {
  const d = new Date(r.work_checked_in_at!);
  const dayName = d.toLocaleDateString("en-US", { weekday: "short" });
  const dayNum = d.getDate();
  const monthName = MONTHS_SHORT[d.getMonth()];
  const isActive = r.work_status === "checked_in";

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden">
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
        <span
          className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${
            isActive
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200/60"
              : "bg-gray-100 text-gray-600 border border-gray-200"
          }`}
        >
          {isActive ? "Active" : "Done"}
        </span>
      </div>

      {/* Details */}
      <div className="px-4 py-3 space-y-2">
        {r.work_checked_in_at && (
          <div className="flex items-start gap-2">
            <i className="ri-map-pin-2-fill text-emerald-500 text-sm mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-semibold">Check-in Location</p>
              <p className="text-[12px] text-gray-700 truncate">{r.work_address || (r.work_lat != null ? `${r.work_lat}, ${r.work_lng}` : "--")}</p>
            </div>
          </div>
        )}

        {((r.work_media_urls && r.work_media_urls.length > 0) || r.work_image_url) && (
          <div className="flex items-start gap-2">
            <i className="ri-camera-fill text-emerald-500 text-sm mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-semibold">Check-in Media</p>
              {r.work_media_urls && r.work_media_urls.length > 0 ? (
                <div className="flex gap-1.5 mt-1">
                  {r.work_media_urls.map((m, i) => (
                    <button key={i} type="button" onClick={() => onOpenLightbox(m.url, m.type)} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
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
                <button type="button" onClick={() => onOpenLightbox(r.work_image_url!, "image")} className="mt-1 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                  <img src={r.work_image_url} alt="Check-in proof" className="w-full h-full object-cover" />
                </button>
              ) : null}
            </div>
          </div>
        )}

        {r.work_checked_out_at && (
          <div className="flex items-start gap-2">
            <i className="ri-map-pin-2-fill text-[#253C7D] text-sm mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-semibold">Check-out Location</p>
              <p className="text-[12px] text-gray-700 truncate">{r.work_check_out_address || (r.work_check_out_lat != null ? `${r.work_check_out_lat}, ${r.work_check_out_lng}` : "--")}</p>
            </div>
          </div>
        )}

        {((r.work_check_out_media_urls && r.work_check_out_media_urls.length > 0) || r.work_check_out_image_url) && (
          <div className="flex items-start gap-2">
            <i className="ri-camera-fill text-[#253C7D] text-sm mt-0.5 shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-gray-500 font-semibold">Check-out Media</p>
              {r.work_check_out_media_urls && r.work_check_out_media_urls.length > 0 ? (
                <div className="flex gap-1.5 mt-1">
                  {r.work_check_out_media_urls.map((m, i) => (
                    <button key={i} type="button" onClick={() => onOpenLightbox(m.url, m.type)} className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
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
                <button type="button" onClick={() => onOpenLightbox(r.work_check_out_image_url!, "image")} className="mt-1 w-14 h-14 rounded-lg overflow-hidden border border-gray-200 cursor-pointer group">
                  <img src={r.work_check_out_image_url} alt="Check-out proof" className="w-full h-full object-cover" />
                </button>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
