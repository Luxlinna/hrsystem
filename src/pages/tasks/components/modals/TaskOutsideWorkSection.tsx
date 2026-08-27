import { memo, useState, useRef } from "react";

interface LocationData {
  lat: number;
  lng: number;
  accuracy?: number;
  address?: string;
}

interface TaskOutsideWorkSectionProps {
  isOutsideWork: boolean;
  onToggleOutsideWork: (val: boolean) => void;
  location: LocationData | null;
  onSetLocation: (loc: LocationData | null) => void;
  mediaFiles: File[];
  onSetMediaFiles: (files: File[]) => void;
}

export const TaskOutsideWorkSection = memo(function TaskOutsideWorkSection({
  isOutsideWork,
  onToggleOutsideWork,
  location,
  onSetLocation,
  mediaFiles,
  onSetMediaFiles,
}: TaskOutsideWorkSectionProps) {
  const [locating, setLocating] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
          if (data && data.display_name) {
            addr = data.display_name;
          }
        } catch {
          // fallback to coordinates
        }
        onSetLocation({
          lat: latitude,
          lng: longitude,
          accuracy: Math.round(accuracy),
          address: addr,
        });
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onSetMediaFiles([...mediaFiles, ...Array.from(e.target.files)]);
    }
  };

  const removeFile = (idx: number) => {
    onSetMediaFiles(mediaFiles.filter((_, i) => i !== idx));
  };

  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden">
      {/* Toggle Banner */}
      <button
        type="button"
        onClick={() => onToggleOutsideWork(!isOutsideWork)}
        className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-gray-50/60"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
              isOutsideWork ? "bg-[#253C7D]/10 text-[#253C7D]" : "bg-gray-100 text-gray-400"
            }`}
          >
            <i className="ri-map-pin-user-line text-base" />
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-gray-900">Outside Work</p>
            <p className="text-[11px] text-gray-400 mt-0.5">
              Check in with location, check out with a photo when done
            </p>
          </div>
        </div>

        {/* Switch Toggle */}
        <div
          className={`relative w-10 h-[22px] rounded-full transition-colors shrink-0 ${
            isOutsideWork ? "bg-[#253C7D]" : "bg-gray-300"
          }`}
        >
          <span
            className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
              isOutsideWork ? "left-[22px]" : "left-[3px]"
            }`}
          />
        </div>
      </button>

      {/* Expanded Capture Inputs */}
      {isOutsideWork && (
        <div className="px-4 pb-4 pt-2 border-t border-gray-100 bg-gray-50/40 space-y-3">
          {/* Location Capture */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <i className="ri-map-pin-2-fill text-emerald-600" />
              Current Location
            </label>
            {location ? (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200/70 rounded-xl flex items-center justify-between gap-2">
                <div className="min-w-0 text-xs">
                  <p className="text-emerald-800 font-bold flex items-center gap-1">
                    <i className="ri-checkbox-circle-fill text-emerald-600" />
                    Location captured
                  </p>
                  <p className="text-emerald-700 text-[11px] truncate mt-0.5">{location.address}</p>
                  {location.accuracy != null && (
                    <p className="text-emerald-600 text-[10px]">±{location.accuracy}m GPS accuracy</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => onSetLocation(null)}
                  className="text-xs font-bold text-emerald-800 hover:underline shrink-0 cursor-pointer"
                >
                  Recapture
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={captureLocation}
                disabled={locating}
                className="w-full py-2.5 border-2 border-dashed border-emerald-300 rounded-xl text-emerald-700 text-xs font-bold hover:bg-emerald-50 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                <i className="ri-map-pin-user-line text-sm" />
                <span>{locating ? "Acquiring GPS location..." : "Capture Current Location"}</span>
              </button>
            )}
          </div>

          {/* Media Capture */}
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-1.5">
              <i className="ri-camera-line text-[#253C7D]" />
              Photos / Videos <span className="text-gray-400 normal-case">(optional)</span>
            </label>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept="image/*,video/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 border-2 border-dashed border-gray-300 rounded-xl text-gray-600 text-xs font-semibold hover:bg-gray-100 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="ri-camera-line text-sm" />
              <span>{mediaFiles.length > 0 ? "Add More Photos / Videos" : "Add Photos / Videos"}</span>
            </button>

            {mediaFiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {mediaFiles.map((f, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-lg text-[11px] font-semibold text-gray-700"
                  >
                    <i className="ri-image-line text-gray-400" />
                    <span className="truncate max-w-[120px]">{f.name}</span>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-gray-400 hover:text-rose-500 cursor-pointer"
                    >
                      <i className="ri-close-line" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
