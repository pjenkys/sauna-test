import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { createTestDatabase, createTestApp, JWT_SECRET } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: B2B Venue Claim & Operator Verification Workflow', () => {
  let db: DatabaseSync;
  let app: express.Application;
  let operatorToken: string;
  const operatorUser = {
    id: 'user_sauna_master_jakub',
    email: 'jakub.kral@saunaspot.cz',
    role: 'partner',
    display_name: 'Ing. Marek Svoboda',
  };

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
    operatorToken = jwt.sign(operatorUser, JWT_SECRET, { expiresIn: '1h' });
  });

  it('TEST-CLM-01: Operator venue claim submission creates pending record', async () => {
    const claimData = {
      venue_id: 'saunaspot-dvorce',
      business_name: 'Saunaspot s.r.o.',
      ico: '28471920', // Valid Czech IČO (modulo-11)
      applicant_name: 'Ing. Marek Svoboda',
      applicant_role: 'Jednatel / Provozní ředitel',
      official_email: 'marek@saunaspot.cz',
      official_phone: '+420 774 445 556',
    };

    const res = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send(claimData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.claim_id).toBeDefined();

    // Verify database row
    const claimRow = db.prepare('SELECT * FROM venue_claims WHERE id = ?').get(res.body.claim_id) as any;
    expect(claimRow).toBeDefined();
    expect(claimRow.venue_id).toBe(claimData.venue_id);
    expect(claimRow.business_name).toBe(claimData.business_name);
    expect(claimRow.ico).toBe(claimData.ico);
    expect(claimRow.verification_status).toBe('pending');
    expect(claimRow.user_id).toBe(operatorUser.id);
  });

  it('TEST-CLM-02: Rejects claim submission with invalid Czech IČO format or checksum', async () => {
    // 1. Too short (5 digits)
    const resShort = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: '12345',
      });
    expect(resShort.status).toBe(400);
    expect(resShort.body.success).toBe(false);

    // 2. Non-numeric
    const resAlpha = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: 'ABC12345',
      });
    expect(resAlpha.status).toBe(400);
    expect(resAlpha.body.success).toBe(false);

    // 3. 8 digits but invalid modulo-11 checksum
    const resInvalidChecksum = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: '12345678',
      });
    expect(resInvalidChecksum.status).toBe(400);
    expect(resInvalidChecksum.body.error).toContain('Neplatné kontrolní číslo IČO');
  });

  it('TEST-CLM-03: Rejects unauthenticated claim attempt with 401', async () => {
    const res = await request(app)
      .post('/api/claims')
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: '28471920',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('TEST-CLM-04: Admin verifies claim -> updates status, sets is_verified_partner and claimed_by_user_id', async () => {
    // 1. Submit claim
    const submitRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: '28471920',
        applicant_name: 'Ing. Marek Svoboda',
        applicant_role: 'Jednatel',
      });
    expect(submitRes.status).toBe(201);
    const claimId = submitRes.body.claim_id;

    // 2. Admin verifies
    const verifyRes = await request(app)
      .patch(`/api/admin/claims/${claimId}/verify`);
    expect(verifyRes.status).toBe(200);
    expect(verifyRes.body.success).toBe(true);

    // 3. Verify claim record status
    const claimRow = db.prepare('SELECT verification_status, verified_at FROM venue_claims WHERE id = ?').get(claimId) as any;
    expect(claimRow.verification_status).toBe('approved');
    expect(claimRow.verified_at).toBeDefined();

    // 4. Verify venue record
    const venueRow = db.prepare('SELECT is_verified_partner, claimed_by_user_id, claimed_at FROM sauna_venues WHERE id = ?').get('saunaspot-dvorce') as any;
    expect(venueRow.is_verified_partner).toBe(1);
    expect(venueRow.claimed_by_user_id).toBe(operatorUser.id);
    expect(venueRow.claimed_at).toBeDefined();
  });

  it('TEST-CLM-05: Prevents duplicate claims on already verified venue with 409', async () => {
    // 1. Submit and verify initial claim
    const submitRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: '28471920',
      });
    expect(submitRes.status).toBe(201);
    const claimId = submitRes.body.claim_id;

    await request(app).patch(`/api/admin/claims/${claimId}/verify`);

    // 2. Attempt second claim on the now-verified venue
    const secondRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Infiltrator s.r.o.',
        ico: '27082440', // Another valid IČO (Alza)
      });

    expect(secondRes.status).toBe(409);
    expect(secondRes.body.error).toContain('již je ověřeným provozovatelem');
  });

  it('TEST-CLM-06 / TEST-PRT-02: Transparency: B2B verification does NOT alter authentic user ratings', async () => {
    // 1. Read authentic venue ratings prior to verification
    const preVenue = db.prepare(`
      SELECT rating_overall, review_count, rating_cleanliness, rating_heat_steam,
             rating_cooling, rating_staff_ceremonies, rating_value
      FROM sauna_venues WHERE id = 'saunaspot-dvorce'
    `).get() as any;

    expect(preVenue.review_count).toBeGreaterThan(0);
    expect(preVenue.rating_overall).toBeGreaterThan(0);

    // 2. Submit and verify claim
    const submitRes = await request(app)
      .post('/api/claims')
      .set('Authorization', `Bearer ${operatorToken}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        business_name: 'Saunaspot s.r.o.',
        ico: '28471920',
      });
    await request(app).patch(`/api/admin/claims/${submitRes.body.claim_id}/verify`);

    // 3. Inspect public venue detail endpoint
    const detailRes = await request(app).get('/api/saunas/saunaspot-dvorce');
    expect(detailRes.status).toBe(200);

    const postVenue = detailRes.body.data;
    expect(postVenue.is_verified_partner).toBe(1);

    // Ethical transparency check: all ratings and review counts strictly match pre-claim state
    expect(postVenue.rating_overall).toBe(preVenue.rating_overall);
    expect(postVenue.review_count).toBe(preVenue.review_count);
    expect(postVenue.rating_cleanliness).toBe(preVenue.rating_cleanliness);
    expect(postVenue.rating_heat_steam).toBe(preVenue.rating_heat_steam);
    expect(postVenue.rating_cooling).toBe(preVenue.rating_cooling);
    expect(postVenue.rating_staff_ceremonies).toBe(preVenue.rating_staff_ceremonies);
    expect(postVenue.rating_value).toBe(preVenue.rating_value);
  });

  it('TEST-CLM-07: Returns 404 when verifying non-existent claim', async () => {
    const res = await request(app).patch('/api/admin/claims/claim_non_existent/verify');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
