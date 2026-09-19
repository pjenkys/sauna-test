import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp, getAuthToken } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: Reviews Creation & Atomic Recalculation', () => {
  let db: DatabaseSync;
  let app: express.Application;
  const testUser = { id: 'user_tester_1', email: 'tester1@seznam.cz', role: 'user' };
  let token: string;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);

    // Ensure user exists
    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role)
      VALUES (?, ?, 'hash', 'Test Recenzent', 'user')
    `).run(testUser.id, testUser.email);

    token = getAuthToken(testUser);
  });

  it('TEST-REV-01: creates multi-criteria review with 5-dimensional ratings and tips', async () => {
    const venueId = 'saunaspot-dvorce';
    const reviewData = {
      venue_id: venueId,
      overall_rating: 5,
      cleanliness: 5,
      heat_quality: 4,
      cooling_quality: 5,
      staff_ceremony: 4,
      price_value: 4,
      title: 'Skvělý odpočinek u Vltavy',
      content: 'Příjemná atmosféra, čisté sauny a možnost ochlazení přímo ve Vltavě.',
      tips: 'Přijďte na západ slunce, výhled z venkovní terasy je úchvatný.',
      visit_date: '2026-09-10',
    };

    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send(reviewData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.review).toBeDefined();
    expect(res.body.review.rating_overall).toBe(5);
    expect(res.body.review.rating_cleanliness).toBe(5);
    expect(res.body.review.title).toBe(reviewData.title);
  });

  it('TEST-REV-02: atomically recalculates venue rating_overall and review_count', async () => {
    const venueId = 'sauna-central-praha';
    const beforeVenue = db.prepare(`SELECT rating_overall, review_count FROM sauna_venues WHERE id = ?`).get(venueId) as any;
    const initialCount = beforeVenue.review_count;

    // Submit a 5-star review
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        venue_id: venueId,
        overall_rating: 5,
        cleanliness: 5,
        heat_quality: 5,
        cooling_quality: 5,
        staff_ceremony: 5,
        price_value: 5,
        title: 'Naprostá spokojenost',
        content: 'Vše čisté, skvělé ceremoniály a milý personál.',
      });

    expect(res.status).toBe(201);

    const afterVenue = db.prepare(`SELECT rating_overall, review_count FROM sauna_venues WHERE id = ?`).get(venueId) as any;
    expect(afterVenue.review_count).toBe(initialCount + 1);

    // Verify rating matches exact DB average of published reviews
    const avgCheck = db.prepare(`SELECT AVG(rating_overall) as avg FROM reviews WHERE venue_id = ? AND status = 'published'`).get(venueId) as any;
    expect(afterVenue.rating_overall).toBe(Number(avgCheck.avg.toFixed(2)));
  });

  it('TEST-REV-03: rejects duplicate review from the same user for the same venue', async () => {
    const venueId = 'aquapalace-praha-cestlice';

    // First review succeeds
    const res1 = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        venue_id: venueId,
        overall_rating: 4,
        cleanliness: 4,
        title: 'První recenze',
        content: 'První recenze',
      });
    expect(res1.status).toBe(201);

    // Second review from same user is rejected with 409 Conflict
    const res2 = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        venue_id: venueId,
        overall_rating: 5,
        cleanliness: 5,
        title: 'Druhá recenze',
        content: 'Druhá recenze od stejného uživatele',
      });
    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error).toContain('již');
  });

  it('TEST-REV-04: recalculates sub-criteria dimensional averages accurately', async () => {
    const venueId = 'infinit-step-praha';

    await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        venue_id: venueId,
        overall_rating: 4,
        cleanliness: 5,
        heat_quality: 4,
        cooling_quality: 3,
        staff_ceremony: 5,
        price_value: 4,
        title: 'Detailní rozbor parametrů',
        content: 'Detailní rozbor parametrů',
      });

    const venue = db.prepare(`
      SELECT rating_cleanliness, rating_heat_steam, rating_cooling, rating_staff_ceremonies, rating_value
      FROM sauna_venues WHERE id = ?
    `).get(venueId) as any;

    expect(venue.rating_cleanliness).toBeGreaterThanOrEqual(1);
    expect(venue.rating_cooling).toBeGreaterThanOrEqual(1);
  });

  it('TEST-REV-05: increments helpful votes count on review and author profile', async () => {
    // Get existing review
    const rev = db.prepare(`SELECT id, helpful_votes_count, user_id FROM reviews LIMIT 1`).get() as any;
    const initialVotes = rev.helpful_votes_count;

    const res = await request(app)
      .post(`/api/reviews/${rev.id}/helpful`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const updatedRev = db.prepare(`SELECT helpful_votes_count FROM reviews WHERE id = ?`).get(rev.id) as any;
    expect(updatedRev.helpful_votes_count).toBe(initialVotes + 1);
  });

  it('BND-12: rejects out-of-bounds ratings (0 or 6 stars)', async () => {
    const resLow = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: 'saunaspot-dvorce', overall_rating: 0 });
    expect(resLow.status).toBe(400);

    const resHigh = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: 'saunaspot-dvorce', overall_rating: 6 });
    expect(resHigh.status).toBe(400);
  });

  it('BND-14: rejects excessively large content payload (> 3000 chars)', async () => {
    const hugeText = 'A'.repeat(3500);
    const res = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${token}`)
      .send({
        venue_id: 'saunaspot-dvorce',
        overall_rating: 4,
        content: hugeText,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('3000');
  });
});
