import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: Tier 3 Pairwise Cross-Feature Combinations', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('PAIR-01: Free Time-Limited (90m) + Natural Water + Public Strict Nudist', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'free_time_limited',
        time_limit: 90,
        cooling: 'natural_water',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const dvorce = res.body.data.find((v: any) => v.id === 'saunaspot-dvorce');
    expect(dvorce).toBeDefined();
    expect(dvorce.ms_benefit_type).toBe('free_time_limited');
    expect(dvorce.ms_time_limit).toBe(90);
    expect(dvorce.has_natural_water).toBe(1);
    expect(dvorce.policy_nudity).toBe('strict_nudist');
  });

  it('PAIR-02: Free Time-Limited (90m) + Ceremonial Hall + Plunge Pool', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'free_time_limited',
        has_ceremonial_hall: 'true',
        cooling: 'plunge_pool',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const venue of res.body.data) {
      expect(venue.ms_is_accepted).toBe(1);
      expect(venue.has_ceremonial_hall).toBe(1);
      expect(venue.has_plunge_pool).toBe(1);
    }
  });

  it('PAIR-03: Entry Discount (-100 Kč) + Ice Well + Outdoor Whirlpool', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'entry_discount',
        cooling: 'ice_well',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const maximus = res.body.data.find((v: any) => v.id === 'infinit-maximus-brno');
    expect(maximus).toBeDefined();
    expect(maximus.ms_benefit_type).toBe('entry_discount');
    expect(maximus.ms_discount_czk).toBe(120);
    expect(maximus.has_ice_well).toBe(1);
    expect(maximus.has_whirlpool).toBe(1);
  });

  it('PAIR-04: Surcharge Entry (+250 Kč) + Outdoor Plunge Pool + Experience Showers', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'surcharge_entry',
        cooling: 'plunge_pool',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const aquapalace = res.body.data.find((v: any) => v.id === 'aquapalace-praha-cestlice');
    expect(aquapalace).toBeDefined();
    expect(aquapalace.ms_benefit_type).toBe('surcharge_entry');
    expect(aquapalace.ms_surcharge_czk).toBe(250);
    expect(aquapalace.has_plunge_pool).toBe(1);
    expect(aquapalace.has_experience_showers).toBe(1);
  });

  it('PAIR-05: MultiSport Not Accepted + Strictly Private Rental', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        category: 'private',
        benefit_type: 'not_accepted',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const venue of res.body.data) {
      expect(venue.category).toBe('private');
      expect(venue.ms_is_accepted).toBe(0);
    }
  });

  it('PAIR-06: MultiSport Not Accepted + Natural Water Cooling', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        cooling: 'natural_water',
        benefit_type: 'not_accepted',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const lod = res.body.data.find((v: any) => v.id === 'lazne-na-lodi-praha');
    expect(lod).toBeDefined();
    expect(lod.has_natural_water).toBe(1);
    expect(lod.ms_is_accepted).toBe(0);
  });

  it('PAIR-07: Free Time-Limited (120m) + Ice Well + Free Towel/Sheet Included', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'free_time_limited',
        time_limit: 120,
        cooling: 'ice_well',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const venue of res.body.data) {
      expect(venue.ms_time_limit).toBeGreaterThanOrEqual(120);
      expect(venue.has_ice_well).toBe(1);
      expect(venue.ms_towel_sheet_included).toBe(1);
    }
  });

  it('PAIR-08: Entry Discount + Ceremonial Hall + Ceremony Schedule', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'entry_discount',
        has_ceremonial_hall: 'true',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const venue = res.body.data[0];
    expect(venue.ms_benefit_type).toBe('entry_discount');
    expect(venue.has_ceremonial_hall).toBe(1);

    // Verify ceremonies calendar endpoint for this venue
    const ceremRes = await request(app)
      .get('/api/ceremonies')
      .query({ venue_id: venue.id });

    expect(ceremRes.status).toBe(200);
    expect(ceremRes.body.success).toBe(true);
    expect(Array.isArray(ceremRes.body.data)).toBe(true);
  });

  it('PAIR-09: Free Time-Limited (90m) + Experience Showers + Free Parking', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'free_time_limited',
        cooling: 'experience_showers',
        parking: 'free_onsite',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const venue of res.body.data) {
      expect(venue.ms_is_accepted).toBe(1);
      expect(venue.has_experience_showers).toBe(1);
      expect(venue.policy_parking).toBe('free_onsite');
    }
  });

  it('PAIR-10: MultiSport Not Accepted + Adults Only (18+) Policy', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'not_accepted',
        children_policy: 'adults_only',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const venue of res.body.data) {
      expect(venue.ms_is_accepted).toBe(0);
      expect(venue.policy_children).toBe('adults_only');
    }
  });
});
