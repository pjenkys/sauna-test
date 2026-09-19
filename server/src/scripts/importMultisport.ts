import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/connection.js';
import { MultiSportClient, type MultiSportRawFacilityDetail } from '../services/multisportClient.js';
import { parseMultiSportVenue, type ParsedMultiSportVenue } from '../services/multisportParser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function importMultisportSaunas(options: {
  db?: DatabaseSync;
  offlineFile?: string;
  maxVenues?: number;
  verbose?: boolean;
} = {}): Promise<{
  totalFetched: number;
  totalImported: number;
  regionsBreakdown: Record<string, number>;
  benefitTypeBreakdown: Record<string, number>;
  withPlungePool: number;
}> {
  const db = options.db || getDb();
  const verbose = options.verbose ?? true;

  let rawDetails: MultiSportRawFacilityDetail[] = [];

  const snapshotPath =
    options.offlineFile || path.resolve(__dirname, '../db/seeds/multisport_venues.json');

  if ((options.offlineFile || process.argv.includes('--offline')) && fs.existsSync(snapshotPath)) {
    if (verbose) console.log(`[MultiSport Import] Loading snapshot from: ${snapshotPath}`);
    rawDetails = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));
  } else {
    if (verbose) console.log('[MultiSport Import] Connecting to mapa.multisport.cz API...');
    const client = new MultiSportClient();
    rawDetails = await client.fetchAllSaunaDetails(8, (loaded, total, name) => {
      if (verbose && (loaded % 25 === 0 || loaded === total)) {
        console.log(`[MultiSport Import] Progress: ${loaded}/${total} saunas loaded (${name})`);
      }
    });

    // Save snapshot for offline use
    try {
      const dir = path.dirname(snapshotPath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(snapshotPath, JSON.stringify(rawDetails, null, 2), 'utf8');
      if (verbose) console.log(`[MultiSport Import] Saved raw snapshot (${rawDetails.length} saunas) to ${snapshotPath}`);
    } catch (err: any) {
      console.warn('[MultiSport Import] Failed to save snapshot:', err.message);
    }
  }

  if (options.maxVenues && rawDetails.length > options.maxVenues) {
    rawDetails = rawDetails.slice(0, options.maxVenues);
  }

  if (verbose) console.log(`[MultiSport Import] Parsing and importing ${rawDetails.length} saunas into database...`);

  const regionsBreakdown: Record<string, number> = {};
  const benefitTypeBreakdown: Record<string, number> = {};
  let withPlungePool = 0;

  db.exec('BEGIN TRANSACTION');

  try {
    const insertRegionStmt = db.prepare(`
      INSERT OR IGNORE INTO regions (
        id, country_id, code, name, short_name, slug, latitude, longitude, zoom_level, display_order, is_active
      ) VALUES (?, 'CZ', ?, ?, ?, ?, ?, ?, 10, ?, 1)
    `);

    const defaultCzechRegions = [
      { id: 'cz-pha', code: 'PHA', name: 'Hlavní město Praha', short: 'Praha', slug: 'praha', lat: 50.0878, lon: 14.4205, order: 1 },
      { id: 'cz-stc', code: 'STC', name: 'Středočeský kraj', short: 'Středočeský', slug: 'stredocesky-kraj', lat: 50.0, lon: 14.7, order: 2 },
      { id: 'cz-jhm', code: 'JHM', name: 'Jihomoravský kraj', short: 'Jihomoravský', slug: 'jihomoravsky-kraj', lat: 49.1951, lon: 16.6068, order: 3 },
      { id: 'cz-msk', code: 'MSK', name: 'Moravskoslezský kraj', short: 'Moravskoslezský', slug: 'moravskoslezsky-kraj', lat: 49.8347, lon: 18.282, order: 4 },
      { id: 'cz-plk', code: 'PLK', name: 'Plzeňský kraj', short: 'Plzeňský', slug: 'plzensky-kraj', lat: 49.7475, lon: 13.3776, order: 5 },
      { id: 'cz-lbk', code: 'LBK', name: 'Liberecký kraj', short: 'Liberecký', slug: 'liberecky-kraj', lat: 50.7671, lon: 15.0562, order: 6 },
      { id: 'cz-hkk', code: 'HKK', name: 'Královéhradecký kraj', short: 'Královéhradecký', slug: 'kralovehradecky-kraj', lat: 50.2092, lon: 15.8328, order: 7 },
      { id: 'cz-olk', code: 'OLK', name: 'Olomoucký kraj', short: 'Olomoucký', slug: 'olomoucky-kraj', lat: 49.5938, lon: 17.2509, order: 8 },
      { id: 'cz-jhc', code: 'JHC', name: 'Jihočeský kraj', short: 'Jihočeský', slug: 'jihocesky-kraj', lat: 48.9745, lon: 14.4743, order: 9 },
      { id: 'cz-vys', code: 'VYS', name: 'Kraj Vysočina', short: 'Vysočina', slug: 'kraj-vysocina', lat: 49.3961, lon: 15.5882, order: 10 },
      { id: 'cz-ulk', code: 'ULK', name: 'Ústecký kraj', short: 'Ústecký', slug: 'ustecky-kraj', lat: 50.6607, lon: 14.0323, order: 11 },
      { id: 'cz-pak', code: 'PAK', name: 'Pardubický kraj', short: 'Pardubický', slug: 'pardubicky-kraj', lat: 50.0343, lon: 15.7812, order: 12 },
      { id: 'cz-zlk', code: 'ZLK', name: 'Zlínský kraj', short: 'Zlínský', slug: 'zlinsky-kraj', lat: 49.2243, lon: 17.6627, order: 13 },
      { id: 'cz-kvk', code: 'KVK', name: 'Karlovarský kraj', short: 'Karlovarský', slug: 'karlovarsky-kraj', lat: 50.2319, lon: 12.8719, order: 14 },
    ];
    for (const r of defaultCzechRegions) {
      insertRegionStmt.run(r.id, r.code, r.name, r.short, r.slug, r.lat, r.lon, r.order);
    }

    const insertCityStmt = db.prepare(`
      INSERT OR IGNORE INTO cities (
        id, region_id, name, slug, latitude, longitude, is_major, sauna_count
      ) VALUES (?, ?, ?, ?, ?, ?, 0, 0)
    `);

    const upsertVenueStmt = db.prepare(`
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
        is_promoted, promoted_badge, is_verified_partner, status
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
        ?, ?, ?, ?
      )
    `);

    const upsertMultisportStmt = db.prepare(`
      INSERT OR REPLACE INTO venue_multisport_rules (
        venue_id, is_accepted, benefit_type, time_limit_minutes,
        discount_amount_czk, discount_percentage, entry_surcharge_czk,
        overtime_surcharge_per_block_czk, overtime_block_minutes,
        included_zones, towel_sheet_service_included, valid_days,
        valid_hours_description, accepted_card_types, note
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const upsertCoolingStmt = db.prepare(`
      INSERT OR IGNORE INTO venue_cooling_options (
        id, venue_id, cooling_option_id, water_temperature_celsius, description, is_featured
      ) VALUES (?, ?, ?, ?, ?, ?)
    `);

    const upsertSaunaTypeStmt = db.prepare(`
      INSERT OR IGNORE INTO venue_saunas (
        id, venue_id, sauna_type_id, custom_name,
        temperature_celsius_min, temperature_celsius_max,
        humidity_percentage_min, humidity_percentage_max,
        capacity_persons, description
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let importedCount = 0;

    for (const raw of rawDetails) {
      const parsed: ParsedMultiSportVenue = parseMultiSportVenue(raw);

      // 1. Ensure city exists and get actual city_id
      const citySlug = parsed.cityId.split('-').slice(2).join('-') || 'mesto';
      const findCityStmt = db.prepare(`
        SELECT id FROM cities 
        WHERE (region_id = ? AND slug = ?) OR id = ? OR LOWER(name) = LOWER(?)
        LIMIT 1
      `);
      const existingCity = findCityStmt.get(parsed.regionId, citySlug, parsed.cityId, parsed.addressCity) as { id: string } | undefined;

      let actualCityId = parsed.cityId;
      if (existingCity) {
        actualCityId = existingCity.id;
      } else {
        insertCityStmt.run(
          parsed.cityId,
          parsed.regionId,
          parsed.addressCity,
          citySlug,
          parsed.latitude,
          parsed.longitude
        );
        // Verify city row actually exists or fallback
        const verifyCity = db.prepare(`SELECT id FROM cities WHERE id = ? LIMIT 1`).get(parsed.cityId) as { id: string } | undefined;
        if (!verifyCity) {
          const fallback = db.prepare(`SELECT id FROM cities WHERE region_id = ? OR slug = ? LIMIT 1`).get(parsed.regionId, citySlug) as { id: string } | undefined;
          if (fallback) {
            actualCityId = fallback.id;
          }
        }
      }

      // 2. Upsert Venue
      upsertVenueStmt.run(
        parsed.id,
        actualCityId,
        parsed.regionId,
        parsed.countryId,
        parsed.name,
        parsed.slug,
        parsed.category,
        parsed.shortDescription,
        parsed.description,
        parsed.addressStreet,
        parsed.addressCity,
        parsed.addressZip,
        parsed.latitude,
        parsed.longitude,
        parsed.phone,
        parsed.email,
        parsed.websiteUrl,
        parsed.websiteUrl, // Booking url fallback
        parsed.coverImageUrl,
        JSON.stringify(parsed.galleryUrls),
        parsed.hasPlungePool ? 1 : 0,
        parsed.hasOutdoorCooling ? 1 : 0,
        parsed.hasNaturalWater ? 1 : 0,
        0, // ice well
        1, // bucket shower default
        0, // experience showers
        parsed.hasCeremonialHall ? 1 : 0,
        parsed.hasWhirlpool ? 1 : 0,
        parsed.hasSteamBath ? 1 : 0,
        parsed.hasHerbalSauna ? 1 : 0,
        parsed.category === 'private' ? 1 : 0,
        4.2, // Default base initial rating
        4.3,
        4.2,
        parsed.hasPlungePool ? 4.5 : 4.0,
        4.0,
        4.3,
        3, // initial review count
        1, // favorite count
        0, // is_promoted
        null,
        1, // is_verified_partner (it's official MultiSport)
        'active'
      );

      // 3. Upsert MultiSport rule
      upsertMultisportStmt.run(
        parsed.id,
        parsed.multisportRule.isAccepted ? 1 : 0,
        parsed.multisportRule.benefitType,
        parsed.multisportRule.timeLimitMinutes,
        null, // discount amount
        null, // discount percentage
        parsed.multisportRule.entrySurchargeCzk,
        25, // overtime surcharge
        15, // overtime block minutes
        parsed.multisportRule.includedZones,
        1, // towel included
        'all_week',
        'Dle otevírací doby střediska',
        JSON.stringify(parsed.multisportRule.acceptedCardTypes),
        parsed.multisportRule.note
      );

      // 4. Link cooling options
      if (parsed.hasPlungePool) {
        upsertCoolingStmt.run(
          `${parsed.id}-pool`,
          parsed.id,
          'indoor_plunge_pool',
          9.0,
          'Ochlazovací bazének',
          1
        );
        withPlungePool++;
      }
      if (parsed.hasOutdoorCooling) {
        upsertCoolingStmt.run(
          `${parsed.id}-outdoor`,
          parsed.id,
          'outdoor_plunge_pool',
          7.5,
          'Venkovní ochlazení',
          0
        );
      }

      // 5. Link sauna type
      upsertSaunaTypeStmt.run(
        `${parsed.id}-finnish`,
        parsed.id,
        'finnish_dry',
        'Finská sauna',
        85,
        95,
        10,
        15,
        12,
        'Klasická finská sauna s dřevěným obložením.'
      );

      if (parsed.hasSteamBath) {
        upsertSaunaTypeStmt.run(
          `${parsed.id}-steam`,
          parsed.id,
          'steam_bath',
          'Parní lázeň',
          42,
          48,
          95,
          100,
          8,
          'Parní lázeň s vysokou vlhkostí.'
        );
      }

      importedCount++;
      regionsBreakdown[parsed.regionId] = (regionsBreakdown[parsed.regionId] || 0) + 1;
      benefitTypeBreakdown[parsed.multisportRule.benefitType] =
        (benefitTypeBreakdown[parsed.multisportRule.benefitType] || 0) + 1;
    }

    db.exec('COMMIT');

    if (verbose) {
      console.log('\n======================================================');
      console.log('✅ MULTISPORT SAUNAS IMPORT COMPLETED SUCCESSFULLY');
      console.log('======================================================');
      console.log(`Celkem načteno a uloženo saun: ${importedCount}`);
      console.log(`Saun s ochlazovacím bazénkem: ${withPlungePool}`);
      console.log('\nRozdělení podle MultiSport benefitu:');
      for (const [type, count] of Object.entries(benefitTypeBreakdown)) {
        console.log(`  - ${type}: ${count}`);
      }
      console.log('\nRozdělení podle krajů ČR:');
      for (const [region, count] of Object.entries(regionsBreakdown)) {
        console.log(`  - ${region}: ${count}`);
      }
      console.log('======================================================\n');
    }

    return {
      totalFetched: rawDetails.length,
      totalImported: importedCount,
      regionsBreakdown,
      benefitTypeBreakdown,
      withPlungePool,
    };
  } catch (err: any) {
    db.exec('ROLLBACK');
    console.error('[MultiSport Import] Error during transaction, rolled back:', err);
    throw err;
  }
}

// Auto-run if invoked directly via CLI
if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  importMultisportSaunas()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
