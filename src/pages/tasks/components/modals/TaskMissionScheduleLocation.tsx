import { useState, memo } from "react";
import type { LocationData } from "./TaskOutsideWorkMissionForm";

interface TaskMissionScheduleLocationProps {
  fromDate: string;
  setFromDate: (d: string) => void;
  toDate: string;
  setToDate: (d: string) => void;
  totalDays: number;
  setTotalDays: (v: number | ((prev: number) => number)) => void;
  location: LocationData | null;
  setLocation: (loc: LocationData | null) => void;
}

export const TaskMissionScheduleLocation = memo(function TaskMissionScheduleLocation({
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  totalDays,
  setTotalDays,
  location,
  setLocation,
}: TaskMissionScheduleLocationProps) {
  const [locating, setLocating] = useState(false);

  const captureLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        let addr = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await res.json();
          if (data?.display_name) addr = data.display_name;
        } catch {
          // ignore
        }
        setLocation({ lat: latitude, lng: longitude, accuracy: Math.round(accuracy), address: addr });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          From Date <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <input
            type="date"
            required
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          To Date <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9">
          <input
            type="date"
            required
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500 cursor-pointer"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300">
          Total Days <span className="text-rose-500">*</span>
        </label>
        <div className="sm:col-span-9 flex items-center">
          <button
            type="button"
            onClick={() => setTotalDays((d) => Math.max(1, d - 1))}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-l-md hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 cursor-pointer"
          >
            ‹
          </button>
          <div className="w-16 h-8 flex items-center justify-center border-t border-b border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 font-bold text-gray-900 dark:text-slate-100">
            {totalDays}
          </div>
          <button
            type="button"
            onClick={() => setTotalDays((d) => d + 1)}
            className="w-8 h-8 flex items-center justify-center border border-gray-200 dark:border-slate-700 rounded-r-md hover:bg-gray-50 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 cursor-pointer"
          >
            ›
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
        <label className="sm:col-span-3 text-right font-medium text-gray-700 dark:text-slate-300 pt-2">
          Work Location
        </label>
        <div className="sm:col-span-9 space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Enter destination address or click Capture GPS"
              value={location?.address || ""}
              onChange={(e) => {
                const val = e.target.value;
                if (!val.trim()) {
                  setLocation(null);
                } else {
                  setLocation({
                    lat: location?.lat || 0,
                    lng: location?.lng || 0,
                    accuracy: location?.accuracy,
                    address: val,
                  });
                }
              }}
              className="flex-1 px-3 py-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-md text-xs focus:outline-none focus:border-sky-500"
            />
            <button
              type="button"
              onClick={captureLocation}
              disabled={locating}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-xs font-bold hover:bg-emerald-100 transition-colors cursor-pointer shrink-0 disabled:opacity-50"
            >
              <i className={locating ? "ri-loader-4-line animate-spin" : "ri-crosshair-2-line"} />
              <span>{locating ? "Locating..." : "Capture GPS"}</span>
            </button>
          </div>
          {location && location.lat !== 0 && (
            <p className="text-[10px] text-gray-400 font-mono">
              GPS: {location.lat.toFixed(5)}, {location.lng.toFixed(5)} {location.accuracy ? `(±${location.accuracy}m)` : ""}
            </p>
          )}
        </div>
      </div>
    </>
  );
});
