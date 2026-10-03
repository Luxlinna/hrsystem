import { loadGoogleMaps } from "@/lib/geocode";

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_MEDIA_TYPES = "image/*,video/*";

export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    await loadGoogleMaps();
    const geocoder = new (window as any).google.maps.Geocoder();
    return await new Promise<string>((resolve, reject) => {
      geocoder.geocode({ location: { lat, lng } }, (results: any[], status: string) => {
        if (status === "OK" && results?.[0]) resolve(results[0].formatted_address);
        else reject(new Error(status));
      });
    });
  } catch {
    return null;
  }
}

export function getGoogleMapsUrl(lat: number | null, lng: number | null): string {
  if (lat === null || lng === null) return "#";
  return `https://www.google.com/maps?q=${lat},${lng}`;
}
