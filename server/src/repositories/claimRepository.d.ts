import { DatabaseSync } from 'node:sqlite';
import type { VenueClaim } from '@shared';
export interface CreateClaimData {
    venue_id: string;
    user_id: string;
    business_name: string;
    ico: string;
    applicant_name: string;
    applicant_role: string;
    official_email: string;
    official_phone: string;
    billing_address?: string | null;
    verification_method?: string;
    verification_notes?: string | null;
}
export declare class ClaimRepository {
    private db;
    constructor(customDb?: DatabaseSync);
    createClaim(data: CreateClaimData): VenueClaim;
    findById(id: string): VenueClaim | null;
    findByVenueId(venueId: string): VenueClaim[];
    findByUserId(userId: string): VenueClaim[];
    updateStatus(id: string, status: 'approved' | 'rejected', moderatorId?: string, notes?: string): VenueClaim | null;
    private mapRowToClaim;
}
export declare const claimRepository: ClaimRepository;
