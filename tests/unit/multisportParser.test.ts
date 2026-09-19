import { describe, it, expect } from 'vitest';
import {
  parseMultiSportRules,
  resolveRegionId,
  parseMultiSportVenue,
} from '../../server/src/services/multisportParser.js';

describe('MultiSport Parser Unit Tests', () => {
  describe('parseMultiSportRules', () => {
    it('correctly parses time-limited free entry (120 min)', () => {
      const result = parseMultiSportRules({
        name: 'Sauna Kotelna',
        activity_summary: 'Open Gym, Squash, Sauna 120 min., Bowling',
        additional_payment: false,
        additional_payment_desc: null,
      });

      expect(result.isAccepted).toBe(true);
      expect(result.benefitType).toBe('free_time_limited');
      expect(result.timeLimitMinutes).toBe(120);
      expect(result.entrySurchargeCzk).toBeNull();
    });

    it('correctly parses entry surcharge with time limit (120 min + 60 CZK)', () => {
      const result = parseMultiSportRules({
        name: 'Plavecký areál Zábřeh',
        activity_summary: 'Sauna (120 min) s doplatkem 60 Kč',
        additional_payment: true,
        additional_payment_desc: 'Sauna (120 min) s doplatkem 60 Kč, dítě 20 Kč',
      });

      expect(result.isAccepted).toBe(true);
      expect(result.benefitType).toBe('surcharge_entry');
      expect(result.timeLimitMinutes).toBe(120);
      expect(result.entrySurchargeCzk).toBe(60);
    });

    it('correctly parses surcharge in CZK prefix format (CZK 120)', () => {
      const result = parseMultiSportRules({
        name: 'Plavecký bazén Všestary',
        activity_summary: 'Swimming pool, Sauna with additional payment CZK 120',
        additional_payment: true,
        additional_payment_desc: 'Sauna with additional payment CZK 120',
      });

      expect(result.isAccepted).toBe(true);
      expect(result.benefitType).toBe('surcharge_entry');
      expect(result.entrySurchargeCzk).toBe(120);
    });

    it('defaults to free_unlimited when no surcharge and no time limit specified', () => {
      const result = parseMultiSportRules({
        name: 'Wellness Relax',
        activity_summary: 'Sauna a pára neomezeně',
        additional_payment: false,
        additional_payment_desc: null,
      });

      expect(result.isAccepted).toBe(true);
      expect(result.benefitType).toBe('free_unlimited');
      expect(result.entrySurchargeCzk).toBeNull();
    });

    it('extracts visible active card types', () => {
      const result = parseMultiSportRules({
        name: 'Test Sauna',
        active_cards: {
          visible: [
            { id: 1, name: 'Stříbrná' },
            { id: 6, name: 'LITE' },
            { id: 3, name: 'FKSP' },
          ],
        },
      });

      expect(result.acceptedCardTypes).toEqual(['Stříbrná', 'LITE', 'FKSP']);
    });
  });

  describe('resolveRegionId', () => {
    it('resolves region by known city names', () => {
      expect(resolveRegionId(50.08, 14.43, 'Praha 4')).toBe('cz-pha');
      expect(resolveRegionId(49.19, 16.60, 'Brno - střed')).toBe('cz-jhm');
      expect(resolveRegionId(49.83, 18.29, 'Ostrava - Poruba')).toBe('cz-msk');
      expect(resolveRegionId(49.74, 13.37, 'Plzeň')).toBe('cz-plk');
    });

    it('falls back to closest region centroid by GPS coordinates when city is small', () => {
      // Near Liberec (50.76, 15.05)
      const reg = resolveRegionId(50.75, 15.08, 'Malá vesnička');
      expect(reg).toBe('cz-lbk');
    });
  });

  describe('parseMultiSportVenue', () => {
    it('maps complete facility detail to sauna venue entity with cooling detection', () => {
      const raw: any = {
        id: 16,
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [16.8674133, 49.8767736] },
        properties: {
          name: 'Plavecký areál Zábřeh',
          city: 'Zábřeh',
          street: 'Oborník',
          number: '547/39',
          phone: '+420 583 411 411',
          email: 'info@arealzabreh.cz',
          website_url: 'http://www.arealzabreh.cz',
          main_image: {
            thumbnail_800_600: 'https://example.com/img800.jpg',
          },
          galery_images: [
            { thumbnail_800_600: 'https://example.com/gal1.jpg' },
          ],
          activity: [
            { id: 13, name: 'Bazén', search_type: 'ACTIVITY' },
            { id: 142, name: 'Sauna/Pára', search_type: 'ACTIVITY' },
            { id: 172, name: 'Whirlpool', search_type: 'ACTIVITY' },
          ],
          activity_summary: 'Krytý bazén 60min, Sauna (120 min) s doplatkem 60 Kč',
          additional_payment: true,
          additional_payment_desc: 'Sauna (120 min) s doplatkem 60 Kč',
        },
      };

      const venue = parseMultiSportVenue(raw);

      expect(venue.id).toBe('ms-16');
      expect(venue.name).toBe('Plavecký areál Zábřeh');
      expect(venue.addressCity).toBe('Zábřeh');
      expect(venue.addressStreet).toBe('Oborník 547/39');
      expect(venue.latitude).toBe(49.8767736);
      expect(venue.longitude).toBe(16.8674133);
      expect(venue.regionId).toBe('cz-olk'); // Olomouc region
      expect(venue.coverImageUrl).toBe('https://example.com/img800.jpg');
      expect(venue.galleryUrls).toContain('https://example.com/gal1.jpg');

      // Feature detection
      expect(venue.hasPlungePool).toBe(true);
      expect(venue.hasWhirlpool).toBe(true);
      expect(venue.hasSteamBath).toBe(true);

      // MultiSport rule
      expect(venue.multisportRule.isAccepted).toBe(true);
      expect(venue.multisportRule.benefitType).toBe('surcharge_entry');
      expect(venue.multisportRule.timeLimitMinutes).toBe(120);
      expect(venue.multisportRule.entrySurchargeCzk).toBe(60);
    });
  });
});
