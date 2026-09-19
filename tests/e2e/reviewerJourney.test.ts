import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Tier 4 E2E Journey 2: The Ceremonial Sauna Connoisseur (Lenka)', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('executes full ceremonial reviewer journey: map markers -> ceremony filter -> detail & rituals -> 5-criteria review -> atomic rating recalc -> helpful vote', async () => {
    // 1. Lenka navigates to the interactive map (/mapa) and loads geo-markers
    const markersRes = await request(app).get('/api/saunas/map-markers');
    expect(markersRes.status).toBe(200);
    expect(markersRes.body.success).toBe(true);
    expect(markersRes.body.data.length).toBe(26);

    const maximusMarker = markersRes.body.data.find((m: any) => m.slug === 'infinit-maximus-brno' || m.id === 'infinit-maximus-brno');
    expect(maximusMarker).toBeDefined();
    expect(maximusMarker.is_promoted).toBe(1);
    expect(maximusMarker.promoted_badge).toContain('Doporučeno');

    // 2. Lenka filters map / saunas by Ceremonial Hall + Plunge pool in South Moravia (cz-jhm)
    const filterRes = await request(app)
      .get('/api/saunas')
      .query({
        has_ceremonial_hall: 'true',
        cooling: 'plunge_pool',
        region_id: 'cz-jhm',
      });

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.success).toBe(true);
    const maximusInSearch = filterRes.body.data.find((v: any) => v.id === 'infinit-maximus-brno');
    expect(maximusInSearch).toBeDefined();
    expect(maximusInSearch.has_ceremonial_hall).toBe(1);
    expect(maximusInSearch.has_plunge_pool).toBe(1);

    // 3. Lenka views venue detail and ceremony calendar for Infinit Maximus
    const detailRes = await request(app).get('/api/saunas/infinit-maximus-brno');
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.name).toBe('Infinit Maximus Brno');

    const ceremoniesRes = await request(app)
      .get('/api/ceremonies')
      .query({ venue_id: 'infinit-maximus-brno' });
    expect(ceremoniesRes.status).toBe(200);
    expect(Array.isArray(ceremoniesRes.body.data)).toBe(true);

    // Record pre-review state from database
    const preVenue = db.prepare(`
      SELECT rating_overall, review_count, rating_cleanliness, rating_heat_steam,
             rating_cooling, rating_staff_ceremonies, rating_value
      FROM sauna_venues WHERE id = 'infinit-maximus-brno'
    `).get() as any;

    const initialReviewCount = preVenue.review_count;

    // 4. Lenka creates an account & logs in
    const authRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'lenka.connoisseur@seznam.cz',
        password: 'LenkaSaunaPass2026!',
        display_name: 'Lenka Recenzentka',
      });
    expect(authRes.status).toBe(201);
    const lenkaToken = authRes.body.token;
    const lenkaUserId = authRes.body.user.id;

    // 5. Lenka submits a comprehensive 5-criteria ČSFD-style review
    const reviewPayload = {
      venue_id: 'infinit-maximus-brno',
      rating_overall: 5,
      rating_cleanliness: 5,
      rating_heat_steam: 5,
      rating_cooling: 5,
      rating_staff_ceremonies: 5,
      rating_value: 4,
      title: 'Nejlepší ceremoniály na Moravě',
      content: 'Zážitková sauna s výhledem na přehradu a skvělý saunér Jakub.',
      tips: 'Přijďte na ceremoniál alespoň 15 minut předem, bývá plno.',
      visit_date: '2026-09-10',
    };

    const reviewRes = await request(app)
      .post('/api/reviews')
      .set('Authorization', `Bearer ${lenkaToken}`)
      .send(reviewPayload);

    expect(reviewRes.status).toBe(201);
    expect(reviewRes.body.success).toBe(true);
    expect(reviewRes.body.review).toBeDefined();
    const createdReviewId = reviewRes.body.review.id;

    // 6. Atomic recalculation verification: venue ratings updated atomically
    const postVenue = db.prepare(`
      SELECT rating_overall, review_count, rating_cleanliness, rating_heat_steam,
             rating_cooling, rating_staff_ceremonies, rating_value
      FROM sauna_venues WHERE id = 'infinit-maximus-brno'
    `).get() as any;

    expect(postVenue.review_count).toBe(initialReviewCount + 1);
    expect(postVenue.rating_overall).toBeGreaterThan(0);
    expect(postVenue.rating_cleanliness).toBeGreaterThan(0);
    expect(postVenue.rating_heat_steam).toBeGreaterThan(0);
    expect(postVenue.rating_cooling).toBeGreaterThan(0);
    expect(postVenue.rating_staff_ceremonies).toBeGreaterThan(0);
    expect(postVenue.rating_value).toBeGreaterThan(0);

    // 7. Lenka verifies her review appears in public venue reviews feed
    const listReviewsRes = await request(app).get('/api/reviews/infinit-maximus-brno');
    expect(listReviewsRes.status).toBe(200);
    expect(listReviewsRes.body.success).toBe(true);

    const reviews = listReviewsRes.body.data;
    expect(reviews.length).toBeGreaterThan(0);
    const myReview = reviews.find((r: any) => r.id === createdReviewId);
    expect(myReview).toBeDefined();
    expect(myReview.title).toBe(reviewPayload.title);
    expect(myReview.user_name).toBe('Lenka Recenzentka');

    // 8. Another community user marks Lenka's review as helpful
    const voterRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'ondrej.voter@seznam.cz',
        password: 'OndrejPass2026!',
        display_name: 'Ondřej Čtenář',
      });
    const voterToken = voterRes.body.token;

    const helpfulRes = await request(app)
      .post(`/api/reviews/${createdReviewId}/helpful`)
      .set('Authorization', `Bearer ${voterToken}`);

    expect(helpfulRes.status).toBe(200);
    expect(helpfulRes.body.success).toBe(true);

    // Verify vote count on review and author's profile
    const updatedReview = db.prepare('SELECT helpful_votes_count FROM reviews WHERE id = ?').get(createdReviewId) as any;
    expect(updatedReview.helpful_votes_count).toBe(1);

    const authorProfile = db.prepare('SELECT helpful_votes_received FROM users WHERE id = ?').get(lenkaUserId) as any;
    expect(authorProfile.helpful_votes_received).toBe(1);
  });
});
