// Client-side address → coordinates lookup for Branch Management's geofence
// setup, via the Google Maps JS SDK's Geocoder (not the raw REST API,
// which has no CORS support for direct browser calls). The key is meant to
// be public — restrict it by HTTP referrer in Google Cloud Console rather
// than treating it as a secret. Requires the Geocoding API and Maps
// JavaScript API to be enabled for the project this key belongs to.
const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;

let loadPromise: Promise<void> | null = null;

function loadGoogleMaps(): Promise<void> {
  if ((window as any).google?.maps?.Geocoder) return Promise.resolve();
  if (!GOOGLE_MAPS_API_KEY) return Promise.reject(new Error("Google Maps isn't configured (missing API key)."));
  if (!loadPromise) {
    loadPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loadPromise = null; // allow retrying instead of caching a permanent failure
        reject(new Error("Failed to load Google Maps."));
      };
      document.head.appendChild(script);
    });
  }
  return loadPromise;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  formattedAddress: string;
  // Google's own confidence signal: "ROOFTOP" is an exact building match;
  // anything else (RANGE_INTERPOLATED, GEOMETRIC_CENTER, APPROXIMATE) is a
  // coarser estimate worth flagging so it doesn't get trusted blindly.
  precise: boolean;
}

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  await loadGoogleMaps();
  const geocoder = new (window as any).google.maps.Geocoder();
  return new Promise((resolve, reject) => {
    geocoder.geocode({ address }, (results: any[], status: string) => {
      if (status === "OK" && results?.[0]) {
        const loc = results[0].geometry.location;
        resolve({
          lat: loc.lat(),
          lng: loc.lng(),
          formattedAddress: results[0].formatted_address,
          precise: results[0].geometry.location_type === "ROOFTOP",
        });
      } else if (status === "ZERO_RESULTS") {
        reject(new Error("No location found for that address."));
      } else {
        reject(new Error(`Geocoding failed (${status}).`));
      }
    });
  });
}
