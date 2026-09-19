export declare const EARTH_RADIUS_KM = 6371;
/**
 * Calculates Haversine distance between two coordinates in kilometers.
 */
export declare function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Null-safe version of haversineDistance rounded to 1 decimal place.
 */
export declare function haversineDistanceKm(lat1?: number | null, lon1?: number | null, lat2?: number | null, lon2?: number | null): number | null;
/**
 * Formats distance for display:
 * - dist <= 0 -> '0 m'
 * - dist < 1.0 km -> formatted in meters (e.g. '450 m')
 * - 1.0 km <= dist < 10 km -> formatted with 1 decimal place (e.g. '1.2 km', '3.9 km')
 * - dist >= 10 km -> rounded to nearest integer (e.g. '15 km', '186 km')
 */
export declare function formatDistance(distKm: number): string;
