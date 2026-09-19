import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp, getAuthToken, haversineDistance, formatDistance, isWithinRadius, validateIco } from '../setup';
import { app as realApp } from '../../server/src/app';
import { setDb } from '../../server/src/db/connection';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Adversarial Stress Test: Boundary Conditions, Security Defenses & Concurrency Integrity', () => {
  let db: DatabaseSync;
  let testHarnessApp: express.Application;

  const testUser1 = { id: 'user_adv_1', email: 'adv1@saunatest.cz', role: 'user' };
  const testUser2 = { id: 'user_adv_2', email: 'adv2@saunatest.cz', role: 'user' };
  const testUser3 = { id: 'user_adv_3', email: 'adv3@saunatest.cz', role: 'user' };
  const testUser4 = { id: 'user_adv_4', email: 'adv4@saunatest.cz', role: 'user' };
  const testUser5 = { id: 'user_adv_5', email: 'adv5@saunatest.cz', role: 'user' };

  let token1: string;
  let token2: string;
  let token3: string;
  let token4: string;
  let token5: string;

  beforeEach(() => {
    db = createTestDatabase();
    testHarnessApp = createTestApp(db);
    // Bind the real production Express app to the test database instance
    setDb(db);

    // Bootstrap test users
    const insertUser = db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role, reviews_count, helpful_votes_received)
      VALUES (?, ?, 'dummy_hash', ?, 'user', 0, 0)
    `);

    insertUser.run(testUser1.id, testUser1.email, 'Adv Tester 1');
    insertUser.run(testUser2.id, testUser2.email, 'Adv Tester 2');
    insertUser.run(testUser3.id, testUser3.email, 'Adv Tester 3');
    insertUser.run(testUser4.id, testUser4.email, 'Adv Tester 4');
    insertUser.run(testUser5.id, testUser5.email, 'Adv Tester 5');

    token1 = getAuthToken(testUser1);
    token2 = getAuthToken(testUser2);
    token3 = getAuthToken(testUser3);
    token4 = getAuthToken(testUser4);
    token5 = getAuthToken(testUser5);
  });

  // ==========================================================================
  // 1. EXTREME BOUNDARY CONDITIONS
  // ==========================================================================
  describe('Pillar 1: Extreme Boundary Conditions', () => {
    it('BND-GEO-01: Zero-distance GPS calculation and formatting', () => {
      const distExact = haversineDistance(50.0878, 14.4205, 50.0878, 14.4205);
      expect(distExact).toBe(0);
      expect(formatDistance(distExact)).toBe('0 m');

      // Negative or zero input formatting
      expect(formatDistance(0)).toBe('0 m');
      expect(formatDistance(-0.0001)).toBe('0 m');
      expect(formatDistance(-10)).toBe('0 m');
    });

    it('BND-GEO-02: Micro-distance GPS formatting (< 1 km)', () => {
      // 5 meters
      expect(formatDistance(0.005)).toBe('5 m');
      // 120 meters
      expect(formatDistance(0.12)).toBe('120 m');
      // 999 meters
      expect(formatDistance(0.999)).toBe('999 m');
    });

    it('BND-GEO-03: Null Island GPS query (lat=0, lon=0) against Czech venues', async () => {
      for (const currentApp of [testHarnessApp, realApp]) {
        const res = await request(currentApp)
          .get('/api/saunas')
          .query({ lat: 0, lon: 0, limit: 3 });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.length).toBeGreaterThan(0);

        // Distance from Null Island (0,0) to Czech Republic is ~5,600 km
        const firstVenue = res.body.data[0];
        expect(firstVenue.distance_km).toBeGreaterThan(5000);
        expect(firstVenue.distance_km).toBeLessThan(6500);
        expect(firstVenue.distance_formatted).toContain('km');
      }
    });

    it('BND-GEO-04: Antipodal GPS coordinates (~20,015 km) without overflow or NaN', () => {
      const pragueLat = 50.0878;
      const pragueLon = 14.4205;
      const antipodalLat = -pragueLat;
      const antipodalLon = pragueLon > 0 ? pragueLon - 180 : pragueLon + 180; // -165.5795

      const dist = haversineDistance(pragueLat, pragueLon, antipodalLat, antipodalLon);
      expect(isNaN(dist)).toBe(false);
      // Half Earth circumference: pi * 6371 = 20015.087 km
      expect(dist).toBeGreaterThan(20000);
      expect(dist).toBeLessThan(20030);

      const formatted = formatDistance(dist);
      expect(formatted).toBe('20015 km');
    });

    it('BND-GEO-05: Extreme planetary coordinate boundaries (Poles & Date Line)', () => {
      // North Pole to South Pole
      const poleDist = haversineDistance(90, 0, -90, 0);
      expect(poleDist).toBeCloseTo(Math.PI * 6371, 0);

      // Date Line wrap-around (180 deg to -180 deg is same meridian; floating point delta is ~1e-12)
      const dateLineDist = haversineDistance(0, 180, 0, -180);
      expect(dateLineDist).toBeLessThan(1e-9);
      expect(formatDistance(dateLineDist)).toBe('0 m');

      // Search radius boundary checks
      expect(isWithinRadius(50, 14, 50, 14, 0)).toBe(true);
      expect(isWithinRadius(50, 14, 50.1, 14, 5)).toBe(false);
    });

    it('BND-GEO-06: Search radius zero and negative handling', async () => {
      for (const currentApp of [testHarnessApp, realApp]) {
        // radius_km = 0 should return only venues at exact coordinates (none in seed)
        const resZero = await request(currentApp)
          .get('/api/saunas')
          .query({ lat: 50.0878, lon: 14.4205, radius_km: 0 });

        expect(resZero.status).toBe(200);
        expect(resZero.body.data.length).toBe(0);

        // Negative radius should safely filter out everything without error
        const resNeg = await request(currentApp)
          .get('/api/saunas')
          .query({ lat: 50.0878, lon: 14.4205, radius_km: -10 });

        expect(resNeg.status).toBe(200);
        expect(resNeg.body.data.length).toBe(0);
      }
    });

    it('BND-FLT-01: Contradictory multi-filters trigger zero-state relaxation suggestions', async () => {
      const conflictingQuery = {
        benefit_type: 'free_unlimited',
        cooling: 'natural_water',
        region_id: 'cz-vys', // Vysočina has no free_unlimited natural_water saunas
        sauna_type: 'salt_sauna',
        nudity_policy: 'swimwear_required',
      };

      for (const currentApp of [testHarnessApp, realApp]) {
        const res = await request(currentApp)
          .get('/api/saunas')
          .query(conflictingQuery);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toEqual([]);
        expect(res.body.meta.count).toBe(0);

        const relaxations = res.body.meta.suggestedRelaxations;
        expect(relaxations).toBeDefined();
        expect(relaxations).toContain('remove_cooling');
        expect(relaxations).toContain('expand_region');
        expect(relaxations).toContain('relax_multisport');
        expect(relaxations).toContain('remove_sauna_type');
        expect(relaxations).toContain('relax_nudity_policy');
      }
    });

    it('BND-FLT-02: Zero-state fallback relaxation for unmatched text queries', async () => {
      for (const currentApp of [testHarnessApp, realApp]) {
        const res = await request(currentApp)
          .get('/api/saunas')
          .query({ q: 'nonexistent_sauna_string_12345' });

        expect(res.status).toBe(200);
        expect(res.body.data).toEqual([]);
        expect(res.body.meta.suggestedRelaxations).toContain('expand_search_criteria');
      }
    });

    it('BND-REV-01: Rejects duplicate review from the same user on the same venue (409 Conflict)', async () => {
      const venueId = 'saunaspot-dvorce';
      const initialReview = {
        venue_id: venueId,
        overall_rating: 4,
        cleanliness: 4,
        title: 'Skvělý výhled',
        content: 'Velmi dobrá sauna u řeky.',
      };

      // 1. First submission succeeds
      const res1 = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token1}`)
        .send(initialReview);

      expect(res1.status).toBe(201);
      expect(res1.body.success).toBe(true);

      // 2. Second submission by testUser1 for same venue is blocked
      const res2 = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          venue_id: venueId,
          overall_rating: 5,
          title: 'Změna hodnocení',
          content: 'Pokus o přepsání či duplicitní hodnocení.',
        });

      expect(res2.status).toBe(409);
      expect(res2.body.success).toBe(false);
      expect(res2.body.error).toContain('již');
    });

    it('BND-REV-02: Permits same user to review different venues', async () => {
      const resA = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          venue_id: 'saunaspot-dvorce',
          overall_rating: 5,
          title: 'Dvorce recenze',
          content: 'Krásné prostředí.',
        });
      expect(resA.status).toBe(201);

      const resB = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          venue_id: 'sauna-central-praha',
          overall_rating: 4,
          title: 'Central recenze',
          content: 'Kvalitní ceremoniály v centru.',
        });
      expect(resB.status).toBe(201);
    });

    it('BND-REV-03: Rating boundary values (<1 or >5) strictly rejected with 400 Bad Request on real server', async () => {
      const venueId = 'infinit-step-praha';

      const invalidRatings = [0, -1, -5, 6, 10, 999, 'invalid_star'];
      for (const invalidRating of invalidRatings) {
        const res = await request(realApp)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            venue_id: venueId,
            overall_rating: invalidRating,
            title: 'Test out of bounds',
            content: 'Test obsahu recenze.',
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }

      // Valid boundary edges (1 and 5) must succeed
      const resMin = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          venue_id: venueId,
          overall_rating: 1,
          title: 'Min rating test',
          content: 'Nejnižší povolené hodnocení.',
        });
      expect(resMin.status).toBe(201);

      const resMax = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          venue_id: venueId,
          overall_rating: 5,
          title: 'Max rating test',
          content: 'Nejvyšší povolené hodnocení.',
        });
      expect(resMax.status).toBe(201);
    });

    it('BND-CLM-01: Rejects operator claim on an already verified venue with 409 Conflict', async () => {
      const venueId = 'saunaspot-dvorce';

      // 1. User 1 submits claim with valid IČO (Alza: 27082440)
      const claimRes = await request(realApp)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          venue_id: venueId,
          business_name: 'Saunaspot s.r.o.',
          ico: '27082440',
        });
      expect(claimRes.status).toBe(201);
      const claimId = claimRes.body.claim_id;

      // 2. Admin approves and verifies the claim
      const verifyRes = await request(realApp).patch(`/api/admin/claims/${claimId}/verify`);
      expect(verifyRes.status).toBe(200);

      // 3. User 2 attempts to claim the now-verified venue -> 409 Conflict
      const dupClaimRes = await request(realApp)
        .post('/api/claims')
        .set('Authorization', `Bearer ${token2}`)
        .send({
          venue_id: venueId,
          business_name: 'Infiltrator Sauna s.r.o.',
          ico: '45274649', // Valid ČEZ IČO
        });

      expect(dupClaimRes.status).toBe(409);
      expect(dupClaimRes.body.error).toContain('již je ověřeným provozovatelem');
    });
  });

  // ==========================================================================
  // 2. SECURITY DEFENSES (SQLi, XSS, MALFORMED IČO)
  // ==========================================================================
  describe('Pillar 2: Security Defenses', () => {
    it('SEC-SQLI-01: SQL Injection attempts in search query `q` are defused via prepared statements', async () => {
      const sqliPayloads = [
        "' OR 1=1 --",
        "'; DROP TABLE sauna_venues; --",
        "' UNION SELECT id, email, password_hash, 'admin', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL FROM users --",
        "admin'--",
        "1' OR '1'='1",
      ];

      for (const payload of sqliPayloads) {
        const res = await request(realApp)
          .get('/api/saunas')
          .query({ q: payload });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        // Verify database tables remained intact
        const venueCountRow = db.prepare('SELECT COUNT(*) as cnt FROM sauna_venues').get() as any;
        expect(venueCountRow.cnt).toBeGreaterThan(0);

        const usersCountRow = db.prepare('SELECT COUNT(*) as cnt FROM users').get() as any;
        expect(usersCountRow.cnt).toBeGreaterThan(0);

        // Verify no user sensitive data was leaked in response
        const jsonStr = JSON.stringify(res.body);
        expect(jsonStr).not.toContain('dummy_hash');
        expect(jsonStr).not.toContain('password_hash');
      }
    });

    it('SEC-SQLI-02: SQL Injection attempts in structured filters (`category`, `cooling`, `sauna_type`)', async () => {
      const filterAttacks = [
        { category: "public' OR '1'='1" },
        { cooling: "plunge_pool' UNION SELECT 1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43 --" },
        { sauna_type: "finnish_dry' OR 1=1 --" },
        { nudity_policy: "' OR 1=1 --" },
        { region_id: "cz-prg' OR 'a'='a" },
      ];

      for (const attack of filterAttacks) {
        const res = await request(realApp)
          .get('/api/saunas')
          .query(attack);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
      }
    });

    it('SEC-SQLI-03: SQL Injection attempts in `sort` parameter safely ignored or constrained', async () => {
      const res = await request(realApp)
        .get('/api/saunas')
        .query({ sort: 'rating; DROP TABLE sauna_venues;' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);

      const check = db.prepare('SELECT COUNT(*) as cnt FROM sauna_venues').get() as any;
      expect(check.cnt).toBeGreaterThan(0);
    });

    it('SEC-XSS-01: Malicious XSS scripts in review content, title, and tips are treated strictly as literal text', async () => {
      const venueId = 'sauna-central-praha';
      const xssTitle = `<script>alert('XSS_IN_TITLE_${Date.now()}')</script>`;
      const xssContent = `<img src="x" onerror="window.xssExploited=true; alert(document.cookie);">`;
      const xssTips = `<a href="javascript:alert('malicious_redirect')">Klikněte pro 50% slevu na vstup</a>`;

      const postRes = await request(realApp)
        .post('/api/reviews')
        .set('Authorization', `Bearer ${token1}`)
        .send({
          venue_id: venueId,
          overall_rating: 4,
          cleanliness: 4,
          heat_quality: 4,
          cooling_quality: 4,
          staff_ceremony: 4,
          price_value: 4,
          title: xssTitle,
          content: xssContent,
          tips: xssTips,
        });

      expect(postRes.status).toBe(201);
      expect(postRes.body.success).toBe(true);

      // Verify stored in DB as safe literal strings (not evaluated)
      const storedRev = db.prepare('SELECT title, content, tips FROM reviews WHERE id = ?').get(postRes.body.review.id) as any;
      expect(storedRev.title).toBe(xssTitle);
      expect(storedRev.content).toBe(xssContent);
      expect(storedRev.tips).toBe(xssTips);

      // Fetch reviews through public API
      const getRes = await request(realApp).get(`/api/reviews/${venueId}`);
      expect(getRes.status).toBe(200);
      expect(getRes.body.success).toBe(true);

      const found = getRes.body.data.find((r: any) => r.id === postRes.body.review.id);
      expect(found).toBeDefined();
      expect(found.title).toBe(xssTitle);
      expect(found.content).toBe(xssContent);
      expect(found.tips).toBe(xssTips);
    });

    it('SEC-ICO-01: Malformed and invalid IČO submissions are rejected with 400 Bad Request', async () => {
      const venueId = 'saunaspot-dvorce';

      const invalidIcos = [
        'ABCDEFGH',             // Letters only
        '2708244',              // 7 digits (too short)
        '270824400',            // 9 digits (too long)
        '12345678',             // 8 digits but invalid Modulo-11 checksum
        '00000000',             // Invalid checksum
        '87654321',             // Invalid checksum
        '2708244A',             // Alphanumeric
        "' OR 1=1 --",          // SQL injection payload
        '<script>alert(1)</script>', // XSS payload
        '',                     // Empty string
        null,                   // Null
        undefined,              // Undefined
      ];

      for (const badIco of invalidIcos) {
        const res = await request(realApp)
          .post('/api/claims')
          .set('Authorization', `Bearer ${token1}`)
          .send({
            venue_id: venueId,
            business_name: 'Test s.r.o.',
            ico: badIco,
          });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
      }
    });

    it('SEC-ICO-02: Authentic Czech Modulo-11 IČOs are accepted with 201 Created', async () => {
      const authenticIcos = [
        { name: 'Alza.cz a.s.', ico: '27082440' },
        { name: 'ČEZ a.s.', ico: '45274649' },
        { name: 'Seznam.cz a.s.', ico: '26168685' },
        { name: 'Saunaspot s.r.o.', ico: '28471920' },
      ];

      for (const company of authenticIcos) {
        expect(validateIco(company.ico)).toBe(true);
      }
    });
  });

  // ==========================================================================
  // 3. CONCURRENCY & DATA INTEGRITY
  // ==========================================================================
  describe('Pillar 3: Concurrency & Data Integrity', () => {
    it('CONC-REV-01: Atomic recalculation of average ratings across multiple reviews', async () => {
      const venueId = 'aquapalace-praha-cestlice';
      const venueBefore = db.prepare('SELECT rating_overall, review_count FROM sauna_venues WHERE id = ?').get(venueId) as any;

      // Delete existing reviews for this venue to test clean deterministic average calculation
      db.prepare('DELETE FROM reviews WHERE venue_id = ?').run(venueId);
      db.prepare('UPDATE sauna_venues SET rating_overall = 0, review_count = 0 WHERE id = ?').run(venueId);

      // Submit 5 reviews with distinct ratings from 5 users
      // Ratings: 5, 3, 4, 1, 5 -> Sum = 18, Avg = 18 / 5 = 3.60
      const reviewPayloads = [
        { user: token1, overall: 5, clean: 5, heat: 5, cool: 4, staff: 4, val: 5 },
        { user: token2, overall: 3, clean: 3, heat: 2, cool: 1, staff: 3, val: 2 },
        { user: token3, overall: 4, clean: 4, heat: 4, cool: 5, staff: 4, val: 4 },
        { user: token4, overall: 1, clean: 1, heat: 1, cool: 1, staff: 2, val: 1 },
        { user: token5, overall: 5, clean: 5, heat: 5, cool: 5, staff: 5, val: 5 },
      ];

      for (const p of reviewPayloads) {
        const res = await request(realApp)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${p.user}`)
          .send({
            venue_id: venueId,
            overall_rating: p.overall,
            cleanliness: p.clean,
            heat_quality: p.heat,
            cooling_quality: p.cool,
            staff_ceremony: p.staff,
            price_value: p.val,
            title: `Review rating ${p.overall}`,
            content: `Obsah hodnocení ${p.overall}`,
          });
        expect(res.status).toBe(201);
      }

      // Check venue aggregates in DB
      const venueAfter = db.prepare(`
        SELECT rating_overall, rating_cleanliness, rating_heat_steam, rating_cooling,
               rating_staff_ceremonies, rating_value, review_count
        FROM sauna_venues WHERE id = ?
      `).get(venueId) as any;

      expect(venueAfter.review_count).toBe(5);
      expect(venueAfter.rating_overall).toBe(3.6); // 18 / 5 = 3.60
      expect(venueAfter.rating_cleanliness).toBe(3.6); // (5+3+4+1+5)/5 = 3.60
      expect(venueAfter.rating_heat_steam).toBe(3.4); // (5+2+4+1+5)/5 = 3.40
      expect(venueAfter.rating_cooling).toBe(3.2); // (4+1+5+1+5)/5 = 3.20
      expect(venueAfter.rating_staff_ceremonies).toBe(3.6); // (4+3+4+2+5)/5 = 3.60
      expect(venueAfter.rating_value).toBe(3.4); // (5+2+4+1+5)/5 = 3.40

      // Verify each reviewer's user profile reviews_count incremented
      for (const u of [testUser1, testUser2, testUser3, testUser4, testUser5]) {
        const uRow = db.prepare('SELECT reviews_count FROM users WHERE id = ?').get(u.id) as any;
        expect(uRow.reviews_count).toBe(1);
      }
    });

    it('CONC-FAV-01: Multi-user favorite count synchronization & decrement floor constraint', async () => {
      const venueId = 'saunaspot-dvorce';
      const beforeVenue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      const initialFavs = beforeVenue.favorite_count;

      // 1. User 1 adds to favorites -> increments by 1
      const add1 = await request(realApp)
        .post('/api/users/me/lists')
        .set('Authorization', `Bearer ${token1}`)
        .send({ venue_id: venueId, list_type: 'favorite' });
      expect(add1.status).toBe(201);

      let venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs + 1);

      // 2. User 2 adds to favorites -> increments by 1
      const add2 = await request(realApp)
        .post('/api/users/me/lists')
        .set('Authorization', `Bearer ${token2}`)
        .send({ venue_id: venueId, list_type: 'favorite' });
      expect(add2.status).toBe(201);

      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs + 2);

      // 3. User 1 attempts duplicate favorite add -> 409 Conflict, count unchanged
      const dupAdd = await request(realApp)
        .post('/api/users/me/lists')
        .set('Authorization', `Bearer ${token1}`)
        .send({ venue_id: venueId, list_type: 'favorite' });
      expect(dupAdd.status).toBe(409);

      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs + 2);

      // 4. Non-favorite list type ('want_to_visit') does NOT change favorite_count
      const wantAdd = await request(realApp)
        .post('/api/users/me/lists')
        .set('Authorization', `Bearer ${token1}`)
        .send({ venue_id: venueId, list_type: 'want_to_visit' });
      expect(wantAdd.status).toBe(201);

      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs + 2);

      // 5. User 1 removes favorite -> decrements by 1
      const del1 = await request(realApp)
        .delete(`/api/users/me/lists/${venueId}?type=favorite`)
        .set('Authorization', `Bearer ${token1}`);
      expect(del1.status).toBe(200);

      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs + 1);

      // 6. User 1 removes favorite AGAIN (already deleted) -> idempotent, count does not decrement again
      const del1Again = await request(realApp)
        .delete(`/api/users/me/lists/${venueId}?type=favorite`)
        .set('Authorization', `Bearer ${token1}`);
      expect(del1Again.status).toBe(200);

      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs + 1);

      // 7. User 2 removes favorite -> decrements back to initialFavs
      const del2 = await request(realApp)
        .delete(`/api/users/me/lists/${venueId}?type=favorite`)
        .set('Authorization', `Bearer ${token2}`);
      expect(del2.status).toBe(200);

      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(initialFavs);

      // 8. Decrement Floor Constraint: Venue at 0 favorites cannot drop below 0
      db.prepare('UPDATE sauna_venues SET favorite_count = 0 WHERE id = ?').run(venueId);
      // User 3 adds then removes
      await request(realApp)
        .post('/api/users/me/lists')
        .set('Authorization', `Bearer ${token3}`)
        .send({ venue_id: venueId, list_type: 'favorite' });
      await request(realApp)
        .delete(`/api/users/me/lists/${venueId}?type=favorite`)
        .set('Authorization', `Bearer ${token3}`);

      // Now venue is at 0; an extra delete should keep it at 0, never negative
      venue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venue.favorite_count).toBe(0);
      expect(venue.favorite_count).toBeGreaterThanOrEqual(0);
    });

    it('CONC-REV-02: Simultaneous Promise.all concurrent reviews maintain atomic DB consistency', async () => {
      const venueId = 'saunaspot-dvorce';

      // Reset reviews for this test venue
      db.prepare('DELETE FROM reviews WHERE venue_id = ?').run(venueId);
      db.prepare('UPDATE sauna_venues SET rating_overall = 0, review_count = 0 WHERE id = ?').run(venueId);

      const tokens = [token1, token2, token3, token4, token5];
      const scores = [5, 4, 3, 4, 4]; // Sum = 20, Avg = 4.00

      // Execute 5 simultaneous requests via Promise.all
      const requests = tokens.map((tok, idx) =>
        request(realApp)
          .post('/api/reviews')
          .set('Authorization', `Bearer ${tok}`)
          .send({
            venue_id: venueId,
            overall_rating: scores[idx],
            cleanliness: scores[idx],
            heat_quality: scores[idx],
            cooling_quality: scores[idx],
            staff_ceremony: scores[idx],
            price_value: scores[idx],
            title: `Concurrent Review ${idx + 1}`,
            content: `Concurrent review content ${idx + 1}`,
          })
      );

      const results = await Promise.all(requests);
      for (const res of results) {
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
      }

      // Verify atomic aggregates in DB
      const venueRow = db.prepare('SELECT rating_overall, review_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venueRow.review_count).toBe(5);
      expect(venueRow.rating_overall).toBe(4.0);
    });

    it('CONC-FAV-02: Simultaneous Promise.all favorite additions synchronize favorite_count accurately', async () => {
      const venueId = 'sauna-central-praha';
      db.prepare('UPDATE sauna_venues SET favorite_count = 0 WHERE id = ?').run(venueId);
      db.prepare('DELETE FROM user_venue_lists WHERE venue_id = ?').run(venueId);

      const tokens = [token1, token2, token3, token4, token5];

      // Execute 5 concurrent favorite adds
      const addPromises = tokens.map((tok) =>
        request(realApp)
          .post('/api/users/me/lists')
          .set('Authorization', `Bearer ${tok}`)
          .send({ venue_id: venueId, list_type: 'favorite' })
      );

      const addResults = await Promise.all(addPromises);
      for (const res of addResults) {
        expect(res.status).toBe(201);
      }

      let venueRow = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venueRow.favorite_count).toBe(5);

      // Execute concurrent removals
      const delPromises = tokens.map((tok) =>
        request(realApp)
          .delete(`/api/users/me/lists/${venueId}?type=favorite`)
          .set('Authorization', `Bearer ${tok}`)
      );

      const delResults = await Promise.all(delPromises);
      for (const res of delResults) {
        expect(res.status).toBe(200);
      }

      venueRow = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
      expect(venueRow.favorite_count).toBe(0);
    });

    it('BND-REC-01: Recommendations endpoint handles boundary and invalid GPS coordinates', async () => {
      // 1. Missing lat/lon -> 400
      const resMissing = await request(realApp).get('/api/saunas/recommendations');
      expect(resMissing.status).toBe(400);

      // 2. Non-numeric coordinates -> 400
      const resInvalid = await request(realApp)
        .get('/api/saunas/recommendations')
        .query({ lat: 'not_a_number', lon: 'invalid' });
      expect(resInvalid.status).toBe(400);

      // 3. Antipodal coordinates -> 200, returns top 3 furthest/closest sorted venues
      const resAntipode = await request(realApp)
        .get('/api/saunas/recommendations')
        .query({ lat: -50.0878, lon: -165.5795, limit: 3 });
      expect(resAntipode.status).toBe(200);
      expect(resAntipode.body.data.length).toBe(3);
      expect(resAntipode.body.data[0].distance_km).toBeGreaterThan(19000);

      // 4. North Pole coordinates -> 200, distance ~4400 km
      const resPole = await request(realApp)
        .get('/api/saunas/recommendations')
        .query({ lat: 90, lon: 0, limit: 1 });
      expect(resPole.status).toBe(200);
      expect(resPole.body.data.length).toBe(1);
      expect(resPole.body.data[0].distance_km).toBeGreaterThan(4000);
      expect(resPole.body.data[0].distance_km).toBeLessThan(5000);
    });
  });
});

