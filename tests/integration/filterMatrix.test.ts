import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: Compound Search & Filter Matrix', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('TEST-MS-01 & TEST-COOL-01: combined filter (MultiSport 90m + plunge pool + Finnish dry sauna)', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'free_time_limited',
        time_limit: 90,
        cooling: 'plunge_pool',
        sauna_type: 'finnish_dry',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    for (const venue of res.body.data) {
      expect(venue.ms_is_accepted).toBe(1);
      expect(venue.ms_benefit_type).toBe('free_time_limited');
      expect(venue.ms_time_limit).toBeGreaterThanOrEqual(90);
      expect(venue.has_plunge_pool).toBe(1);
    }
  });

  it('TEST-MS-02: filters venues by 100% free unlimited MultiSport stay', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({ benefit_type: 'free_unlimited' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    for (const venue of res.body.data) {
      expect(venue.ms_is_accepted).toBe(1);
      expect(venue.ms_benefit_type).toBe('free_unlimited');
    }
  });

  it('TEST-MS-03: filters venues by MultiSport entry discount (CZK rebate)', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({ benefit_type: 'entry_discount' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
    for (const venue of res.body.data) {
      expect(venue.ms_benefit_type).toBe('entry_discount');
      const hasDiscount = (venue.ms_discount_czk && venue.ms_discount_czk > 0) || (venue.ms_discount_percent && venue.ms_discount_percent > 0);
      expect(hasDiscount).toBe(true);
    }
  });

  it('TEST-COOL-02: filters venues by natural water bodies (lake, river, biotop)', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({ cooling: 'natural_water' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);

    const names = res.body.data.map((v: any) => v.name);
    // Saunaspot Dvorce on Vltava or Lázně na lodi
    expect(names.some((n: string) => n.includes('Dvorce') || n.includes('lodi'))).toBe(true);
  });

  it('TEST-COOL-03: filters venues by ice well / snow fountain', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({ cooling: 'ice_well' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    for (const venue of res.body.data) {
      expect(venue.has_ice_well).toBe(1);
    }
  });

  it('TEST-TYPE-02: filters venues with herbal biosaunas', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({ sauna_type: 'bio_herbal' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  it('BND-01: zero-state returns empty data and relaxation recommendations', async () => {
    const res = await request(app)
      .get('/api/saunas')
      .query({
        benefit_type: 'free_unlimited',
        cooling: 'natural_water',
        region_id: 'cz-lib',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toEqual([]);
    expect(res.body.meta.count).toBe(0);
    expect(res.body.meta.suggestedRelaxations).toBeDefined();
    expect(res.body.meta.suggestedRelaxations).toContain('remove_cooling');
  });

  it('BND-10: prevents SQL injection in query parameters safely', async () => {
    const maliciousInput = "public' OR '1'='1";
    const res = await request(app)
      .get('/api/saunas')
      .query({ category: maliciousInput });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    // Prepared statement treats input as literal category string
    expect(res.body.data.length).toBe(0);
  });
});
