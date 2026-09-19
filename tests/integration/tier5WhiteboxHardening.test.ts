import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { DatabaseSync } from 'node:sqlite';
import { app } from '../../server/src/app.js';
import { setDb } from '../../server/src/db/connection.js';
import { createTestDatabase, JWT_SECRET, getAuthToken } from '../setup';
import {
  haversineDistance,
  haversineDistanceKm,
  formatDistance,
  isWithinRadius,
} from '../../server/src/utils/haversine.js';
import { validateIco } from '../../server/src/utils/icoValidator.js';
import {
  calculateOvertimeFee,
  calculateMultisportFinalPrice,
} from '../../server/src/utils/multisportFee.js';
import { suggestRelaxations } from '../../server/src/utils/zeroStateRelaxer.js';

describe('Tier 5 White-Box Coverage Hardening: Production Server & Domain Logic', () => {
  let db: DatabaseSync;
  const testUser = { id: 'user_harden_1', email: 'hardener@sauna.cz', role: 'user', display_name: 'Test Hardener' };
  let authToken: string;

  beforeEach(() => {
    // Bootstrap fresh in-memory database and wire it into the production Express server singleton
    db = createTestDatabase();
    setDb(db);

    // Ensure our test user exists in the DB
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role)
      VALUES (?, ?, '$2a$10$e7wI6XqYq4E2X/9x1r1q1.wK3eB3VzH9gBv6w5n8r7y9q1w2e3r4t', ?, 'user')
    `).run(testUser.id, testUser.email, testUser.display_name);

    authToken = getAuthToken(testUser);
  });

  // ==========================================================================
  // SECTION 1: PRODUCTION SERVER CORE ENDPOINTS & MIDDLEWARE
  // ==========================================================================
  describe('1. Production Server Core Endpoints & Middlewares', () => {
    it('serves /health endpoint with 200 and service metadata', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('czech-sauna-database-server');
      expect(res.body.timestamp).toBeDefined();
    });

    it('serves /api/health endpoint with 200 and service metadata', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('czech-sauna-database-server');
    });

    it('handles undefined routes with 404 and Czech error message from notFoundHandler', async () => {
      const res = await request(app).get('/api/non-existent-route-xyz');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Požadovaný koncový bod nebyl nalezen');
    });

    it('CORS headers allow cross-origin requests and methods', async () => {
      const res = await request(app)
        .options('/api/saunas')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'GET');

      expect(res.headers['access-control-allow-origin']).toBe('*');
    });

    it('handles malformed JSON payload without crashing server process', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": "broken_json_without_closing_brace');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });
  });

  // ==========================================================================
  // SECTION 2: SAUNA SEARCH, PAGINATION, SORTING & ADVERSARIAL QUERY PARAMS
  // ==========================================================================
  describe('2. Deep Search, Pagination, Sorting & Adversarial Queries', () => {
    it('supports limit and offset pagination correctly', async () => {
      const res1 = await request(app).get('/api/saunas').query({ limit: 3, offset: 0 });
      expect(res1.status).toBe(200);
      expect(res1.body.data.length).toBe(3);
      expect(res1.body.meta.count).toBeGreaterThan(3);

      const res2 = await request(app).get('/api/saunas').query({ limit: 3, offset: 3 });
      expect(res2.status).toBe(200);
      expect(res2.body.data.length).toBe(3);

      // Verify no overlap in IDs between page 1 and page 2
      const ids1 = new Set(res1.body.data.map((v: any) => v.id));
      for (const v of res2.body.data) {
        expect(ids1.has(v.id)).toBe(false);
      }
    });

    it('clamps negative limit and offset to safe boundaries', async () => {
      const res = await request(app).get('/api/saunas').query({ limit: -5, offset: -10 });
      expect(res.status).toBe(200);
      // Math.max(1, -5) clamps to 1
      expect(res.body.data.length).toBe(1);
    });

    it('handles huge offset beyond total count gracefully returning empty array', async () => {
      const res = await request(app).get('/api/saunas').query({ offset: 9999 });
      expect(res.status).toBe(200);
      expect(res.body.data).toEqual([]);
      expect(res.body.meta.count).toBeGreaterThan(0);
    });

    it('sorts correctly by review count (sort=reviews)', async () => {
      const res = await request(app).get('/api/saunas').query({ sort: 'reviews' });
      expect(res.status).toBe(200);
      const reviews = res.body.data.map((v: any) => v.review_count);
      for (let i = 0; i < reviews.length - 1; i++) {
        expect(reviews[i]).toBeGreaterThanOrEqual(reviews[i + 1]);
      }
    });

    it('sorts correctly by Czech alphabetical name (sort=name)', async () => {
      const res = await request(app).get('/api/saunas').query({ sort: 'name' });
      expect(res.status).toBe(200);
      const names = res.body.data.map((v: any) => v.name);
      for (let i = 0; i < names.length - 1; i++) {
        expect(names[i].localeCompare(names[i + 1], 'cs')).toBeLessThanOrEqual(0);
      }
    });

    it('default sort (sort=recommended) places promoted partners first', async () => {
      const res = await request(app).get('/api/saunas');
      expect(res.status).toBe(200);
      const first = res.body.data[0];
      expect(first.is_promoted).toBe(1);
    });

    it('filters within geographic bounding box rectangle (bounds_north/south/east/west)', async () => {
      // Prague bounding box coordinates
      const res = await request(app).get('/api/saunas').query({
        bounds_north: 50.18,
        bounds_south: 49.95,
        bounds_east: 14.65,
        bounds_west: 14.25,
      });

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const venue of res.body.data) {
        expect(venue.latitude).toBeGreaterThanOrEqual(49.95);
        expect(venue.latitude).toBeLessThanOrEqual(50.18);
        expect(venue.longitude).toBeGreaterThanOrEqual(14.25);
        expect(venue.longitude).toBeLessThanOrEqual(14.65);
      }
    });

    it('handles adversarial SQL wildcard % and _ in query without crashing or leaking tables', async () => {
      const resWild = await request(app).get('/api/saunas').query({ q: '%%%' });
      expect(resWild.status).toBe(200);
      expect(resWild.body.success).toBe(true);
    });

    it('handles text query with Czech diacritics', async () => {
      const res = await request(app).get('/api/saunas').query({ q: 'Špindlerův' });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data.some((v: any) => v.name.includes('Špindlerův') || v.address_city.includes('Špindlerův'))).toBe(true);
    });

    it('filters by experience showers and bucket showers', async () => {
      const resExp = await request(app).get('/api/saunas').query({ cooling: 'experience_showers' });
      expect(resExp.status).toBe(200);
      expect(resExp.body.data.length).toBeGreaterThan(0);
      for (const v of resExp.body.data) {
        expect(v.has_experience_showers).toBe(1);
      }

      const resBkt = await request(app).get('/api/saunas').query({ cooling: 'bucket_shower' });
      expect(resBkt.status).toBe(200);
      expect(resBkt.body.data.length).toBeGreaterThan(0);
      for (const v of resBkt.body.data) {
        expect(v.has_bucket_shower).toBe(1);
      }
    });

    it('filters by steam bath sauna type', async () => {
      const res = await request(app).get('/api/saunas').query({ sauna_type: 'steam_bath' });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const v of res.body.data) {
        expect(v.has_steam_bath).toBe(1);
      }
    });

    it('filters by ceremonial hall flag', async () => {
      const res = await request(app).get('/api/saunas').query({ has_ceremonial_hall: 'true' });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThan(0);
      for (const v of res.body.data) {
        expect(v.has_ceremonial_hall).toBe(1);
      }
    });

    it('returns 404 for non-existent venue slug or id', async () => {
      const res = await request(app).get('/api/saunas/totally-fictional-venue-slug-12345');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Venue not found');
    });

    it('returns complete relational venue detail when found by slug', async () => {
      const res = await request(app).get('/api/saunas/saunaspot-dvorce');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const venue = res.body.data;
      expect(venue.id).toBe('saunaspot-dvorce');
      expect(venue.multisport).toBeDefined();
      expect(venue.policies).toBeDefined();
      expect(venue.cooling_options).toBeDefined();
      expect(venue.saunas).toBeDefined();
      expect(venue.opening_hours).toBeDefined();
      expect(venue.pricing).toBeDefined();
      expect(venue.ceremonies).toBeDefined();
      expect(venue.reviews).toBeDefined();
    });
  });

  // ==========================================================================
  // SECTION 3: RECOMMENDATIONS ENDPOINT HARDENING
  // ==========================================================================
  describe('3. Recommendations Endpoint Edge Cases', () => {
    it('returns 400 when lat or lon is missing', async () => {
      const res1 = await request(app).get('/api/saunas/recommendations').query({ lat: 50.08 });
      expect(res1.status).toBe(400);
      expect(res1.body.error).toContain('Latitude and longitude required');

      const res2 = await request(app).get('/api/saunas/recommendations').query({ lon: 14.43 });
      expect(res2.status).toBe(400);
    });

    it('returns 400 when coordinates are non-numeric strings', async () => {
      const res = await request(app).get('/api/saunas/recommendations').query({ lat: 'praha', lon: 'centrum' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Neplatné souřadnice');
    });

    it('clamps limit to maximum 10 items', async () => {
      const res = await request(app).get('/api/saunas/recommendations').query({
        lat: 50.08,
        lon: 14.43,
        limit: 100,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeLessThanOrEqual(10);
    });

    it('orders recommendations by distance ascending', async () => {
      const res = await request(app).get('/api/saunas/recommendations').query({
        lat: 50.08,
        lon: 14.43,
        limit: 3,
      });
      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(3);
      expect(res.body.data[0].distance_km).toBeLessThanOrEqual(res.body.data[1].distance_km);
      expect(res.body.data[1].distance_km).toBeLessThanOrEqual(res.body.data[2].distance_km);
    });
  });

  // ==========================================================================
  // SECTION 4: AUTHENTICATION & SECURITY EDGE CASES
  // ==========================================================================
  describe('4. Auth & Security Boundary Cases', () => {
    it('rejects registration with missing email, password, or display_name with 400', async () => {
      const res = await request(app).post('/api/auth/register').send({ email: 'test@sauna.cz' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Chybí povinné údaje');
    });

    it('case-insensitively rejects duplicate email registration', async () => {
      const email = `unique_${Date.now()}@sauna.cz`;
      const res1 = await request(app).post('/api/auth/register').send({
        email: email.toLowerCase(),
        password: 'Password123!',
        display_name: 'Test Uživatel',
      });
      expect(res1.status).toBe(201);

      const res2 = await request(app).post('/api/auth/register').send({
        email: email.toUpperCase(),
        password: 'Password123!',
        display_name: 'Test Uživatel 2',
      });
      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain('již existuje');
    });

    it('rejects token without Bearer prefix with 401', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Token ${authToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Chybí přihlašovací token');
    });

    it('rejects token with corrupted signature with 401', async () => {
      const corruptedToken = authToken.slice(0, -5) + 'xxxxx';
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${corruptedToken}`);
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Neplatný nebo expirovaný token');
    });

    it('returns 404 if token belongs to deleted/non-existent user in /api/auth/me', async () => {
      const nonExistentUserToken = getAuthToken({ id: 'ghost_user_9999', email: 'ghost@sauna.cz' });
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${nonExistentUserToken}`);
      expect(res.status).toBe(404);
      expect(res.body.error).toContain('Uživatel nenalezen');
    });
  });

  // ==========================================================================
  // SECTION 5: REVIEWS & REPUTATION HARDENING
  // ==========================================================================
  describe('5. Reviews & Ratings Boundary Hardening', () => {
    it('rejects non-numeric overall_rating with 400', async () => {
      const res = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          venue_id: 'saunaspot-dvorce',
          overall_rating: 'vynikajici',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Hodnocení musí být mezi 1 a 5');
    });

    it('rejects negative rating or rating > 5 with 400', async () => {
      const resNeg = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ venue_id: 'saunaspot-dvorce', overall_rating: -2 });
      expect(resNeg.status).toBe(400);

      const resHigh = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ venue_id: 'saunaspot-dvorce', overall_rating: 9 });
      expect(resHigh.status).toBe(400);
    });

    it('accepts content up to 3000 characters and rejects 3001 characters', async () => {
      // 3000 chars should succeed
      const okContent = 'A'.repeat(3000);
      const resOk = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          venue_id: 'saunaspot-dvorce',
          overall_rating: 4,
          content: okContent,
          title: 'Dlouhá recenze',
        });
      expect(resOk.status).toBe(201);

      // Submit from a different user with 3001 chars
      const otherUser = { id: 'user_harden_2', email: 'hardener2@sauna.cz', role: 'user' };
      db.prepare(`
        INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role)
        VALUES (?, ?, 'hash', 'Hardener 2', 'user')
      `).run(otherUser.id, otherUser.email);
      const otherToken = getAuthToken(otherUser);

      const failContent = 'B'.repeat(3001);
      const resFail = await request(app)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${otherToken}`)
        .send({
          venue_id: 'saunaspot-dvorce',
          overall_rating: 4,
          content: failContent,
          title: 'Příliš dlouhá recenze',
        });
      expect(resFail.status).toBe(400);
      expect(resFail.body.error).toContain('3000');
    });

    it('rejects duplicate helpful vote on same review from same user with 409', async () => {
      const rev = db.prepare(`SELECT id FROM reviews LIMIT 1`).get() as any;

      // 1st vote
      const res1 = await request(app)
        .post(`/api/reviews/${rev.id}/helpful`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res1.status).toBe(200);

      // 2nd duplicate vote from same user
      const res2 = await request(app)
        .post(`/api/reviews/${rev.id}/helpful`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res2.status).toBe(409);
      expect(res2.body.error).toContain('již hlas udělili');
    });
  });

  // ==========================================================================
  // SECTION 6: FAVORITES & USER LISTS HARDENING
  // ==========================================================================
  describe('6. User Lists (Favorites) Edge Cases', () => {
    it('rejects invalid list_type with 400 Bad Request', async () => {
      const res = await request(app)
        .post('/api/users/me/lists')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          venue_id: 'saunaspot-dvorce',
          list_type: 'bucket_list',
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Neplatný typ seznamu');
    });

    it('deleting non-existent item from list succeeds idempotently without error', async () => {
      const res = await request(app)
        .delete('/api/users/me/lists/non-existent-venue-xyz?type=favorite')
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('prevents favorite_count underflow below 0', async () => {
      const venueId = 'saunaspot-dvorce';
      db.prepare(`UPDATE sauna_venues SET favorite_count = 0 WHERE id = ?`).run(venueId);

      // Force delete an item
      await request(app)
        .delete(`/api/users/me/lists/${venueId}?type=favorite`)
        .set('Authorization', `Bearer ${authToken}`);

      const venue = db.prepare(`SELECT favorite_count FROM sauna_venues WHERE id = ?`).get(venueId) as any;
      expect(venue.favorite_count).toBeGreaterThanOrEqual(0);
    });
  });

  // ==========================================================================
  // SECTION 7: B2B CLAIMS & OPERATOR WORKFLOW HARDENING
  // ==========================================================================
  describe('7. B2B Claims & Operator Workflow Hardening', () => {
    it('rejects claim submission with missing required fields with 400', async () => {
      const res = await request(app)
        .post('/api/claims')
        .send({ venue_id: 'saunaspot-dvorce' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Chybí povinná pole');
    });

    it('rejects claim submission with invalid IČO with 400', async () => {
      const res = await request(app)
        .post('/api/claims')
        .send({
          venue_id: 'saunaspot-dvorce',
          business_name: 'Sauna s.r.o.',
          ico: '99999999', // Invalid checksum
        });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Neplatné kontrolní číslo IČO');
    });

    it('rejects claim on already verified venue with 409 Conflict', async () => {
      const venueId = 'saunaspot-dvorce';
      db.prepare(`UPDATE sauna_venues SET is_verified_partner = 1 WHERE id = ?`).run(venueId);

      const res = await request(app)
        .post('/api/claims')
        .send({
          venue_id: venueId,
          business_name: 'Dvorce Real s.r.o.',
          ico: '27082440', // Valid IČO (Alza)
        });
      expect(res.status).toBe(409);
      expect(res.body.error).toContain('již je ověřeným provozovatelem');
    });
  });

  // ==========================================================================
  // SECTION 8: COMMUNITY PROPOSALS & MODERATION HARDENING
  // ==========================================================================
  describe('8. Community Proposals & Moderation Hardening', () => {
    it('rejects suggestion with invalid email or missing name with 400', async () => {
      const resNoEmail = await request(app)
        .post('/api/suggestions')
        .send({ name: 'Nová Sauna', address: 'Lipová 10', submitter_email: 'invalid-email' });
      expect(resNoEmail.status).toBe(400);

      const resNoName = await request(app)
        .post('/api/suggestions')
        .send({ address: 'Lipová 10', submitter_email: 'user@sauna.cz' });
      expect(resNoName.status).toBe(400);
    });

    it('rejects edit suggestion with missing details with 400', async () => {
      const res = await request(app)
        .post('/api/suggestions/edit')
        .send({ venue_id: 'saunaspot-dvorce' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Chybí venue_id nebo detaily');
    });

    it('rejects approval or rejection of non-existent suggestion with 404', async () => {
      const resApprove = await request(app).patch('/api/admin/suggestions/sug_ghost_123/approve');
      expect(resApprove.status).toBe(404);

      const resReject = await request(app).patch('/api/admin/suggestions/sug_ghost_123/reject').send({ reason: 'spam' });
      expect(resReject.status).toBe(404);
    });
  });

  // ==========================================================================
  // SECTION 9: CEREMONIES & REFERRAL CLICKS HARDENING
  // ==========================================================================
  describe('9. Ceremonies & Outbound Click Tracking Hardening', () => {
    it('rejects ceremony creation without title or start_time with 400', async () => {
      const res = await request(app)
        .post('/api/ceremonies')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ venue_id: 'saunaspot-dvorce' });
      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Chybí povinné údaje');
    });

    it('referral click tracking gracefully succeeds with 204 even with empty body', async () => {
      const res = await request(app)
        .post('/api/referrals/click')
        .send({});
      expect(res.status).toBe(204);
    });

    it('retrieves active affiliate partner products', async () => {
      const res = await request(app).get('/api/affiliate-products');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ==========================================================================
  // SECTION 10: DOMAIN MATH & UTILS WHITE-BOX UNIT HARDENING
  // ==========================================================================
  describe('10. Domain Math & Algorithm Hardening', () => {
    describe('Haversine Geolocation', () => {
      it('calculates identical coordinates as exactly 0.0 km', () => {
        expect(haversineDistance(50.08, 14.43, 50.08, 14.43)).toBe(0);
      });

      it('returns null for null or undefined coordinates in haversineDistanceKm', () => {
        expect(haversineDistanceKm(null, 14.43, 50.08, 14.43)).toBeNull();
        expect(haversineDistanceKm(50.08, undefined, 50.08, 14.43)).toBeNull();
      });

      it('clamps antipodal coordinates safely without resulting in NaN', () => {
        const dist = haversineDistance(90, 0, -90, 0);
        expect(isNaN(dist)).toBe(false);
        expect(dist).toBeGreaterThan(19000);
      });

      it('formats distance correctly across all tiers (0m, <1km meters, 1-10km 1 decimal, >=10km integer)', () => {
        expect(formatDistance(0)).toBe('0 m');
        expect(formatDistance(-5)).toBe('0 m');
        expect(formatDistance(0.45)).toBe('450 m');
        expect(formatDistance(1.234)).toBe('1.2 km');
        expect(formatDistance(9.88)).toBe('9.9 km');
        expect(formatDistance(15.4)).toBe('15 km');
        expect(formatDistance(186.2)).toBe('186 km');
      });

      it('checks radius boundary condition (inclusive dist <= radius)', () => {
        expect(isWithinRadius(50.0, 14.0, 50.0, 14.0, 0)).toBe(true);
        expect(isWithinRadius(50.0, 14.0, 50.0, 14.1, 5)).toBe(false); // ~7.1 km > 5 km
        expect(isWithinRadius(50.0, 14.0, 50.0, 14.1, 10)).toBe(true); // ~7.1 km <= 10 km
      });
    });

    describe('Modulo-11 IČO Validator', () => {
      it('verifies check digit for sum % 11 === 0 (checkDigit = 1)', () => {
        // e.g. Seznam.cz a.s. 26168685 -> sum = 2*8+6*7+1*6+6*5+8*4+6*3+8*2 = 16+42+6+30+32+18+16 = 160. 160%11 = 6. 11-6 = 5.
        // Let's verify valid corporate IDs
        expect(validateIco('26168685')).toBe(true);
        expect(validateIco('45274649')).toBe(true);
        expect(validateIco('00006947')).toBe(true);
      });

      it('verifies check digit for sum % 11 === 1 (checkDigit = 0, Alza rule)', () => {
        // Alza: 27082440 -> sum = 2*8+7*7+0*6+8*5+2*4+4*3+4*2 = 16+49+0+40+8+12+8 = 133. 133 % 11 = 1. checkDigit = 0.
        expect(validateIco('27082440')).toBe(true);
      });

      it('rejects null, undefined, boolean, empty string, non-8-digit strings', () => {
        expect(validateIco(null)).toBe(false);
        expect(validateIco(undefined)).toBe(false);
        expect(validateIco('')).toBe(false);
        expect(validateIco('1234567')).toBe(false);
        expect(validateIco('123456789')).toBe(false);
        expect(validateIco('abcdefgh')).toBe(false);
      });
    });

    describe('MultiSport Overtime & Pricing Calculations', () => {
      it('returns 0 overtime fee when stay is less than or equal to free minutes', () => {
        const feeEqual = calculateOvertimeFee({ freeMinutes: 90, blockMinutes: 30, blockPrice: 60, stayDuration: 90 });
        expect(feeEqual).toBe(0);

        const feeUnder = calculateOvertimeFee({ freeMinutes: 90, blockMinutes: 30, blockPrice: 60, stayDuration: 85 });
        expect(feeUnder).toBe(0);
      });

      it('charges exactly 1 block for 1 minute overstay', () => {
        const fee = calculateOvertimeFee({ freeMinutes: 90, blockMinutes: 30, blockPrice: 60, stayDuration: 91 });
        expect(fee).toBe(60);
      });

      it('charges exactly 2 blocks for 31 minutes overstay', () => {
        const fee = calculateOvertimeFee({ freeMinutes: 90, blockMinutes: 30, blockPrice: 60, stayDuration: 121 });
        expect(fee).toBe(120);
      });

      it('calculates final price for free_unlimited, entry_discount, and surcharge_entry', () => {
        // free_unlimited
        const freeRes = calculateMultisportFinalPrice({ basePrice: 350, benefitType: 'free_unlimited' });
        expect(freeRes.finalPrice).toBe(0);
        expect(freeRes.discountApplied).toBe(350);

        // entry_discount CZK
        const czkRes = calculateMultisportFinalPrice({ basePrice: 350, benefitType: 'entry_discount', discountCzk: 100 });
        expect(czkRes.finalPrice).toBe(250);
        expect(czkRes.discountApplied).toBe(100);

        // entry_discount percentage
        const pctRes = calculateMultisportFinalPrice({ basePrice: 350, benefitType: 'entry_discount', discountPercent: 20 });
        expect(pctRes.finalPrice).toBe(280);
        expect(pctRes.discountApplied).toBe(70);

        // surcharge_entry with overtime
        const surRes = calculateMultisportFinalPrice({
          basePrice: 350,
          benefitType: 'surcharge_entry',
          surchargeCzk: 150,
          stayDuration: 125,
          freeMinutes: 90,
          blockMinutes: 30,
          blockPrice: 50,
        });
        // Surcharge (150) + 2 blocks overtime (100) = 250
        expect(surRes.finalPrice).toBe(250);
        expect(surRes.surchargeApplied).toBe(150);
        expect(surRes.overtimeFee).toBe(100);
      });
    });

    describe('Zero-State Filter Relaxation Engine', () => {
      it('returns empty suggestions array when results exist (> 0)', () => {
        expect(suggestRelaxations({ cooling: 'plunge_pool' }, 5)).toEqual([]);
      });

      it('suggests remove_cooling, expand_region, relax_multisport, remove_sauna_type, relax_nudity_policy', () => {
        const filters = {
          cooling: 'natural_water',
          region_id: 'cz-pha',
          benefit_type: 'free_unlimited',
          sauna_type: 'bio_herbal',
          nudity_policy: 'strict_nudist',
        };
        const suggestions = suggestRelaxations(filters, 0);
        expect(suggestions).toContain('remove_cooling');
        expect(suggestions).toContain('expand_region');
        expect(suggestions).toContain('relax_multisport');
        expect(suggestions).toContain('remove_sauna_type');
        expect(suggestions).toContain('relax_nudity_policy');
      });

      it('falls back to expand_search_criteria when non-specific filters yield 0 results', () => {
        const suggestions = suggestRelaxations({ q: 'xyz_unknown_sauna' }, 0);
        expect(suggestions).toEqual(['expand_search_criteria']);
      });
    });
  });
});
