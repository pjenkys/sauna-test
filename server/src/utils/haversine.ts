/**
 * Haversine Geolocation Engine
 * High-accuracy distance calculation and localization formatting.
 */

export const EARTH_RADIUS_KM = 6371;

/**
 * Calculates Haversine distance between two coordinates in kilometers.
 * Safe against identical coordinates and floating point inaccuracy.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;

  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  // Clamp 'a' to [0, 1] to avoid NaN from Math.sqrt on floating point inaccuracies
  const clampedA = Math.max(0, Math.min(1, a));
  const c = 2 * Math.atan2(Math.sqrt(clampedA), Math.sqrt(1 - clampedA));

  return EARTH_RADIUS_KM * c;
}

/**
 * Null-safe version of haversineDistance rounded to 1 decimal place.
 */
export function haversineDistanceKm(
  lat1: number | null | undefined,
  lon1: number | null | undefined,
  lat2: number | null | undefined,
  lon2: number | null | undefined
): number | null {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) {
    return null;
  }
  const dist = haversineDistance(lat1, lon1, lat2, lon2);
  return Math.round(dist * 10) / 10;
}

/**
 * Formats distance:
 * - dist <= 0 -> '0 m'
 * - dist < 1.0 km -> formatted in meters (e.g. '450 m')
 * - 1.0 km <= dist < 10 km -> formatted with 1 decimal place (e.g. '1.2 km', '3.9 km')
 * - dist >= 10 km -> rounded to nearest integer (e.g. '15 km', '186 km')
 */
export function formatDistance(distKm: number): string {
  if (distKm <= 0) return '0 m';
  if (distKm < 1.0) {
    return `${Math.round(distKm * 1000)} m`;
  }
  if (distKm < 10) {
    return `${distKm.toFixed(1)} km`;
  }
  return `${Math.round(distKm)} km`;
}

/**
 * Checks if a coordinate is strictly within a given radius in kilometers (dist <= radiusKm).
 */
export function isWithinRadius(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
  radiusKm: number
): boolean {
  const dist = haversineDistance(lat1, lon1, lat2, lon2);
  return dist <= radiusKm;
}
