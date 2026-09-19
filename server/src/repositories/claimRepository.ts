import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/connection.js';
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

export class ClaimRepository {
  private db: DatabaseSync;

  constructor(customDb?: DatabaseSync) {
    this.db = customDb || getDb();
  }

  createClaim(data: CreateClaimData): VenueClaim {
    const id = `claim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const verificationMethod = data.verification_method || 'corporate_domain_email';

    const stmt = this.db.prepare(`
      INSERT INTO venue_claims (
        id, venue_id, user_id, business_name, ico, applicant_name, applicant_role,
        official_email, official_phone, billing_address, verification_status,
        verification_method, verification_notes, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id,
      data.venue_id,
      data.user_id,
      data.business_name.trim(),
      data.ico.trim(),
      data.applicant_name.trim(),
      data.applicant_role.trim(),
      data.official_email.trim().toLowerCase(),
      data.official_phone.trim(),
      data.billing_address ?? null,
      verificationMethod,
      data.verification_notes ?? null
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve claim after creation: ${id}`);
    }
    return created;
  }

  findById(id: string): VenueClaim | null {
    const row = this.db.prepare(`
      SELECT
        vc.*,
        sv.name AS venue_name,
        sv.slug AS venue_slug
      FROM venue_claims vc
      LEFT JOIN sauna_venues sv ON vc.venue_id = sv.id
      WHERE vc.id = ?
    `).get(id) as Record<string, any> | undefined;

    if (!row) return null;
    return this.mapRowToClaim(row);
  }

  findByVenueId(venueId: string): VenueClaim[] {
    const rows = this.db.prepare(`
      SELECT
        vc.*,
        sv.name AS venue_name,
        sv.slug AS venue_slug
      FROM venue_claims vc
      LEFT JOIN sauna_venues sv ON vc.venue_id = sv.id
      WHERE vc.venue_id = ?
      ORDER BY vc.created_at DESC
    `).all(venueId) as Array<Record<string, any>>;

    return rows.map((r) => this.mapRowToClaim(r));
  }

  findByUserId(userId: string): VenueClaim[] {
    const rows = this.db.prepare(`
      SELECT
        vc.*,
        sv.name AS venue_name,
        sv.slug AS venue_slug
      FROM venue_claims vc
      LEFT JOIN sauna_venues sv ON vc.venue_id = sv.id
      WHERE vc.user_id = ?
      ORDER BY vc.created_at DESC
    `).all(userId) as Array<Record<string, any>>;

    return rows.map((r) => this.mapRowToClaim(r));
  }

  updateStatus(
    id: string,
    status: 'approved' | 'rejected',
    moderatorId?: string,
    notes?: string
  ): VenueClaim | null {
    const claim = this.findById(id);
    if (!claim) return null;

    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db.prepare(`
        UPDATE venue_claims
        SET
          verification_status = ?,
          verified_at = CURRENT_TIMESTAMP,
          verified_by_user_id = ?,
          verification_notes = COALESCE(?, verification_notes)
        WHERE id = ?
      `).run(status, moderatorId ?? null, notes ?? null, id);

      if (status === 'approved') {
        // Update venue to claimed and verified partner
        this.db.prepare(`
          UPDATE sauna_venues
          SET
            claimed_by_user_id = ?,
            claimed_at = CURRENT_TIMESTAMP,
            is_verified_partner = 1
          WHERE id = ?
        `).run(claim.user_id, claim.venue_id);

        // Update user role to partner if currently regular user
        this.db.prepare(`
          UPDATE users
          SET role = 'partner'
          WHERE id = ? AND role = 'user'
        `).run(claim.user_id);
      }

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }

    return this.findById(id);
  }

  private mapRowToClaim(r: Record<string, any>): VenueClaim {
    return {
      id: r.id,
      venue_id: r.venue_id,
      user_id: r.user_id,
      business_name: r.business_name,
      ico: r.ico,
      applicant_name: r.applicant_name,
      applicant_role: r.applicant_role,
      official_email: r.official_email,
      official_phone: r.official_phone,
      billing_address: r.billing_address,
      verification_status: r.verification_status,
      verification_method: r.verification_method,
      verification_notes: r.verification_notes,
      created_at: r.created_at,
      verified_at: r.verified_at,
      verified_by_user_id: r.verified_by_user_id,
      venue: r.venue_name
        ? {
            id: r.venue_id,
            name: r.venue_name,
            slug: r.venue_slug,
          }
        : undefined,
    };
  }
}

export const claimRepository = new ClaimRepository();
