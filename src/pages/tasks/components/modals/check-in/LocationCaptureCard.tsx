import { memo } from "react";
import { getGoogleMapsUrl } from "../../../geoUtils";

interface LocationCaptureCardProps {
  location: {
    lat: number;
    lng: number;
    accuracy: number | null;
    address: string | null;
  } | null;
  locating: boolean;
  onCaptureLocation: () => void;
  isCheckIn: boolean;
  isOptional?: boolean;
}

export const LocationCaptureCard = memo(function LocationCaptureCard({
  location,
  locating,
  onCaptureLocation,
  isCheckIn,
  isOptional,
}: LocationCaptureCardProps) {
  return (
    <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
            <i className="ri-map-pin-2-line text-sm" />
          </span>
          <div>
            <h4 className="text-xs font-bold text-slate-800">
              GPS Location {isCheckIn && !isOptional && <span className="text-rose-500">*</span>}
            </h4>
            <p className="text-[11px] text-slate-500">
              {location 
                ? "Coordinates recorded" 
                : isOptional 
                  ? "Optional (predefined location exists)" 
                  : "Required to verify field location"}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onCaptureLocation}
          disabled={locating}
          className="flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors cursor-pointer"
        >
          {locating ? (
            <>
              <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Locating…
            </>
          ) : (
            <>
              <i className="ri-crosshair-2-line text-xs" />
              {location ? "Update GPS" : "Get GPS"}
            </>
          )}
        </button>
      </div>

      {location && (
        <div className="rounded-lg bg-white p-3 border border-slate-200/70 text-xs space-y-1">
          <div className="flex items-center justify-between text-slate-600">
            <span className="font-mono text-[11px]">
              {location.lat.toFixed(5)}, {location.lng.toFixed(5)}
            </span>
            {location.accuracy !== null && (
              <span className="text-[10px] text-slate-400">
                &plusmn;{location.accuracy}m accuracy
              </span>
            )}
          </div>
          {location.address ? (
            <p className="text-slate-800 font-medium text-[11px] leading-snug">
              {location.address}
            </p>
          ) : (
            <p className="text-slate-400 italic text-[11px]">Resolving street address…</p>
          )}
          <a
            href={getGoogleMapsUrl(location.lat, location.lng)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:underline pt-0.5"
          >
            <i className="ri-external-link-line" />
            View on Google Maps
          </a>
        </div>
      )}
    </div>
  );
});
