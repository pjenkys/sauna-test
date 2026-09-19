/**
 * Haversine Geolocation Engine
 * High-accuracy distance calculation and localization formatting.
 */
export declare const EARTH_RADIUS_KM = 6371;
/**
 * Calculates Haversine distance between two coordinates in kilometers.
 * Safe against identical coordinates and floating point inaccuracy.
 */
export declare function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Null-safe version of haversineDistance rounded to 1 decimal place.
 */
export declare function haversineDistanceKm(lat1: number | null | undefined, lon1: number | null | undefined, lat2: number | null | undefined, lon2: number | null | undefined): number | null;
/**
 * Formats distance:
 * - dist <= 0 -> '0 m'
 * - dist < 1.0 km -> formatted in meters (e.g. '450 m')
 * - 1.0 km <= dist < 10 km -> formatted with 1 decimal place (e.g. '1.2 km', '3.9 km')
 * - dist >= 10 km -> rounded to nearest integer (e.g. '15 km', '186 km')
 */
export declare function formatDistance(distKm: number): string;
/**
 * Checks if a coordinate is strictly within a given radius in kilometers (dist <= radiusKm).
 */
export declare function isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusKm: number): boolean;
