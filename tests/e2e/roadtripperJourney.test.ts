import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Tier 4 E2E Journey 5: The Offline / Geolocation Denied Explorer (Alena)', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('executes full roadtripper journey: geolocation denied -> manual region fallback -> mountain filter -> distance sort -> affiliate catalog -> referral click tracking', async () => {
    // 1. Alena opens the platform with browser Geolocation disabled.
    // Instead of failing or crashing, Alena manually picks Královéhradecký kraj / Krkonoše (cz-hkk)
    const regionRes = await request(app)
      .get('/api/saunas')
      .query({ region_id: 'cz-hkk' });

    expect(regionRes.status).toBe(200);
    expect(regionRes.body.success).toBe(true);
    expect(regionRes.body.data.length).toBeGreaterThan(0);

    for (const venue of regionRes.body.data) {
      expect(venue.region_id).toBe('cz-hkk');
    }

    // 2. Alena filters by Category "Horská sauna" (hotel_mountain) with outdoor cooling
    const mountainRes = await request(app)
      .get('/api/saunas')
      .query({
        region_id: 'cz-hkk',
        category: 'hotel_mountain',
      });

    expect(mountainRes.status).toBe(200);
    expect(mountainRes.body.success).toBe(true);
    expect(mountainRes.body.data.length).toBeGreaterThan(0);

    for (const venue of mountainRes.body.data) {
      expect(venue.category).toBe('hotel_mountain');
      expect(venue.region_id).toBe('cz-hkk');
    }

    // 3. Alena calculates distances relative to her chosen destination: Špindlerův Mlýn center (50.7256, 15.6089)
    const spindleruvLat = 50.7256;
    const spindleruvLon = 15.6089;

    const distanceSortedRes = await request(app)
      .get('/api/saunas')
      .query({
        lat: spindleruvLat,
        lon: spindleruvLon,
        region_id: 'cz-hkk',
        sort: 'distance',
      });

    expect(distanceSortedRes.status).toBe(200);
    expect(distanceSortedRes.body.data.length).toBeGreaterThan(0);

    // Aqua Park Špindlerův Mlýn should be closest (< 1 km)
    const closestVenue = distanceSortedRes.body.data[0];
    expect(closestVenue.id).toBe('aquapark-spindleruv-mlyn');
    expect(closestVenue.distance_km).toBeLessThan(1.0);

    // 4. Alena views the venue details for Aqua Park Špindlerův Mlýn
    const detailRes = await request(app).get('/api/saunas/aquapark-spindleruv-mlyn');
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.name).toContain('Aqua Park Špindlerův Mlýn');
    expect(detailRes.body.data.address_city).toBe('Špindlerův Mlýn');
    expect(detailRes.body.data.category).toBe('hotel_mountain');

    // 5. Alena browses the affiliate equipment catalog for winter sauna accessories
    const productsRes = await request(app).get('/api/affiliate-products');
    expect(productsRes.status).toBe(200);
    expect(productsRes.body.success).toBe(true);
    expect(productsRes.body.data.length).toBeGreaterThan(0);

    // Finds woolen sauna hat for subzero mountain cooling
    const woolHat = productsRes.body.data.find((p: any) => p.id === 'prod_wool_hat');
    expect(woolHat).toBeDefined();
    expect(woolHat.product_name).toContain('saunová čepice');
    expect(woolHat.price_czk).toBe(390);
    expect(woolHat.is_active).toBe(1);
    expect(woolHat.affiliate_url).toContain('ref=saunycz');

    // 6. Alena clicks on the affiliate product recommendation link
    const clickPayload = {
      venue_id: 'aquapark-spindleruv-mlyn',
      affiliate_product_id: woolHat.id,
      click_type: 'affiliate_product',
      user_agent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    };

    const clickRes = await request(app)
      .post('/api/referrals/click')
      .send(clickPayload);

    // Endpoint returns 204 No Content for immediate client-side redirection
    expect(clickRes.status).toBe(204);

    // 7. Verify referral click is recorded in database for transparency and commission accounting
    const clickRow = db.prepare(`
      SELECT * FROM partner_referral_clicks
      WHERE venue_id = ? AND click_type = ?
    `).get('aquapark-spindleruv-mlyn', 'affiliate_product') as any;

    expect(clickRow).toBeDefined();
    expect(clickRow.venue_id).toBe('aquapark-spindleruv-mlyn');
    expect(clickRow.affiliate_product_id).toBe(woolHat.id);
    expect(clickRow.click_type).toBe('affiliate_product');
    expect(clickRow.clicked_at).toBeDefined();
  });
});
