import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import bcrypt from 'bcryptjs';
import { getDb } from './connection.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface CatalogData {
  countries: any[];
  regions: any[];
  cities: any[];
  cooling_options: any[];
  sauna_types: any[];
  amenity_facilities: any[];
  affiliate_partner_products: any[];
  users: any[];
}

export function runSeed(customDb?: DatabaseSync): { success: boolean; venueCount: number; reviewCount: number } {
  const db = customDb || getDb();

  const catalogsPath = path.resolve(__dirname, 'seeds/seed_catalogs.json');
  const venuesPath = path.resolve(__dirname, 'seeds/seed_venues.json');

  if (!fs.existsSync(catalogsPath) || !fs.existsSync(venuesPath)) {
    throw new Error('Seed data files not found in seeds directory');
  }

  const catalogs: CatalogData = JSON.parse(fs.readFileSync(catalogsPath, 'utf8'));
  const venues: any[] = JSON.parse(fs.readFileSync(venuesPath, 'utf8'));

  console.log('[seed] Starting database seed...');
  db.exec('BEGIN TRANSACTION');

  try {
    // 1. Countries
    const insertCountry = db.prepare(`
      INSERT OR REPLACE INTO countries (
        id, name, slug, currency_code, default_locale, phone_prefix,
        bounds_north, bounds_south, bounds_east, bounds_west,
        center_latitude, center_longitude, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const c of catalogs.countries) {
      insertCountry.run(
        c.id, c.name, c.slug, c.currency_code, c.default_locale, c.phone_prefix,
        c.bounds_north ?? null, c.bounds_south ?? null, c.bounds_east ?? null, c.bounds_west ?? null,
        c.center_latitude, c.center_longitude, c.is_active ? 1 : 0
      );
    }
    console.log(`[seed] Seeded ${catalogs.countries.length} countries`);

    // 2. Regions
    const insertRegion = db.prepare(`
      INSERT OR REPLACE INTO regions (
        id, country_id, code, name, short_name, slug,
        latitude, longitude, zoom_level, display_order, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const r of catalogs.regions) {
      insertRegion.run(
        r.id, r.country_id, r.code, r.name, r.short_name, r.slug,
        r.latitude, r.longitude, r.zoom_level, r.display_order, r.is_active ? 1 : 0
      );
    }
    console.log(`[seed] Seeded ${catalogs.regions.length} regions`);

    // 3. Cities
    const insertCity = db.prepare(`
      INSERT OR REPLACE INTO cities (
        id, region_id, name, slug, postal_code_prefix,
        latitude, longitude, is_major, sauna_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const ct of catalogs.cities) {
      insertCity.run(
        ct.id, ct.region_id, ct.name, ct.slug, ct.postal_code_prefix ?? null,
        ct.latitude, ct.longitude, ct.is_major ? 1 : 0, ct.sauna_count || 0
      );
    }
    console.log(`[seed] Seeded ${catalogs.cities.length} cities`);

    // 4. Cooling Options Catalog
    const insertCooling = db.prepare(`
      INSERT OR REPLACE INTO cooling_options (
        id, name_cz, name_en, category, icon_name, description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);
    for (const co of catalogs.cooling_options) {
      insertCooling.run(co.id, co.name_cz, co.name_en, co.category, co.icon_name, co.description);
    }
    console.log(`[seed] Seeded ${catalogs.cooling_options.length} cooling options`);

    // 5. Sauna Types Catalog
    const insertSaunaType = db.prepare(`
      INSERT OR REPLACE INTO sauna_types (
        id, name_cz, name_en, default_temp_celsius, default_humidity_percentage, icon_name, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const st of catalogs.sauna_types) {
      insertSaunaType.run(st.id, st.name_cz, st.name_en, st.default_temp_celsius, st.default_humidity_percentage, st.icon_name, st.description);
    }
    console.log(`[seed] Seeded ${catalogs.sauna_types.length} sauna types`);

    // 6. Amenity Facilities Catalog
    const insertAmenity = db.prepare(`
      INSERT OR REPLACE INTO amenity_facilities (
        id, name_cz, name_en, icon_name, description
      ) VALUES (?, ?, ?, ?, ?)
    `);
    for (const af of catalogs.amenity_facilities) {
      insertAmenity.run(af.id, af.name_cz, af.name_en, af.icon_name, af.description);
    }
    console.log(`[seed] Seeded ${catalogs.amenity_facilities.length} amenity facilities`);

    // 7. Affiliate Partner Products
    const insertProduct = db.prepare(`
      INSERT OR REPLACE INTO affiliate_partner_products (
        id, category, product_name, partner_shop_name, image_url, price_czk, affiliate_url, description, is_active, display_order
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const pr of catalogs.affiliate_partner_products) {
      insertProduct.run(
        pr.id, pr.category, pr.product_name, pr.partner_shop_name, pr.image_url,
        pr.price_czk, pr.affiliate_url, pr.description ?? null, pr.is_active ? 1 : 0, pr.display_order || 0
      );
    }
    console.log(`[seed] Seeded ${catalogs.affiliate_partner_products.length} affiliate products`);

    // 8. Users
    const standardPasswordHash = bcrypt.hashSync('sauna123', 10);
    const insertUser = db.prepare(`
      INSERT OR REPLACE INTO users (
        id, email, password_hash, display_name, avatar_url, role, bio,
        preferred_region_id, is_email_verified, reviews_count, helpful_votes_received
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const u of catalogs.users) {
      insertUser.run(
        u.id, u.email, standardPasswordHash, u.display_name, u.avatar_url ?? null,
        u.role || 'user', u.bio ?? null, u.preferred_region_id ?? null,
        u.is_email_verified ? 1 : 0, u.reviews_count || 0, u.helpful_votes_received || 0
      );
    }
    console.log(`[seed] Seeded ${catalogs.users.length} users (password for testing: 'sauna123')`);

    // 9. Core Sauna Venues
    const insertVenue = db.prepare(`
      INSERT OR REPLACE INTO sauna_venues (
        id, city_id, region_id, country_id, name, slug, category,
        short_description, description, address_street, address_city, address_zip,
        latitude, longitude, phone, email, website_url, booking_url,
        cover_image_url, gallery_urls,
        has_plunge_pool, has_outdoor_cooling, has_natural_water, has_ice_well,
        has_bucket_shower, has_experience_showers, has_ceremonial_hall,
        has_whirlpool, has_steam_bath, has_herbal_sauna, has_private_rental,
        rating_overall, rating_cleanliness, rating_heat_steam, rating_cooling,
        rating_staff_ceremonies, rating_value, review_count, favorite_count,
        is_promoted, promoted_badge, promoted_tier, is_verified_partner, status
      ) VALUES (
        ?, ?, ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?,
        ?, ?, ?, ?, ?, ?,
        ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?,
        ?, ?, ?, ?, ?
      )
    `);

    const insertMultisport = db.prepare(`
      INSERT OR REPLACE INTO venue_multisport_rules (
        venue_id, is_accepted, benefit_type, time_limit_minutes,
        discount_amount_czk, discount_percentage, entry_surcharge_czk,
        overtime_surcharge_per_block_czk, overtime_block_minutes,
        included_zones, towel_sheet_service_included, valid_days,
        valid_hours_description, accepted_card_types, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPolicy = db.prepare(`
      INSERT OR REPLACE INTO venue_operating_policies (
        venue_id, access_type, nudity_policy, women_only_policy,
        women_only_schedule_note, men_only_schedule_note, children_policy,
        children_min_age, barrier_free_access, parking_policy, parking_notes,
        refreshment_type, towels_and_sheets
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVenueCooling = db.prepare(`
      INSERT OR REPLACE INTO venue_cooling_options (
        id, venue_id, cooling_option_id, water_temperature_celsius, description, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const insertVenueSauna = db.prepare(`
      INSERT OR REPLACE INTO venue_saunas (
        id, venue_id, sauna_type_id, custom_name,
        temperature_celsius_min, temperature_celsius_max,
        humidity_percentage_min, humidity_percentage_max,
        capacity_persons, wood_type, stove_type, features, description, photo_url
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertVenueAmenity = db.prepare(`
      INSERT OR REPLACE INTO venue_amenities (
        id, venue_id, amenity_id, quantity, description
      ) VALUES (?, ?, ?, ?, ?)
    `);

    const insertOpeningHours = db.prepare(`
      INSERT OR REPLACE INTO venue_opening_hours (
        id, venue_id, day_of_week, open_time, close_time, is_closed, special_note
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const insertPricing = db.prepare(`
      INSERT OR REPLACE INTO venue_pricing (
        id, venue_id, ticket_name, duration_minutes, price_czk,
        price_student_czk, price_senior_czk, is_default, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertReview = db.prepare(`
      INSERT OR REPLACE INTO reviews (
        id, venue_id, user_id, rating_overall, rating_cleanliness,
        rating_heat_steam, rating_cooling, rating_staff_ceremonies, rating_value,
        title, content, tips, recommended_time, visit_date, is_verified_visit,
        helpful_votes_count, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertCeremony = db.prepare(`
      INSERT OR REPLACE INTO sauna_ceremonies (
        id, venue_id, title, category, description, ceremony_master, hall_name,
        day_of_week, is_recurring, recurrence_pattern, start_time, end_time,
        event_date, special_entry_fee_czk, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let totalCoolingCount = 0;
    let totalSaunasCount = 0;
    let totalAmenitiesCount = 0;
    let totalHoursCount = 0;
    let totalPricingCount = 0;
    let totalReviewsCount = 0;
    let totalCeremoniesCount = 0;

    const userIds = catalogs.users.map((u: any) => u.id);

    for (const v of venues) {
      insertVenue.run(
        v.id, v.city_id, v.region_id, v.country_id || 'CZ', v.name, v.slug, v.category,
        v.short_description, v.description, v.address_street, v.address_city, v.address_zip,
        v.latitude, v.longitude, v.phone ?? null, v.email ?? null, v.website_url ?? null, v.booking_url ?? null,
        v.cover_image_url, typeof v.gallery_urls === 'string' ? v.gallery_urls : JSON.stringify(v.gallery_urls || []),
        v.has_plunge_pool ? 1 : 0, v.has_outdoor_cooling ? 1 : 0, v.has_natural_water ? 1 : 0, v.has_ice_well ? 1 : 0,
        v.has_bucket_shower ? 1 : 0, v.has_experience_showers ? 1 : 0, v.has_ceremonial_hall ? 1 : 0,
        v.has_whirlpool ? 1 : 0, v.has_steam_bath ? 1 : 0, v.has_herbal_sauna ? 1 : 0, v.has_private_rental ? 1 : 0,
        v.rating_overall || 0, v.rating_cleanliness || 0, v.rating_heat_steam || 0, v.rating_cooling || 0,
        v.rating_staff_ceremonies || 0, v.rating_value || 0, v.review_count || 0, v.favorite_count || 0,
        v.is_promoted ? 1 : 0, v.promoted_badge ?? null, v.promoted_tier ?? null,
        v.is_verified_partner ? 1 : 0, v.status || 'active'
      );

      // MultiSport
      if (v.multisport) {
        const ms = v.multisport;
        insertMultisport.run(
          v.id, ms.is_accepted ? 1 : 0, ms.benefit_type || 'not_accepted',
          ms.time_limit_minutes ?? null, ms.discount_amount_czk ?? null, ms.discount_percentage ?? null,
          ms.entry_surcharge_czk ?? null, ms.overtime_surcharge_per_block_czk ?? null, ms.overtime_block_minutes ?? null,
          ms.included_zones || 'Saunový svět', ms.towel_sheet_service_included ? 1 : 0,
          ms.valid_days || 'all_week', ms.valid_hours_description || 'Po celou otevírací dobu',
          typeof ms.accepted_card_types === 'string' ? ms.accepted_card_types : JSON.stringify(ms.accepted_card_types || ['multisport_standard']),
          ms.note ?? null
        );
      }

      // Policies
      if (v.policies) {
        const pol = v.policies;
        insertPolicy.run(
          v.id, pol.access_type || 'public_walkin', pol.nudity_policy || 'strict_nudist',
          pol.women_only_policy || 'none', pol.women_only_schedule_note ?? null,
          pol.men_only_schedule_note ?? null, pol.children_policy || 'children_welcome',
          pol.children_min_age ?? null, pol.barrier_free_access || 'partial',
          pol.parking_policy || 'free_onsite', pol.parking_notes ?? null,
          pol.refreshment_type || 'sauna_bar_full', pol.towels_and_sheets || 'included_free'
        );
      }

      // Cooling options
      if (Array.isArray(v.cooling_ids)) {
        for (let idx = 0; idx < v.cooling_ids.length; idx++) {
          const c = v.cooling_ids[idx];
          const coolingId = `${v.id}_${c.option_id}`;
          insertVenueCooling.run(
            coolingId, v.id, c.option_id, c.temp ?? null, c.desc ?? null, c.featured ? 1 : 0
          );
          totalCoolingCount++;
        }
      }

      // Saunas
      if (Array.isArray(v.saunas)) {
        for (let idx = 0; idx < v.saunas.length; idx++) {
          const s = v.saunas[idx];
          const saunaId = `${v.id}_sauna_${idx + 1}`;
          insertVenueSauna.run(
            saunaId, v.id, s.sauna_type_id, s.name || 'Sauna',
            s.t_min ?? 80, s.t_max ?? 95, s.h_min ?? 10, s.h_max ?? 20,
            s.cap ?? null, s.wood ?? null, s.stove ?? null,
            typeof s.features === 'string' ? s.features : (s.features ? JSON.stringify(s.features) : null),
            s.desc ?? null, s.photo_url ?? null
          );
          totalSaunasCount++;
        }
      }

      // Amenities
      if (Array.isArray(v.amenities)) {
        for (const amId of v.amenities) {
          const id = `${v.id}_amenity_${amId}`;
          insertVenueAmenity.run(id, v.id, amId, 1, null);
          totalAmenitiesCount++;
        }
      }

      // Opening hours
      if (Array.isArray(v.opening_hours)) {
        for (const oh of v.opening_hours) {
          const id = `${v.id}_day_${oh.day}`;
          insertOpeningHours.run(id, v.id, oh.day, oh.open, oh.close, oh.closed ? 1 : 0, oh.note ?? null);
          totalHoursCount++;
        }
      }

      // Pricing
      if (Array.isArray(v.pricing)) {
        for (let idx = 0; idx < v.pricing.length; idx++) {
          const p = v.pricing[idx];
          const id = `${v.id}_price_${idx + 1}`;
          insertPricing.run(
            id, v.id, p.name, p.dur ?? null, p.price, p.stud ?? null, p.sen ?? null,
            p.is_def ? 1 : 0, p.note ?? null
          );
          totalPricingCount++;
        }
      }

      // Reviews
      let hasExplicitReviews = false;
      if (Array.isArray(v.reviews) && v.reviews.length > 0) {
        hasExplicitReviews = true;
        for (let idx = 0; idx < v.reviews.length; idx++) {
          const rev = v.reviews[idx];
          const id = rev.id || `rev_${v.id}_${idx + 1}`;
          insertReview.run(
            id, v.id, rev.user_id, rev.rating_overall, rev.rating_cleanliness,
            rev.rating_heat_steam, rev.rating_cooling, rev.rating_staff_ceremonies, rev.rating_value,
            rev.title, rev.content, rev.tips ?? null, rev.recommended_time ?? null,
            rev.visit_date || '2026-08-15', rev.is_verified ? 1 : 0,
            rev.helpful_votes || 0, rev.status || 'published'
          );
          totalReviewsCount++;
        }
      }

      // If venue does not have explicit review array in seed_venues.json,
      // generate a realistic Czech community review so all 26 venues have authentic review data!
      if (!hasExplicitReviews) {
        const assignedUserId = userIds[totalReviewsCount % userIds.length];
        const reviewId = `rev_${v.id}_community`;
        const rating = Math.round(v.rating_overall || 4.5);
        const reviewTitle = `Skvělá návštěva v ${v.name}`;
        const reviewContent = `${v.name} splnila naše očekávání. Příjemná atmosféra, čisté zázemí a skvělé možnosti prohřátí. Určitě se sem budeme rádi vracet.`;
        const tip = v.has_plunge_pool ? 'Doporučuji vyzkoušet ochlazovací bazének hned po ceremoniálu!' : 'Ideální přijít v podvečerních hodinách.';

        insertReview.run(
          reviewId, v.id, assignedUserId, rating, 5,
          rating, rating, 4, 4,
          reviewTitle, reviewContent, tip, 'Podvečer kolem 18:00',
          '2026-08-20', 1, 12, 'published'
        );
        totalReviewsCount++;
      }

      // Ceremonies
      if (Array.isArray(v.ceremonies) && v.ceremonies.length > 0) {
        for (let idx = 0; idx < v.ceremonies.length; idx++) {
          const cer = v.ceremonies[idx];
          const id = cer.id || `cer_${v.id}_${idx + 1}`;
          insertCeremony.run(
            id, v.id, cer.title, cer.category || 'relaxing', cer.description,
            cer.master || cer.ceremony_master || 'Saunový mistr', cer.hall || cer.hall_name || 'Hlavní sál',
            cer.day !== undefined ? cer.day : (cer.day_of_week ?? 2),
            cer.recurring !== undefined ? (cer.recurring ? 1 : 0) : 1,
            cer.pattern || cer.recurrence_pattern || 'weekly',
            cer.start || cer.start_time || '18:00', cer.end || cer.end_time || '18:20',
            cer.date || cer.event_date || null,
            cer.fee || cer.special_entry_fee_czk || 0,
            cer.featured ? 1 : 0
          );
          totalCeremoniesCount++;
        }
      }
    }

    console.log(`[seed] Seeded ${venues.length} sauna venues`);
    console.log(`[seed] Seeded ${totalCoolingCount} venue cooling options`);
    console.log(`[seed] Seeded ${totalSaunasCount} venue saunas`);
    console.log(`[seed] Seeded ${totalAmenitiesCount} venue amenities`);
    console.log(`[seed] Seeded ${totalHoursCount} opening hour records`);
    console.log(`[seed] Seeded ${totalPricingCount} ticket pricing records`);
    console.log(`[seed] Seeded ${totalReviewsCount} reviews`);
    console.log(`[seed] Seeded ${totalCeremoniesCount} ceremonies`);

    // 10. Recalculate venue review aggregates directly from reviews table
    db.exec(`
      UPDATE sauna_venues
      SET
        rating_overall = ROUND((SELECT AVG(rating_overall) FROM reviews WHERE venue_id = sauna_venues.id), 2),
        rating_cleanliness = ROUND((SELECT AVG(rating_cleanliness) FROM reviews WHERE venue_id = sauna_venues.id), 2),
        rating_heat_steam = ROUND((SELECT AVG(rating_heat_steam) FROM reviews WHERE venue_id = sauna_venues.id), 2),
        rating_cooling = ROUND((SELECT AVG(rating_cooling) FROM reviews WHERE venue_id = sauna_venues.id), 2),
        rating_staff_ceremonies = ROUND((SELECT AVG(rating_staff_ceremonies) FROM reviews WHERE venue_id = sauna_venues.id), 2),
        rating_value = ROUND((SELECT AVG(rating_value) FROM reviews WHERE venue_id = sauna_venues.id), 2),
        review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = sauna_venues.id)
      WHERE EXISTS (SELECT 1 FROM reviews WHERE venue_id = sauna_venues.id);
    `);

    // Update user review counts
    db.exec(`
      UPDATE users
      SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE user_id = users.id);
    `);

    // 11. Seed sample user lists (Favorites, Want to visit)
    const insertUserList = db.prepare(`
      INSERT OR REPLACE INTO user_venue_lists (id, user_id, venue_id, list_type, visited_at, personal_notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    insertUserList.run('list_jakub_fav_1', 'user_sauna_master_jakub', 'saunaspot-dvorce', 'favorite', null, 'Moje domovská sauna.');
    insertUserList.run('list_eva_fav_1', 'user_eva_wellness', 'infinit-maximus-brno', 'favorite', null, 'Nejkrásnější přírodní biotop.');
    insertUserList.run('list_eva_want_1', 'user_eva_wellness', 'saunaspot-dvorce', 'want_to_visit', null, 'Chci vyzkoušet ochlazení ve Vltavě.');
    insertUserList.run('list_tomas_fav_1', 'user_tomas_plzen', 'bazen-slovany-saunove-centrum', 'favorite', null, 'Skvělý bazén i sauna.');
    console.log('[seed] Seeded initial user lists (Favorites / Want to visit)');

    // Update favorite counts on venues
    db.exec(`
      UPDATE sauna_venues
      SET favorite_count = (
        SELECT COUNT(*) FROM user_venue_lists WHERE venue_id = sauna_venues.id AND list_type = 'favorite'
      );
    `);

    // 12. Seed sample B2B venue claims
    const insertClaim = db.prepare(`
      INSERT OR REPLACE INTO venue_claims (
        id, venue_id, user_id, business_name, ico, applicant_name, applicant_role,
        official_email, official_phone, billing_address, verification_status, verification_method, verification_notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertClaim.run(
      'claim_dvorce_pending', 'saunaspot-dvorce', 'user_sauna_master_jakub',
      'Saunaspot s.r.o.', '28492019', 'Jakub Král', 'Jednatel a vedoucí saunér',
      'provoz@saunaspot.cz', '+420 774 445 556', 'Podolské nábřeží 1, Praha 4',
      'pending', 'corporate_domain_email', 'Žádost o správu profilu čeká na schválení administrátorem.'
    );
    console.log('[seed] Seeded sample B2B venue claim');

    // 13. Seed sample community proposal (suggestion)
    const insertSuggestion = db.prepare(`
      INSERT OR REPLACE INTO venue_suggestions (
        id, user_id, submitter_name, submitter_email, venue_name, category,
        street_address, city, region_id, postal_code, latitude, longitude,
        website_url, phone, multisport_accepted, multisport_details,
        sauna_types, cooling_options, description, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    insertSuggestion.run(
      'sugg_karlstejn', 'user_eva_wellness', 'Eva Nováková', 'eva.novakova@seznam.cz',
      'Přírodní sauna u Berounky', 'wellness_ceremonial',
      'U Jezu 14', 'Karlštejn', 'cz-stc', '267 18', 49.9385, 14.1812,
      'https://www.saunakarlstejn.cz', '+420 603 112 233', 1, 'MultiSport 60 min zdarma',
      JSON.stringify(['finnish_dry', 'bio_herbal']), JSON.stringify(['natural_water_river']),
      'Nová komunitní dřevěná sauna přímo u břehu řeky Berounky.', 'pending'
    );
    console.log('[seed] Seeded sample community suggestion');

    db.exec('COMMIT');
    console.log('[seed] Database seed completed successfully!');

    return {
      success: true,
      venueCount: venues.length,
      reviewCount: totalReviewsCount,
    };
  } catch (error) {
    db.exec('ROLLBACK');
    console.error('[seed] Database seed failed, transaction rolled back:', error);
    throw error;
  }
}

// Auto-run if executed directly via CLI
const isDirectExecution =
  Boolean(process.argv[1]) &&
  (process.argv[1].endsWith('seed.ts') || process.argv[1].endsWith('seed.js'));

if (isDirectExecution) {
  try {
    const res = runSeed();
    console.log(`[seed] Seed finished successfully. ${res.venueCount} venues and ${res.reviewCount} reviews seeded.`);
  } catch (err) {
    console.error('[seed] Fatal error in seed:', err);
    process.exit(1);
  }
}
