import express from 'express';
export declare const JWT_SECRET = "test-secret-key-czech-sauna-platform-2026";
export declare function createTestDatabase(): DatabaseSync;
/**
 * Haversine formula distance between two coordinates in kilometers.
 */
export declare function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number;
/**
 * Formats distance: < 1 km formatted as meters ("450 m"), >= 1 km formatted as km ("1.2 km").
 */
export declare function formatDistance(distKm: number): string;
/**
 * Checks if a coordinate is within a given radius in kilometers.
 */
export declare function isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusKm: number): boolean;
/**
 * Calculates MultiSport overtime fee.
 */
export declare function calculateOvertimeFee(params: {
    freeMinutes: number;
    blockMinutes: number;
    blockPrice: number;
    stayDuration: number;
}): number;
/**
 * Calculates final price for MultiSport card holder.
 */
export declare function calculateMultisportFinalPrice(params: {
    basePrice: number;
    benefitType: string;
    discountCzk?: number | null;
    discountPercent?: number | null;
    surchargeCzk?: number | null;
    stayDuration?: number;
    freeMinutes?: number;
    blockMinutes?: number;
    blockPrice?: number;
}): {
    finalPrice: number;
    discountApplied: number;
    surchargeApplied: number;
    overtimeFee: number;
};
/**
 * Validates Czech 8-digit IČO using the Modulo-11 algorithm.
 */
export declare function validateIco(ico: string | number | null | undefined): boolean;
/**
 * Generates intelligent filter relaxation suggestions when a query yields 0 results.
 */
export declare function suggestRelaxations(activeFilters: Record<string, any>, resultCount: number): string[];
/**
 * Helper to generate a valid JWT token for test requests.
 */
export declare function getAuthToken(user: {
    id: string;
    email: string;
    role?: string;
}): string;
export declare function createTestApp(db: DatabaseSync): express.Application;
