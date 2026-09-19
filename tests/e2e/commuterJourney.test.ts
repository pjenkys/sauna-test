import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Tier 4 E2E Journey 1: The Prague MultiSport Commuter (Petr)', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('executes full commuter journey: geolocation nearest -> 90m MS filter -> detail inspection -> auth -> favorites save', async () => {
    // 1. Petr arrives at landing page; Geolocation API detects Prague 4 / Podolí coordinates
    const pragueLat = 50.0531;
    const pragueLon = 14.4172;

    const recsRes = await request(app)
      .get('/api/saunas/recommendations')
      .query({ lat: pragueLat, lon: pragueLon, limit: 3 });

    expect(recsRes.status).toBe(200);
    expect(recsRes.body.success).toBe(true);
    expect(recsRes.body.data.length).toBe(3);

    // Saunaspot Dvorce is closest to Podolí (< 1.0 km)
    const topRecommendation = recsRes.body.data[0];
    expect(topRecommendation.id).toBe('saunaspot-dvorce');
    expect(topRecommendation.distance_km).toBeLessThan(1.0);
    expect(topRecommendation.distance_formatted).toMatch(/m|km/);

    // 2. Petr filters saunas for MultiSport 90 min free + plunge pool, sorted by distance
    const filterRes = await request(app)
      .get('/api/saunas')
      .query({
        lat: pragueLat,
        lon: pragueLon,
        benefit_type: 'free_time_limited',
        time_limit: 90,
        cooling: 'plunge_pool',
        sort: 'distance',
      });

    expect(filterRes.status).toBe(200);
    expect(filterRes.body.success).toBe(true);
    expect(filterRes.body.data.length).toBeGreaterThan(0);

    const dvorceInFilter = filterRes.body.data.find((v: any) => v.id === 'saunaspot-dvorce');
    expect(dvorceInFilter).toBeDefined();
    expect(dvorceInFilter.ms_benefit_type).toBe('free_time_limited');
    expect(dvorceInFilter.ms_time_limit).toBeGreaterThanOrEqual(90);
    expect(dvorceInFilter.has_plunge_pool).toBe(1);

    // 3. Petr views the full detail page for Saunaspot Dvorce
    const detailRes = await request(app).get('/api/saunas/saunaspot-dvorce');
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.success).toBe(true);

    const venue = detailRes.body.data;
    expect(venue.name).toBe('Saunaspot Dvorce');
    expect(venue.has_natural_water).toBe(1); // Direct access to Vltava river

    // MultiSport rules in detail
    expect(venue.multisport).toBeDefined();
    expect(venue.multisport.benefit_type).toBe('free_time_limited');
    expect(venue.multisport.time_limit_minutes).toBe(90);
    expect(venue.multisport.towel_sheet_service_included).toBe(1);
    expect(venue.multisport.overtime_surcharge_per_block_czk).toBe(25);
    expect(venue.multisport.overtime_block_minutes).toBe(15);

    // Cooling options include Vltava river cooling
    expect(venue.cooling_options).toBeDefined();
    const naturalCooling = venue.cooling_options.find((c: any) => c.cooling_option_id === 'natural_water_river');
    expect(naturalCooling).toBeDefined();
    expect(naturalCooling.water_temperature_celsius).toBe(8);

    // 4. Petr attempts to add venue to Oblíbené without being authenticated -> 401
    const unauthFavRes = await request(app)
      .post('/api/users/me/lists')
      .send({ venue_id: 'saunaspot-dvorce', list_type: 'favorite' });
    expect(unauthFavRes.status).toBe(401);

    // 5. Petr registers his account
    const registerRes = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'petr.commuter@seznam.cz',
        password: 'PetrSaunaPass2026!',
        display_name: 'Petr Dojíždějící',
      });
    expect(registerRes.status).toBe(201);
    const userToken = registerRes.body.token;
    expect(userToken).toBeDefined();

    // 6. Petr adds Saunaspot Dvorce to his Oblíbené list
    const initialVenueState = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get('saunaspot-dvorce') as any;

    const addFavRes = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ venue_id: 'saunaspot-dvorce', list_type: 'favorite' });
    expect(addFavRes.status).toBe(201);

    // Verify favorite_count incremented in DB
    const postFavState = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get('saunaspot-dvorce') as any;
    expect(postFavState.favorite_count).toBe(initialVenueState.favorite_count + 1);

    // 7. Petr inspects his user profile lists
    const listsRes = await request(app)
      .get('/api/users/me/lists')
      .set('Authorization', `Bearer ${userToken}`);

    expect(listsRes.status).toBe(200);
    expect(listsRes.body.success).toBe(true);
    expect(listsRes.body.data.favorite).toBeDefined();
    expect(listsRes.body.data.favorite.length).toBe(1);
    expect(listsRes.body.data.favorite[0].id).toBe('saunaspot-dvorce');
  });
});
