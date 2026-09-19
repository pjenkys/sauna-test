import fs from 'node:fs';
import path from 'node:path';
import { describe, it, expect } from 'vitest';
import { createTestDatabase } from '../setup.js';
import { importMultisportSaunas } from '../../server/src/scripts/importMultisport.js';

describe('MultiSport Import Integration Tests', () => {
  it('imports MultiSport raw facilities into the relational database correctly', async () => {
    const db = createTestDatabase();

    // Prepare a temporary offline sample dataset
    const sampleFacilities: any[] = [
      {
        id: 9915,
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [17.7245339, 49.5555217] },
        properties: {
          name: 'Sports Kotelna Hranice',
          city: 'Hranice',
          street: 'Struhlovsko',
          number: '542',
          phone: '+420 581 604 677',
          email: 'sportskotelna@sportskotelna.cz',
          website_url: 'http://sportskotelna.cz',
          main_image: {
            thumbnail_800_600: 'https://example.com/kotelna800.jpg',
          },
          galery_images: [],
          activity: [
            { id: 142, name: 'Sauna/Pára', search_type: 'ACTIVITY' },
            { id: 127, name: 'Posilovna', search_type: 'ACTIVITY' },
          ],
          activity_summary: 'Sauna 120 min., Posilovna',
          additional_payment: false,
          additional_payment_desc: null,
          active_cards: {
            visible: [{ id: 1, name: 'Stříbrná' }, { id: 6, name: 'LITE' }],
          },
        },
      },
      {
        id: 9916,
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [16.8674133, 49.8767736] },
        properties: {
          name: 'Aquacentrum Zábřeh s bazénem',
          city: 'Zábřeh',
          street: 'Oborník',
          number: '547',
          phone: '+420 583 411 411',
          email: 'info@zabreh.cz',
          website_url: 'http://arealzabreh.cz',
          main_image: {
            thumbnail_800_600: 'https://example.com/zabreh800.jpg',
          },
          galery_images: [],
          activity: [
            { id: 13, name: 'Bazén', search_type: 'ACTIVITY' },
            { id: 142, name: 'Sauna/Pára', search_type: 'ACTIVITY' },
          ],
          activity_summary: 'Krytý bazén, Sauna (120 min) s doplatkem 60 Kč',
          additional_payment: true,
          additional_payment_desc: 'Sauna (120 min) s doplatkem 60 Kč',
          active_cards: {
            visible: [{ id: 1, name: 'Stříbrná' }],
          },
        },
      },
    ];

    // Write temp test file
    const tempFile = path.resolve('tests/fixtures/temp_multisport_test.json');
    fs.writeFileSync(tempFile, JSON.stringify(sampleFacilities, null, 2), 'utf8');

    try {
      const result = await importMultisportSaunas({
        db,
        offlineFile: tempFile,
        verbose: false,
      });

      expect(result.totalImported).toBe(2);
      expect(result.withPlungePool).toBe(1);

      // Verify records in sauna_venues
      const venues = db
        .prepare("SELECT id, name, address_city, has_plunge_pool FROM sauna_venues WHERE id LIKE 'ms-%'")
        .all() as any[];

      expect(venues.length).toBe(2);

      const kotelna = venues.find((v) => v.id === 'ms-9915');
      expect(kotelna).toBeDefined();
      expect(kotelna.name).toBe('Sports Kotelna Hranice');
      expect(kotelna.address_city).toBe('Hranice');
      expect(kotelna.has_plunge_pool).toBe(0);

      const zabreh = venues.find((v) => v.id === 'ms-9916');
      expect(zabreh).toBeDefined();
      expect(zabreh.name).toBe('Aquacentrum Zábřeh s bazénem');
      expect(zabreh.has_plunge_pool).toBe(1);

      // Verify records in venue_multisport_rules
      const msRules = db
        .prepare("SELECT * FROM venue_multisport_rules WHERE venue_id IN ('ms-9915', 'ms-9916')")
        .all() as any[];

      expect(msRules.length).toBe(2);

      const kotelnaRule = msRules.find((r) => r.venue_id === 'ms-9915');
      expect(kotelnaRule.is_accepted).toBe(1);
      expect(kotelnaRule.benefit_type).toBe('free_time_limited');
      expect(kotelnaRule.time_limit_minutes).toBe(120);
      expect(kotelnaRule.entry_surcharge_czk).toBeNull();

      const zabrehRule = msRules.find((r) => r.venue_id === 'ms-9916');
      expect(zabrehRule.is_accepted).toBe(1);
      expect(zabrehRule.benefit_type).toBe('surcharge_entry');
      expect(zabrehRule.time_limit_minutes).toBe(120);
      expect(zabrehRule.entry_surcharge_czk).toBe(60);

      // Verify combined query (MultiSport with plunge pool on imported venues)
      const combinedSearch = db
        .prepare(`
          SELECT v.name, r.benefit_type, r.time_limit_minutes, r.entry_surcharge_czk
          FROM sauna_venues v
          JOIN venue_multisport_rules r ON v.id = r.venue_id
          WHERE v.id LIKE 'ms-%' AND v.has_plunge_pool = 1 AND r.is_accepted = 1
        `)
        .all() as any[];

      expect(combinedSearch.length).toBe(1);
      expect(combinedSearch[0].name).toBe('Aquacentrum Zábřeh s bazénem');
    } finally {
      if (fs.existsSync(tempFile)) {
        fs.unlinkSync(tempFile);
      }
    }
  });
});
