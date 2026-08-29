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

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val.trim()) {
      onSetLocation(null);
    } else {
      onSetLocation({
        lat: location?.lat || 0,
        lng: location?.lng || 0,
        accuracy: location?.accuracy,
        address: val,
      });
    }
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
              Outside Work Location
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={location?.address || ""}
                  onChange={handleAddressChange}
                  placeholder="Type address or capture current location..."
                  className="w-full pl-3 pr-8 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#253C7D] transition-colors"
                />
                {location?.address && (
                  <button
                    type="button"
                    onClick={() => onSetLocation(null)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <i className="ri-close-circle-fill text-sm" />
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={captureLocation}
                disabled={locating}
                className="px-3 py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl text-emerald-700 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1 shrink-0"
                title="Capture Current GPS Location"
              >
                <i className="ri-map-pin-user-line text-sm" />
                <span>{locating ? "Locating..." : "Capture"}</span>
              </button>
            </div>
            {location && location.lat !== 0 && location.lng !== 0 && (
              <div className="mt-1.5 flex items-center justify-between text-[10px] text-emerald-600 font-medium px-1">
                <span className="flex items-center gap-1">
                  <i className="ri-checkbox-circle-fill" />
                  GPS coordinates captured ({location.lat.toFixed(4)}, {location.lng.toFixed(4)})
                </span>
                {location.accuracy != null && (
                  <span>±{location.accuracy}m accuracy</span>
                )}
              </div>
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
