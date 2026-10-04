export interface GeocodedAddress {
  address?: string;
  city?: string;
  province?: string;
  postal_code?: string;
  country?: string;
}

/**
 * Reverse geocodes latitude and longitude into structured address information
 * using OpenStreetMap Nominatim API (with English language priority).
 */
export async function reverseGeocode(
  lat: number | string,
  lng: number | string
): Promise<GeocodedAddress | null> {
  try {
    const numLat = typeof lat === "string" ? parseFloat(lat) : lat;
    const numLng = typeof lng === "string" ? parseFloat(lng) : lng;

    if (isNaN(numLat) || isNaN(numLng)) return null;

    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${numLat}&lon=${numLng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: {
        "Accept-Language": "en,km",
      },
    });

    if (!res.ok) return null;
    const data = await res.json();
    if (!data || !data.address) return null;

    const addr = data.address;

    // Construct street address
    const streetParts = [
      addr.building || addr.house_number || addr.amenity || addr.office,
      addr.road || addr.pedestrian || addr.street || addr.residential,
      addr.neighbourhood || addr.suburb || addr.quarter || addr.subdistrict,
    ].filter(Boolean);

    let address = streetParts.join(", ");
    if (!address && data.display_name) {
      address = data.display_name.split(",").slice(0, 3).join(", ");
    }

    const city =
      addr.city ||
      addr.town ||
      addr.municipality ||
      addr.city_district ||
      addr.village ||
      addr.county ||
      "";

    const province =
      addr.state ||
      addr.province ||
      addr.state_district ||
      addr.region ||
      "";

    const postal_code = addr.postcode || "";
    const country = addr.country || "";

    return {
      address,
      city,
      province,
      postal_code,
      country,
    };
  } catch (err) {
    console.error("Reverse geocoding error:", err);
    return null;
  }
}
