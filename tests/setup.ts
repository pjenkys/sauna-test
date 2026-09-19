import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express, { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { app as productionApp } from '../server/src/app.js';
import { setDb } from '../server/src/db/connection.js';

const require = createRequire(import.meta.url);
const { DatabaseSync } = require('node:sqlite');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Cache fixture files in memory for < 10ms database resets
const schemaSql = fs.readFileSync(path.join(__dirname, 'fixtures', 'schema.sql'), 'utf8');
const catalogsJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'catalogs.json'), 'utf8'));
const venuesJson = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'venues.json'), 'utf8'));

export const JWT_SECRET = 'test-secret-key-czech-sauna-platform-2026';

// ----------------------------------------------------------------------------
// 1. IN-MEMORY DATABASE HARNESS (< 20ms setup)
// ----------------------------------------------------------------------------

export function createTestDatabase(): DatabaseSync {
  const start = performance.now();
  const db = new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec(schemaSql);
  db.exec('BEGIN TRANSACTION;');

  // Insert Catalogs
  const insertCountry = db.prepare(`
    INSERT INTO countries (id, name, slug, currency_code, default_locale, phone_prefix, bounds_north, bounds_south, bounds_east, bounds_west, center_latitude, center_longitude, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const c of catalogsJson.countries) {
    insertCountry.run(c.id, c.name, c.slug, c.currency_code, c.default_locale, c.phone_prefix, c.bounds_north, c.bounds_south, c.bounds_east, c.bounds_west, c.center_latitude, c.center_longitude, c.is_active ? 1 : 0);
  }

  const insertRegion = db.prepare(`
    INSERT INTO regions (id, country_id, code, name, short_name, slug, latitude, longitude, zoom_level, display_order, is_active)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const r of catalogsJson.regions) {
    insertRegion.run(r.id, r.country_id, r.code, r.name, r.short_name, r.slug, r.latitude, r.longitude, r.zoom_level, r.display_order, r.is_active ? 1 : 0);
  }

  const insertCity = db.prepare(`
    INSERT INTO cities (id, region_id, name, slug, postal_code_prefix, latitude, longitude, is_major, sauna_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const ci of catalogsJson.cities) {
    insertCity.run(ci.id, ci.region_id, ci.name, ci.slug, ci.postal_code_prefix, ci.latitude, ci.longitude, ci.is_major ? 1 : 0, ci.sauna_count);
  }

  const insertCooling = db.prepare(`
    INSERT INTO cooling_options (id, name_cz, name_en, category, icon_name, description)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  for (const co of catalogsJson.cooling_options) {
    insertCooling.run(co.id, co.name_cz, co.name_en, co.category, co.icon_name, co.description);
  }

  const insertSaunaType = db.prepare(`
    INSERT INTO sauna_types (id, name_cz, name_en, default_temp_celsius, default_humidity_percentage, icon_name, description)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const st of catalogsJson.sauna_types) {
    insertSaunaType.run(st.id, st.name_cz, st.name_en, st.default_temp_celsius, st.default_humidity_percentage, st.icon_name, st.description);
  }

  const insertAmenity = db.prepare(`
    INSERT INTO amenity_facilities (id, name_cz, name_en, icon_name, description)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const am of catalogsJson.amenity_facilities) {
    insertAmenity.run(am.id, am.name_cz, am.name_en, am.icon_name, am.description);
  }

  const insertAffiliate = db.prepare(`
    INSERT INTO affiliate_partner_products (id, category, product_name, partner_shop_name, image_url, price_czk, affiliate_url, description, is_active, display_order)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const p of catalogsJson.affiliate_partner_products) {
    insertAffiliate.run(p.id, p.category, p.product_name, p.partner_shop_name, p.image_url, p.price_czk, p.affiliate_url, p.description, p.is_active ? 1 : 0, p.display_order);
  }

  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, avatar_url, role, bio, preferred_region_id, is_email_verified, reviews_count, helpful_votes_received)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const u of catalogsJson.users) {
    insertUser.run(u.id, u.email, u.password_hash, u.display_name, u.avatar_url, u.role, u.bio, u.preferred_region_id, u.is_email_verified ? 1 : 0, u.reviews_count, u.helpful_votes_received);
  }

  // Insert Venues & Associated Tables
  const insertVenue = db.prepare(`
    INSERT INTO sauna_venues (
      id, city_id, region_id, country_id, name, slug, category, short_description, description,
      address_street, address_city, address_zip, latitude, longitude, phone, email, website_url, booking_url,
      cover_image_url, gallery_urls, has_plunge_pool, has_outdoor_cooling, has_natural_water, has_ice_well,
      has_bucket_shower, has_experience_showers, has_ceremonial_hall, has_whirlpool, has_steam_bath,
      has_herbal_sauna, has_private_rental, rating_overall, rating_cleanliness, rating_heat_steam,
      rating_cooling, rating_staff_ceremonies, rating_value, review_count, favorite_count, is_promoted,
      promoted_badge, promoted_tier, status
    ) VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
    )
  `);

  const insertMs = db.prepare(`
    INSERT INTO venue_multisport_rules (
      venue_id, is_accepted, benefit_type, time_limit_minutes, discount_amount_czk, discount_percentage,
      entry_surcharge_czk, overtime_surcharge_per_block_czk, overtime_block_minutes, included_zones,
      towel_sheet_service_included, valid_days, valid_hours_description, accepted_card_types, note
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPolicy = db.prepare(`
    INSERT INTO venue_operating_policies (
      venue_id, access_type, nudity_policy, women_only_policy, women_only_schedule_note,
      men_only_schedule_note, children_policy, children_min_age, barrier_free_access,
      parking_policy, parking_notes, refreshment_type, towels_and_sheets
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVenueCooling = db.prepare(`
    INSERT INTO venue_cooling_options (id, venue_id, cooling_option_id, water_temperature_celsius, description, is_featured)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertVenueSauna = db.prepare(`
    INSERT INTO venue_saunas (id, venue_id, sauna_type_id, custom_name, temperature_celsius_min, temperature_celsius_max, humidity_percentage_min, humidity_percentage_max, capacity_persons, wood_type, description)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertVenueAmenity = db.prepare(`
    INSERT INTO venue_amenities (id, venue_id, amenity_id, quantity)
    VALUES (?, ?, ?, ?)
  `);

  const insertHours = db.prepare(`
    INSERT INTO venue_opening_hours (id, venue_id, day_of_week, open_time, close_time, is_closed, special_note)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const insertPricing = db.prepare(`
    INSERT INTO venue_pricing (id, venue_id, ticket_name, duration_minutes, price_czk, price_student_czk, price_senior_czk, is_default, note)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertReview = db.prepare(`
    INSERT INTO reviews (id, venue_id, user_id, rating_overall, rating_cleanliness, rating_heat_steam, rating_cooling, rating_staff_ceremonies, rating_value, title, content, tips, recommended_time, visit_date, is_verified_visit, helpful_votes_count)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertCeremony = db.prepare(`
    INSERT INTO sauna_ceremonies (id, venue_id, title, category, description, ceremony_master, hall_name, day_of_week, is_recurring, start_time, end_time, special_entry_fee_czk, is_featured)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  for (const v of venuesJson) {
    insertVenue.run(
      v.id, v.city_id, v.region_id, v.country_id, v.name, v.slug, v.category, v.short_description, v.description,
      v.address_street, v.address_city, v.address_zip, v.latitude, v.longitude, v.phone, v.email, v.website_url, v.booking_url,
      v.cover_image_url, v.gallery_urls ? JSON.stringify(v.gallery_urls) : null,
      v.has_plunge_pool ? 1 : 0, v.has_outdoor_cooling ? 1 : 0, v.has_natural_water ? 1 : 0, v.has_ice_well ? 1 : 0,
      v.has_bucket_shower ? 1 : 0, v.has_experience_showers ? 1 : 0, v.has_ceremonial_hall ? 1 : 0, v.has_whirlpool ? 1 : 0,
      v.has_steam_bath ? 1 : 0, v.has_herbal_sauna ? 1 : 0, v.has_private_rental ? 1 : 0,
      v.rating_overall, v.rating_cleanliness, v.rating_heat_steam, v.rating_cooling, v.rating_staff_ceremonies,
      v.rating_value, v.review_count, v.favorite_count, v.is_promoted ? 1 : 0, v.promoted_badge ?? null, v.promoted_tier ?? null, v.status ?? 'active'
    );

    insertMs.run(
      v.id, v.multisport.is_accepted ? 1 : 0, v.multisport.benefit_type, v.multisport.time_limit_minutes ?? null,
      v.multisport.discount_amount_czk ?? null, v.multisport.discount_percentage ?? null, v.multisport.entry_surcharge_czk ?? null,
      v.multisport.overtime_surcharge_per_block_czk ?? null, v.multisport.overtime_block_minutes ?? null, v.multisport.included_zones,
      v.multisport.towel_sheet_service_included ? 1 : 0, v.multisport.valid_days, v.multisport.valid_hours_description,
      v.multisport.accepted_card_types, v.multisport.note ?? null
    );

    insertPolicy.run(
      v.id,
      v.policies?.access_type ?? 'public_walkin',
      v.policies?.nudity_policy ?? 'strict_nudist',
      v.policies?.women_only_policy ?? 'none',
      v.policies?.women_only_schedule_note ?? null,
      v.policies?.men_only_schedule_note ?? null,
      v.policies?.children_policy ?? 'children_welcome',
      v.policies?.children_min_age ?? null,
      v.policies?.barrier_free_access ?? 'partial',
      v.policies?.parking_policy ?? 'free_onsite',
      v.policies?.parking_notes ?? null,
      v.policies?.refreshment_type ?? 'sauna_bar_full',
      v.policies?.towels_and_sheets ?? 'included_free'
    );

    if (v.cooling_ids) {
      for (let i = 0; i < v.cooling_ids.length; i++) {
        const c = v.cooling_ids[i];
        insertVenueCooling.run(`${v.id}_cool_${i}`, v.id, c.option_id, c.temp ?? null, c.desc ?? null, c.featured ? 1 : 0);
      }
    }

    if (v.saunas) {
      for (let i = 0; i < v.saunas.length; i++) {
        const s = v.saunas[i];
        insertVenueSauna.run(`${v.id}_sauna_${i}`, v.id, s.sauna_type_id, s.name, s.t_min, s.t_max, s.h_min, s.h_max, s.cap ?? null, s.wood ?? null, s.desc ?? null);
      }
    }

    if (v.amenities) {
      for (let i = 0; i < v.amenities.length; i++) {
        insertVenueAmenity.run(`${v.id}_amenity_${i}`, v.id, v.amenities[i], 1);
      }
    }

    if (v.opening_hours) {
      for (const h of v.opening_hours) {
        insertHours.run(`${v.id}_day_${h.day}`, v.id, h.day, h.open, h.close, h.closed ? 1 : 0, h.note ?? null);
      }
    }

    if (v.pricing) {
      for (let i = 0; i < v.pricing.length; i++) {
        const p = v.pricing[i];
        insertPricing.run(`${v.id}_price_${i}`, v.id, p.name, p.dur ?? null, p.price, p.stud ?? null, p.sen ?? null, p.is_def ? 1 : 0, p.note ?? null);
      }
    }

    if (v.reviews) {
      for (const r of v.reviews) {
        insertReview.run(
          r.id, v.id, r.user_id, r.rating_overall, r.rating_cleanliness, r.rating_heat_steam,
          r.rating_cooling, r.rating_staff_ceremonies, r.rating_value, r.title, r.content,
          r.tips ?? null, r.recommended_time ?? null, r.visit_date ?? null, r.is_verified ? 1 : 0, r.helpful_votes ?? 0
        );
      }
    }

    if (v.ceremonies) {
      for (const cer of v.ceremonies) {
        insertCeremony.run(
          cer.id, v.id, cer.title, cer.category, cer.description, cer.ceremony_master ?? null,
          cer.hall_name ?? null, cer.day_of_week ?? null, 1, cer.start_time, cer.end_time, cer.fee ?? 0.00, cer.is_featured ? 1 : 0
        );
      }
    }
  }

  db.exec('COMMIT;');
  const elapsed = performance.now() - start;
  if (elapsed > 200) {
    console.warn(`[WARN] Database setup took ${elapsed.toFixed(2)}ms (target <20ms)`);
  }
  return db;
}

// ----------------------------------------------------------------------------
// 2. DOMAIN LOGIC UTILITIES
// ----------------------------------------------------------------------------

/**
 * Haversine formula distance between two coordinates in kilometers.
 */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (lat1 === lat2 && lon1 === lon2) return 0;
  const R = 6371; // Earth radius in km
  const toRad = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRad;
  const dLon = (lon2 - lon1) * toRad;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * toRad) * Math.cos(lat2 * toRad) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Formats distance: < 1 km formatted as meters ("450 m"), >= 1 km formatted as km ("1.2 km").
 */
export function formatDistance(distKm: number): string {
  if (distKm <= 0) return '0 m';
  if (distKm < 1.0) {
    return `${Math.round(distKm * 1000)} m`;
  }
  if (distKm < 10) {
    return `${distKm.toFixed(1)} km`;
  }
  return `${Math.round(distKm)} km`;
}

/**
 * Checks if a coordinate is within a given radius in kilometers.
 */
export function isWithinRadius(lat1: number, lon1: number, lat2: number, lon2: number, radiusKm: number): boolean {
  const dist = haversineDistance(lat1, lon1, lat2, lon2);
  return dist <= radiusKm;
}

/**
 * Calculates MultiSport overtime fee.
 */
export function calculateOvertimeFee(params: {
  freeMinutes: number;
  blockMinutes: number;
  blockPrice: number;
  stayDuration: number;
}): number {
  const { freeMinutes, blockMinutes, blockPrice, stayDuration } = params;
  if (stayDuration <= freeMinutes) return 0;
  const overtimeMinutes = stayDuration - freeMinutes;
  const blocks = Math.ceil(overtimeMinutes / blockMinutes);
  return blocks * blockPrice;
}

/**
 * Calculates final price for MultiSport card holder.
 */
export function calculateMultisportFinalPrice(params: {
  basePrice: number;
  benefitType: string;
  discountCzk?: number | null;
  discountPercent?: number | null;
  surchargeCzk?: number | null;
  stayDuration?: number;
  freeMinutes?: number;
  blockMinutes?: number;
  blockPrice?: number;
}): { finalPrice: number; discountApplied: number; surchargeApplied: number; overtimeFee: number } {
  const {
    basePrice,
    benefitType,
    discountCzk,
    discountPercent,
    surchargeCzk,
    stayDuration,
    freeMinutes,
    blockMinutes,
    blockPrice,
  } = params;

  let finalPrice = basePrice;
  let discountApplied = 0;
  let surchargeApplied = 0;
  let overtimeFee = 0;

  if (benefitType === 'free_unlimited') {
    finalPrice = 0;
    discountApplied = basePrice;
  } else if (benefitType === 'free_time_limited') {
    finalPrice = 0;
    discountApplied = basePrice;
    if (stayDuration && freeMinutes && blockMinutes && blockPrice) {
      overtimeFee = calculateOvertimeFee({ freeMinutes, blockMinutes, blockPrice, stayDuration });
      finalPrice += overtimeFee;
    }
  } else if (benefitType === 'entry_discount') {
    if (discountCzk) {
      discountApplied = discountCzk;
      finalPrice = Math.max(0, basePrice - discountCzk);
    } else if (discountPercent) {
      discountApplied = Math.round((basePrice * discountPercent) / 100);
      finalPrice = Math.max(0, basePrice - discountApplied);
    }
  } else if (benefitType === 'surcharge_entry') {
    surchargeApplied = surchargeCzk ?? 0;
    finalPrice = surchargeApplied;
    if (stayDuration && freeMinutes && blockMinutes && blockPrice) {
      overtimeFee = calculateOvertimeFee({ freeMinutes, blockMinutes, blockPrice, stayDuration });
      finalPrice += overtimeFee;
    }
  }

  return { finalPrice, discountApplied, surchargeApplied, overtimeFee };
}

/**
 * Validates Czech 8-digit IČO using the Modulo-11 algorithm.
 */
export function validateIco(ico: string | number | null | undefined): boolean {
  if (!ico) return false;
  const str = String(ico).trim();
  if (!/^\d{8}$/.test(str)) return false;

  const weights = [8, 7, 6, 5, 4, 3, 2];
  let sum = 0;
  for (let i = 0; i < 7; i++) {
    sum += Number(str[i]) * weights[i];
  }

  const remainder = sum % 11;
  let checkDigit = 0;
  if (remainder === 0) {
    checkDigit = 1;
  } else if (remainder === 1) {
    checkDigit = 0;
  } else {
    checkDigit = 11 - remainder;
  }

  return Number(str[7]) === checkDigit;
}

/**
 * Generates intelligent filter relaxation suggestions when a query yields 0 results.
 */
export function suggestRelaxations(activeFilters: Record<string, any>, resultCount: number): string[] {
  if (resultCount > 0) return [];
  const suggestions: string[] = [];

  if (activeFilters.cooling) {
    suggestions.push('remove_cooling');
  }
  if (activeFilters.region_id || activeFilters.city_id) {
    suggestions.push('expand_region');
  }
  if (activeFilters.benefit_type) {
    suggestions.push('relax_multisport');
  }
  if (activeFilters.sauna_type) {
    suggestions.push('remove_sauna_type');
  }
  if (activeFilters.nudity_policy) {
    suggestions.push('relax_nudity_policy');
  }
  if (suggestions.length === 0) {
    suggestions.push('expand_search_criteria');
  }

  return suggestions;
}

/**
 * Helper to generate a valid JWT token for test requests.
 */
export function getAuthToken(user: { id: string; email: string; role?: string }): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role ?? 'user' },
    JWT_SECRET,
    { expiresIn: '1h' }
  );
}

// ----------------------------------------------------------------------------
// 3. EXPRESS APP TEST HARNESS
// ----------------------------------------------------------------------------

export function createTestApp(db: DatabaseSync): express.Application {
  const app = express();
  app.use(express.json());

  // Middleware: Auth extractor
  const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Missing token' });
    }
    const token = authHeader.split(' ')[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;
      (req as any).user = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ success: false, error: 'Unauthorized: Invalid token' });
    }
  };

  // GET /api/saunas
  app.get('/api/saunas', (req: Request, res: Response) => {
    try {
      const {
        q, category, benefit_type, time_limit, cooling, sauna_type, nudity_policy,
        region_id, city_id, lat, lon, radius_km, sort,
        bounds_north, bounds_south, bounds_east, bounds_west,
        has_ceremonial_hall, barrier_free, children_policy, parking, women_only, multisport_valid_days
      } = req.query as Record<string, string>;

      let sql = `
        SELECT 
          v.*,
          ms.is_accepted as ms_is_accepted,
          ms.benefit_type as ms_benefit_type,
          ms.time_limit_minutes as ms_time_limit,
          ms.discount_amount_czk as ms_discount_czk,
          ms.discount_percentage as ms_discount_percent,
          ms.entry_surcharge_czk as ms_surcharge_czk,
          ms.towel_sheet_service_included as ms_towel_sheet_included,
          ms.valid_days as ms_valid_days,
          p.access_type as policy_access_type,
          p.nudity_policy as policy_nudity,
          p.women_only_policy as policy_women_only,
          p.children_policy as policy_children,
          p.barrier_free_access as policy_barrier_free,
          p.parking_policy as policy_parking,
          p.towels_and_sheets as policy_towels_sheets
        FROM sauna_venues v
        LEFT JOIN venue_multisport_rules ms ON v.id = ms.venue_id
        LEFT JOIN venue_operating_policies p ON v.id = p.venue_id
        WHERE v.status = 'active'
      `;
      const params: any[] = [];

      if (q) {
        sql += ` AND (v.name LIKE ? OR v.short_description LIKE ?)`;
        params.push(`%${q}%`, `%${q}%`);
      }
      if (category) {
        sql += ` AND v.category = ?`;
        params.push(category);
      }
      if (benefit_type) {
        if (benefit_type === 'not_accepted') {
          sql += ` AND (ms.is_accepted = 0 OR ms.benefit_type = 'not_accepted')`;
        } else {
          sql += ` AND ms.is_accepted = 1 AND ms.benefit_type = ?`;
          params.push(benefit_type);
        }
      }
      if (time_limit) {
        sql += ` AND ms.time_limit_minutes >= ?`;
        params.push(Number(time_limit));
      }
      if (multisport_valid_days) {
        sql += ` AND ms.valid_days = ?`;
        params.push(multisport_valid_days);
      }
      if (cooling) {
        if (cooling === 'plunge_pool') sql += ` AND v.has_plunge_pool = 1`;
        else if (cooling === 'natural_water') sql += ` AND v.has_natural_water = 1`;
        else if (cooling === 'ice_well') sql += ` AND v.has_ice_well = 1`;
        else if (cooling === 'bucket_shower') sql += ` AND v.has_bucket_shower = 1`;
        else if (cooling === 'experience_showers') sql += ` AND v.has_experience_showers = 1`;
        else {
          sql += ` AND EXISTS (SELECT 1 FROM venue_cooling_options vco WHERE vco.venue_id = v.id AND vco.cooling_option_id = ?)`;
          params.push(cooling);
        }
      }
      if (sauna_type) {
        sql += ` AND EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = v.id AND vs.sauna_type_id = ?)`;
        params.push(sauna_type);
      }
      if (has_ceremonial_hall === 'true' || has_ceremonial_hall === '1') {
        sql += ` AND v.has_ceremonial_hall = 1`;
      }
      if (nudity_policy) {
        sql += ` AND p.nudity_policy = ?`;
        params.push(nudity_policy);
      }
      if (barrier_free === 'true' || barrier_free === '1') {
        sql += ` AND p.barrier_free_access IN ('full', 'partial')`;
      }
      if (children_policy) {
        sql += ` AND p.children_policy = ?`;
        params.push(children_policy);
      }
      if (parking) {
        sql += ` AND p.parking_policy = ?`;
        params.push(parking);
      }
      if (women_only === 'true' || women_only === '1') {
        sql += ` AND p.women_only_policy != 'none'`;
      }
      if (region_id) {
        sql += ` AND v.region_id = ?`;
        params.push(region_id);
      }
      if (city_id) {
        sql += ` AND v.city_id = ?`;
        params.push(city_id);
      }
      if (bounds_north && bounds_south && bounds_east && bounds_west) {
        sql += ` AND v.latitude BETWEEN ? AND ? AND v.longitude BETWEEN ? AND ?`;
        params.push(Number(bounds_south), Number(bounds_north), Number(bounds_west), Number(bounds_east));
      }

      const stmt = db.prepare(sql);
      let rows = stmt.all(...params) as any[];

      // Calculate distance if coordinates provided
      if (lat && lon) {
        const uLat = Number(lat);
        const uLon = Number(lon);
        rows = rows.map((r) => {
          const dist = haversineDistance(uLat, uLon, Number(r.latitude), Number(r.longitude));
          return { ...r, distance_km: dist, distance_formatted: formatDistance(dist) };
        });

        if (radius_km) {
          const rMax = Number(radius_km);
          rows = rows.filter((r) => r.distance_km <= rMax);
        }

        if (sort === 'distance') {
          rows.sort((a, b) => a.distance_km - b.distance_km);
        }
      } else if (sort === 'rating') {
        rows.sort((a, b) => b.rating_overall - a.rating_overall);
      }

      const suggestedRelaxations = suggestRelaxations(req.query, rows.length);

      return res.json({
        success: true,
        data: rows,
        meta: {
          count: rows.length,
          suggestedRelaxations: rows.length === 0 ? suggestedRelaxations : undefined,
        },
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/saunas/recommendations
  app.get('/api/saunas/recommendations', (req: Request, res: Response) => {
    const { lat, lon, limit } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
    }
    const uLat = Number(lat);
    const uLon = Number(lon);
    const maxLimit = limit ? Number(limit) : 3;

    const stmt = db.prepare(`SELECT * FROM sauna_venues WHERE status = 'active'`);
    const all = stmt.all() as any[];

    const withDist = all.map((r) => {
      const dist = haversineDistance(uLat, uLon, Number(r.latitude), Number(r.longitude));
      return { ...r, distance_km: dist, distance_formatted: formatDistance(dist) };
    });

    withDist.sort((a, b) => a.distance_km - b.distance_km);
    const top = withDist.slice(0, maxLimit);
    return res.json({ success: true, data: top });
  });

  // GET /api/saunas/map-markers
  app.get('/api/saunas/map-markers', (_req: Request, res: Response) => {
    const stmt = db.prepare(`
      SELECT id, name, slug, latitude, longitude, category, is_promoted, promoted_badge, rating_overall, address_city
      FROM sauna_venues
      WHERE status = 'active'
    `);
    const markers = stmt.all();
    return res.json({ success: true, data: markers });
  });

  // GET /api/saunas/:slug
  app.get('/api/saunas/:slug', (req: Request, res: Response) => {
    const { slug } = req.params;
    const stmt = db.prepare(`
      SELECT * FROM sauna_venues WHERE slug = ? OR id = ?
    `);
    const venue = stmt.get(slug, slug) as any;
    if (!venue) {
      return res.status(404).json({ success: false, error: 'Venue not found' });
    }

    const ms = db.prepare(`SELECT * FROM venue_multisport_rules WHERE venue_id = ?`).get(venue.id);
    const policy = db.prepare(`SELECT * FROM venue_operating_policies WHERE venue_id = ?`).get(venue.id);
    const coolings = db.prepare(`
      SELECT vco.*, co.name_cz, co.name_en, co.icon_name
      FROM venue_cooling_options vco
      JOIN cooling_options co ON vco.cooling_option_id = co.id
      WHERE vco.venue_id = ?
    `).all(venue.id);
    const saunas = db.prepare(`
      SELECT vs.*, st.name_cz, st.name_en
      FROM venue_saunas vs
      JOIN sauna_types st ON vs.sauna_type_id = st.id
      WHERE vs.venue_id = ?
    `).all(venue.id);
    const hours = db.prepare(`SELECT * FROM venue_opening_hours WHERE venue_id = ? ORDER BY day_of_week`).all(venue.id);
    const pricing = db.prepare(`SELECT * FROM venue_pricing WHERE venue_id = ? ORDER BY price_czk`).all(venue.id);
    const ceremonies = db.prepare(`SELECT * FROM sauna_ceremonies WHERE venue_id = ?`).all(venue.id);
    const reviews = db.prepare(`SELECT * FROM reviews WHERE venue_id = ? ORDER BY created_at DESC`).all(venue.id);

    return res.json({
      success: true,
      data: {
        ...venue,
        multisport: ms,
        policies: policy,
        cooling_options: coolings,
        saunas,
        opening_hours: hours,
        pricing,
        ceremonies,
        reviews,
      },
    });
  });

  // POST /api/auth/register
  app.post('/api/auth/register', (req: Request, res: Response) => {
    const { email, password, display_name } = req.body;
    if (!email || !password || !display_name) {
      return res.status(400).json({ success: false, error: 'Chybí povinné údaje' });
    }

    const existing = db.prepare(`SELECT id FROM users WHERE email = ?`).get(email);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Uživatel s tímto e-mailem již existuje' });
    }

    const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const hash = bcrypt.hashSync(password, 10);
    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role)
      VALUES (?, ?, ?, ?, 'user')
    `).run(id, email, hash, display_name);

    const user = { id, email, display_name, role: 'user' };
    const token = getAuthToken(user);
    return res.status(201).json({ success: true, token, user });
  });

  // POST /api/auth/login
  app.post('/api/auth/login', (req: Request, res: Response) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Chybí e-mail nebo heslo' });
    }

    const user = db.prepare(`SELECT * FROM users WHERE email = ?`).get(email) as any;
    if (!user) {
      return res.status(401).json({ success: false, error: 'Neplatné přihlašovací údaje' });
    }

    const valid = bcrypt.compareSync(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ success: false, error: 'Neplatné přihlašovací údaje' });
    }

    const token = getAuthToken(user);
    return res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        role: user.role,
      },
    });
  });

  // GET /api/auth/me
  app.get('/api/auth/me', requireAuth, (req: Request, res: Response) => {
    const userPayload = (req as any).user;
    const user = db.prepare(`SELECT id, email, display_name, role, reviews_count, helpful_votes_received FROM users WHERE id = ?`).get(userPayload.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }
    return res.json({ success: true, user });
  });

  // POST /api/reviews
  app.post('/api/reviews', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const overall_rating = req.body.overall_rating !== undefined ? req.body.overall_rating : req.body.rating_overall;
    const cleanliness = req.body.cleanliness !== undefined ? req.body.cleanliness : req.body.rating_cleanliness;
    const heat_quality = req.body.heat_quality !== undefined ? req.body.heat_quality : req.body.rating_heat_steam;
    const cooling_quality = req.body.cooling_quality !== undefined ? req.body.cooling_quality : req.body.rating_cooling;
    const staff_ceremony = req.body.staff_ceremony !== undefined ? req.body.staff_ceremony : req.body.rating_staff_ceremonies;
    const price_value = req.body.price_value !== undefined ? req.body.price_value : req.body.rating_value;
    const { venue_id, title, content, tips, visit_date, recommended_time } = req.body;

    if (!venue_id || overall_rating === undefined) {
      return res.status(400).json({ success: false, error: 'Chybí venue_id nebo overall_rating' });
    }
    if (overall_rating < 1 || overall_rating > 5) {
      return res.status(400).json({ success: false, error: 'Hodnocení musí být mezi 1 a 5' });
    }
    if (content && content.length > 3000) {
      return res.status(400).json({ success: false, error: 'Maximální délka recenze je 3000 znaků' });
    }

    // Check duplicate review
    const dup = db.prepare(`SELECT id FROM reviews WHERE venue_id = ? AND user_id = ?`).get(venue_id, user.id);
    if (dup) {
      return res.status(409).json({ success: false, error: 'Pro tuto saunu jste již recenzi napsali' });
    }

    const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    // Atomic transaction for review creation and venue recalculation
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO reviews (
          id, venue_id, user_id, rating_overall, rating_cleanliness, rating_heat_steam,
          rating_cooling, rating_staff_ceremonies, rating_value, title, content, tips, recommended_time, visit_date, is_verified_visit
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
      `).run(
        reviewId, venue_id, user.id, overall_rating,
        cleanliness ?? overall_rating, heat_quality ?? overall_rating,
        cooling_quality ?? overall_rating, staff_ceremony ?? overall_rating,
        price_value ?? overall_rating, title ?? 'Uživatelská recenze', content ?? '',
        tips ?? null, recommended_time ?? null, visit_date ?? null
      );

      // Recalculate average ratings atomically
      const stats = db.prepare(`
        SELECT 
          COUNT(*) as count,
          AVG(rating_overall) as avg_overall,
          AVG(rating_cleanliness) as avg_clean,
          AVG(rating_heat_steam) as avg_heat,
          AVG(rating_cooling) as avg_cool,
          AVG(rating_staff_ceremonies) as avg_staff,
          AVG(rating_value) as avg_val
        FROM reviews
        WHERE venue_id = ? AND status = 'published'
      `).get(venue_id) as any;

      db.prepare(`
        UPDATE sauna_venues
        SET 
          rating_overall = ROUND(?, 2),
          rating_cleanliness = ROUND(?, 2),
          rating_heat_steam = ROUND(?, 2),
          rating_cooling = ROUND(?, 2),
          rating_staff_ceremonies = ROUND(?, 2),
          rating_value = ROUND(?, 2),
          review_count = ?
        WHERE id = ?
      `).run(
        stats.avg_overall, stats.avg_clean, stats.avg_heat, stats.avg_cool,
        stats.avg_staff, stats.avg_val, stats.count, venue_id
      );

      db.prepare(`UPDATE users SET reviews_count = reviews_count + 1 WHERE id = ?`).run(user.id);

      db.exec('COMMIT;');

      const createdReview = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(reviewId);
      return res.status(201).json({ success: true, review: createdReview });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/reviews/:venueId
  app.get('/api/reviews/:venueId', (req: Request, res: Response) => {
    const { venueId } = req.params;
    const reviews = db.prepare(`
      SELECT r.*, u.display_name as user_name, u.avatar_url as user_avatar
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.venue_id = ? AND r.status = 'published'
      ORDER BY r.created_at DESC
    `).all(venueId);
    return res.json({ success: true, data: reviews });
  });

  // POST /api/reviews/:id/helpful
  app.post('/api/reviews/:id/helpful', requireAuth, (req: Request, res: Response) => {
    const { id } = req.params;
    db.prepare(`UPDATE reviews SET helpful_votes_count = helpful_votes_count + 1 WHERE id = ?`).run(id);
    const rev = db.prepare(`SELECT user_id FROM reviews WHERE id = ?`).get(id) as any;
    if (rev) {
      db.prepare(`UPDATE users SET helpful_votes_received = helpful_votes_received + 1 WHERE id = ?`).run(rev.user_id);
    }
    return res.json({ success: true });
  });

  // POST /api/users/me/lists
  app.post('/api/users/me/lists', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { venue_id, list_type } = req.body;
    if (!venue_id || !list_type) {
      return res.status(400).json({ success: false, error: 'Chybí venue_id nebo list_type' });
    }

    const existing = db.prepare(`SELECT id FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?`).get(user.id, venue_id, list_type);
    if (existing) {
      return res.status(409).json({ success: false, error: 'Sauna již je v tomto seznamu' });
    }

    const listId = `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(`
      INSERT INTO user_venue_lists (id, user_id, venue_id, list_type)
      VALUES (?, ?, ?, ?)
    `).run(listId, user.id, venue_id, list_type);

    if (list_type === 'favorite') {
      db.prepare(`UPDATE sauna_venues SET favorite_count = favorite_count + 1 WHERE id = ?`).run(venue_id);
    }

    return res.status(201).json({ success: true });
  });

  // DELETE /api/users/me/lists/:venueId
  app.delete('/api/users/me/lists/:venueId', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const { venueId } = req.params;
    const listType = (req.query.type as string) || 'favorite';

    const entry = db.prepare(`SELECT id FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?`).get(user.id, venueId, listType);
    if (entry) {
      db.prepare(`DELETE FROM user_venue_lists WHERE id = ?`).run(entry.id);
      if (listType === 'favorite') {
        db.prepare(`UPDATE sauna_venues SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?`).run(venueId);
      }
    }

    return res.json({ success: true });
  });

  // GET /api/users/me/lists
  app.get('/api/users/me/lists', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const rows = db.prepare(`
      SELECT l.list_type, v.*
      FROM user_venue_lists l
      JOIN sauna_venues v ON l.venue_id = v.id
      WHERE l.user_id = ?
    `).all(user.id) as any[];

    const result: Record<string, any[]> = {
      favorite: [],
      want_to_visit: [],
      visited: [],
    };
    for (const r of rows) {
      if (result[r.list_type]) {
        result[r.list_type].push(r);
      }
    }

    return res.json({ success: true, data: result });
  });

  // POST /api/suggestions
  app.post('/api/suggestions', (req: Request, res: Response) => {
    const { name, venue_name, category, city, address, street_address, multisport_status, cooling_options, notes, description, submitter_email, submitter_name, region_id } = req.body;
    const vName = name || venue_name;
    const vAddress = address || street_address;
    if (!vName || !vAddress || !submitter_email || !submitter_email.includes('@')) {
      return res.status(400).json({ success: false, error: 'Chybí název, adresa nebo platný e-mail' });
    }

    const id = `sug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const subName = submitter_name || (submitter_email ? submitter_email.split('@')[0] : 'Uživatel');
    const vCity = city || 'Liberec';
    const vRegion = region_id || 'cz-lbk';

    try {
      db.prepare(`
        INSERT INTO venue_suggestions (
          id, venue_name, category, city, street_address, region_id,
          submitter_name, submitter_email, multisport_details, multisport_accepted,
          cooling_options, description, status
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
      `).run(
        id,
        vName,
        category ?? 'public',
        vCity,
        vAddress,
        vRegion,
        subName,
        submitter_email,
        multisport_status ?? null,
        multisport_status ? 1 : 0,
        cooling_options ? (typeof cooling_options === 'string' ? cooling_options : JSON.stringify(cooling_options)) : null,
        notes || description || null
      );

      return res.status(201).json({ success: true, suggestion_id: id });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // POST /api/suggestions/edit
  app.post('/api/suggestions/edit', (req: Request, res: Response) => {
    const { venue_id, report_type, details, submitter_email } = req.body;
    if (!venue_id || !details) {
      return res.status(400).json({ success: false, error: 'Chybí venue_id nebo detaily návrhu' });
    }

    const id = `sug_edit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(`
      INSERT INTO venue_edit_suggestions (id, venue_id, report_type, details, submitter_email, status)
      VALUES (?, ?, ?, ?, ?, 'pending')
    `).run(id, venue_id, report_type ?? 'other', details, submitter_email ?? 'user@sauna.cz');

    return res.status(201).json({ success: true, suggestion_id: id });
  });

  // PATCH /api/admin/suggestions/:id/approve
  app.patch('/api/admin/suggestions/:id/approve', (req: Request, res: Response) => {
    const { id } = req.params;
    const sug = db.prepare(`SELECT * FROM venue_suggestions WHERE id = ?`).get(id) as any;
    if (!sug) {
      return res.status(404).json({ success: false, error: 'Návrh nenalezen' });
    }

    const venueName = sug.venue_name || sug.name || 'Nova Sauna';
    const newVenueId = `venue_${venueName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
    const slug = newVenueId;

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`
        INSERT INTO sauna_venues (
          id, city_id, region_id, country_id, name, slug, category,
          short_description, description, address_street, address_city, address_zip,
          latitude, longitude, cover_image_url, status
        )
        VALUES (?, 'liberec', 'cz-lbk', 'CZ', ?, ?, ?, 'Nová sauna z komunitního návrhu', 'Komunitou schválená sauna.', ?, ?, '46001', 50.7671, 15.0562, '/images/venues/default.webp', 'active')
      `).run(newVenueId, venueName, slug, sug.category || 'hotel_mountain', sug.street_address || sug.address_street || 'Lesní 124', sug.city || sug.address_city || 'Liberec');

      db.prepare(`UPDATE venue_suggestions SET status = 'approved', created_venue_id = ? WHERE id = ?`).run(newVenueId, id);

      db.prepare(`
        INSERT INTO venue_multisport_rules (venue_id, is_accepted, benefit_type, time_limit_minutes)
        VALUES (?, 1, 'free_time_limited', 90)
      `).run(newVenueId);

      db.prepare(`
        INSERT INTO venue_operating_policies (venue_id)
        VALUES (?)
      `).run(newVenueId);

      db.exec('COMMIT;');
      return res.json({ success: true, venue_id: newVenueId });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // PATCH /api/admin/suggestions/:id/reject
  app.patch('/api/admin/suggestions/:id/reject', (req: Request, res: Response) => {
    const { id } = req.params;
    const { reason } = req.body;
    db.prepare(`UPDATE venue_suggestions SET status = 'rejected', moderator_comment = ? WHERE id = ?`).run(reason ?? null, id);
    return res.json({ success: true });
  });

  // POST /api/claims
  app.post('/api/claims', requireAuth, (req: Request, res: Response) => {
    const user = (req as any).user;
    const userId = user.id;

    const { venue_id, business_name, ico, applicant_name, applicant_role, business_email, official_email, phone, official_phone } = req.body;
    if (!venue_id || !business_name || !ico) {
      return res.status(400).json({ success: false, error: 'Chybí povinná pole' });
    }

    if (!validateIco(ico)) {
      return res.status(400).json({ success: false, error: 'Neplatné kontrolní číslo IČO' });
    }

    // Check if venue already verified
    const venue = db.prepare(`SELECT is_verified_partner FROM sauna_venues WHERE id = ?`).get(venue_id) as any;
    if (venue && venue.is_verified_partner === 1) {
      return res.status(409).json({ success: false, error: 'Tento profil již je ověřeným provozovatelem' });
    }

    const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    db.prepare(`
      INSERT INTO venue_claims (
        id, venue_id, user_id, business_name, ico, applicant_name, applicant_role,
        official_email, official_phone, verification_status
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')
    `).run(
      claimId,
      venue_id,
      userId,
      business_name,
      ico,
      applicant_name ?? 'Marek Svoboda',
      applicant_role ?? 'Jednatel / Provozní ředitel',
      official_email ?? business_email ?? 'operator@saunaspot.cz',
      official_phone ?? phone ?? '+420 774 445 556'
    );

    return res.status(201).json({ success: true, claim_id: claimId });
  });

  // PATCH /api/admin/claims/:id/verify
  app.patch('/api/admin/claims/:id/verify', (req: Request, res: Response) => {
    const { id } = req.params;
    const claim = db.prepare(`SELECT * FROM venue_claims WHERE id = ?`).get(id) as any;
    if (!claim) {
      return res.status(404).json({ success: false, error: 'Žádost nenalezena' });
    }

    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`UPDATE venue_claims SET verification_status = 'approved', verified_at = CURRENT_TIMESTAMP WHERE id = ?`).run(id);
      db.prepare(`
        UPDATE sauna_venues
        SET is_verified_partner = 1, claimed_by_user_id = ?, claimed_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(claim.user_id, claim.venue_id);
      db.exec('COMMIT;');
      return res.json({ success: true });
    } catch (err: any) {
      db.exec('ROLLBACK;');
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // GET /api/ceremonies
  app.get('/api/ceremonies', (req: Request, res: Response) => {
    const { venue_id } = req.query;
    let sql = `SELECT * FROM sauna_ceremonies`;
    const params: any[] = [];
    if (venue_id) {
      sql += ` WHERE venue_id = ?`;
      params.push(venue_id);
    }
    sql += ` ORDER BY start_time ASC`;
    const ceremonies = db.prepare(sql).all(...params);
    return res.json({ success: true, data: ceremonies });
  });

  // GET /api/affiliate-products
  app.get('/api/affiliate-products', (_req: Request, res: Response) => {
    const products = db.prepare(`
      SELECT * FROM affiliate_partner_products WHERE is_active = 1 ORDER BY display_order ASC
    `).all();
    return res.json({ success: true, data: products });
  });

  // POST /api/referrals/click
  app.post('/api/referrals/click', (req: Request, res: Response) => {
    const { venue_id, affiliate_product_id, click_type, user_agent, referrer } = req.body;
    const clickId = `clk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    try {
      db.prepare(`
        INSERT INTO partner_referral_clicks (id, venue_id, affiliate_product_id, click_type, user_agent, referrer)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(clickId, venue_id ?? null, affiliate_product_id ?? null, click_type ?? 'venue_website', user_agent ?? null, referrer ?? null);
      return res.status(204).send();
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  return app;
}

/**
 * Return the real production Express application (server/src/app.ts)
 * wired to the provided SQLite database.
 */
export function getProductionApp(database?: DatabaseSync): express.Application {
  if (database) {
    setDb(database);
  }
  return productionApp;
}
