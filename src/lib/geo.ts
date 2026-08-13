// Haversine great-circle distance between two lat/lng points, in meters.
export function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getCurrentPosition(options?: PositionOptions): Promise<GeolocationPosition> {
  if (!navigator.geolocation) {
    throw new Error("Geolocation is not supported by this browser.");
  }

  const request = (opts: PositionOptions) =>
    new Promise<GeolocationPosition>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, opts);
    });

  try {
    return await request({ enableHighAccuracy: true, timeout: 10000, maximumAge: 0, ...options });
  } catch (err) {
    const code = (err as GeolocationPositionError)?.code;
    // Desktops/laptops without GPS hardware commonly fail (or hang until
    // timeout) on a high-accuracy request — retry once against coarser
    // WiFi/IP-based positioning, which those devices actually support,
    // instead of surfacing a failure the user has no way to act on.
    if (code === 2 /* POSITION_UNAVAILABLE */ || code === 3 /* TIMEOUT */) {
      return await request({ enableHighAccuracy: false, timeout: 10000, maximumAge: 0, ...options });
    }
    throw err;
  }
}
