import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Tier 4 E2E Journey 4: The Wellness Operator (Ing. Marek, B2B Claim)', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('executes full operator claim journey: view unverified venue -> submit B2B claim with valid ICO -> admin verification -> partner badge -> authentic rating unskewed -> duplicate prevention', async () => {
    const venueId = 'saunaspot-dvorce';

    // 1. Marek visits his venue detail page (/sauny/saunaspot-dvorce)
    const initialDetailRes = await request(app).get(`/api/saunas/${venueId}`);
    expect(initialDetailRes.status).toBe(200);
    const initialVenue = initialDetailRes.body.data;

    // Pre-claim verification state
    expect(initialVenue.is_verified_partner).toBe(0);
    expect(initialVenue.claimed_by_user_id).toBeNull();
    const preRating = initialVenue.rating_overall;
    const preReviewCount = initialVenue.review_count;
    expect(preReviewCount).toBeGreaterThan(0);
    expect(preRating).toBeGreaterThan(0);

    // 2. Marek logs in with his corporate manager account
    const regRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'marek.svoboda@saunaspot.cz',
        password: 'MarekManagerPass2026!',
        display_name: 'Ing. Marek Svoboda',
      });
    expect(regRes.status).toBe(201);
    const marekToken = regRes.body.token;
    const marekUserId = regRes.body.user.id;

    // 3. Marek fills and submits the B2B Claim form
    const claimData = {
      venue_id: venueId,
      business_name: 'Saunaspot s.r.o.',
      ico: '28471920', // Valid Czech 8-digit IČO
      applicant_name: 'Ing. Marek Svoboda',
      applicant_role: 'Jednatel / Provozní ředitel',
      official_email: 'marek.svoboda@saunaspot.cz',
      official_phone: '+420 774 445 556',
    };

    const claimRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${marekToken}`)
      .send(claimData);

    expect(claimRes.status).toBe(201);
    expect(claimRes.body.success).toBe(true);
    expect(claimRes.body.claim_id).toBeDefined();
    const claimId = claimRes.body.claim_id;

    // Verify row in venue_claims table has verification_status = 'pending'
    const pendingClaim = db.prepare('SELECT * FROM venue_claims WHERE id = ?').get(claimId) as any;
    expect(pendingClaim).toBeDefined();
    expect(pendingClaim.venue_id).toBe(venueId);
    expect(pendingClaim.user_id).toBe(marekUserId);
    expect(pendingClaim.ico).toBe(claimData.ico);
    expect(pendingClaim.verification_status).toBe('pending');
    expect(pendingClaim.verified_at).toBeNull();

    // 4. Platform Administrator verifies IČO in Czech Business Register (ARES) & approves claim
    const verifyRes = await request(app)
      .patch(`/api/admin/claims/${claimId}/verify`);

    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    // Verify claim status updated to approved
    const approvedClaim = db.prepare('SELECT * FROM venue_claims WHERE id = ?').get(claimId) as any;
    expect(approvedClaim.verification_status).toBe('approved');
    expect(approvedClaim.verified_at).toBeDefined();

    // 5. Inspect public venue detail page after verification
    const verifiedDetailRes = await request(app).get(`/api/saunas/${venueId}`);
    expect(verifiedDetailRes.status).toBe(200);
    const verifiedVenue = verifiedDetailRes.body.data;

    // Operator partnership is now active
    expect(verifiedVenue.is_verified_partner).toBe(1);
    expect(verifiedVenue.claimed_by_user_id).toBe(marekUserId);

    // 6. Ethical Transparency Invariant: authentic user ratings and reviews are strictly unskewed
    expect(verifiedVenue.rating_overall).toBe(preRating);
    expect(verifiedVenue.review_count).toBe(preReviewCount);
    expect(verifiedVenue.rating_cleanliness).toBe(initialVenue.rating_cleanliness);
    expect(verifiedVenue.rating_heat_steam).toBe(initialVenue.rating_heat_steam);
    expect(verifiedVenue.rating_cooling).toBe(initialVenue.rating_cooling);
    expect(verifiedVenue.rating_staff_ceremonies).toBe(initialVenue.rating_staff_ceremonies);
    expect(verifiedVenue.rating_value).toBe(initialVenue.rating_value);

    // 7. Anti-Takeover Protection: another user cannot claim an already verified venue
    const competitorReg = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'competitor@fraud.cz',
        password: 'FraudPass2026!',
        display_name: 'Podvodník',
      });
    const competitorToken = competitorReg.body.token;

    const duplicateClaimRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${competitorToken}`)
      .send({
        venue_id: venueId,
        business_name: 'Podvod s.r.o.',
        ico: '27082440',
      });

    expect(duplicateClaimRes.status).toBe(409);
    expect(duplicateClaimRes.body.error).toContain('již je ověřeným provozovatelem');
  });
});
