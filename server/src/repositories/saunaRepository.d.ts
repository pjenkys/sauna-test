import { DatabaseSync } from 'node:sqlite';
import type { SaunaVenue, SaunaSummary, SaunaDetail, SaunaFilterParams, MapMarker } from '@shared';
export declare class SaunaRepository {
    private db;
    constructor(customDb?: DatabaseSync);
    findById(id: string, userLat?: number, userLon?: number): SaunaDetail | null;
    findBySlug(slug: string, userLat?: number, userLon?: number): SaunaDetail | null;
    findSummaries(params?: SaunaFilterParams): {
        venues: SaunaSummary[];
        total: number;
    };
    findNearby(lat: number, lon: number, limit?: number, excludeId?: string): SaunaSummary[];
    getMapMarkers(params?: SaunaFilterParams): MapMarker[];
    create(venue: Partial<SaunaVenue>): SaunaVenue;
    update(id: string, venue: Partial<SaunaVenue>): SaunaVenue | null;
    updateAggregateRatings(venueId: string): void;
    private buildFilterClauses;
    private buildSaunaDetail;
}
export declare const saunaRepository: SaunaRepository;
