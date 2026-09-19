import { DatabaseSync } from 'node:sqlite';
import { getDb, haversineDistanceKm } from '../db/connection.js';
import type {
  SaunaVenue,
  SaunaSummary,
  SaunaDetail,
  SaunaFilterParams,
  MapMarker,
  VenueMultisportRule,
  VenueOperatingPolicy,
  VenueCoolingOption,
  VenueSauna,
  VenueAmenity,
  VenueOpeningHours,
  VenuePricing,
  Review,
  SaunaCeremony,
  VenueCategoryCode,
  MultisportBenefitTypeCode,
  MultisportValidDaysCode,
  OperatingAccessTypeCode,
  NudityPolicyCode,
  CeremonyCategoryCode,
} from '@shared';

export class SaunaRepository {
  private db: DatabaseSync;

  constructor(customDb?: DatabaseSync) {
    this.db = customDb || getDb();
  }

  findById(id: string, userLat?: number, userLon?: number): SaunaDetail | null {
    const venueRow = this.db
      .prepare('SELECT * FROM sauna_venues WHERE id = ?')
      .get(id) as Record<string, any> | undefined;

    if (!venueRow) return null;
    return this.buildSaunaDetail(venueRow, userLat, userLon);
  }

  findBySlug(slug: string, userLat?: number, userLon?: number): SaunaDetail | null {
    const venueRow = this.db
      .prepare('SELECT * FROM sauna_venues WHERE slug = ?')
      .get(slug) as Record<string, any> | undefined;

    if (!venueRow) return null;
    return this.buildSaunaDetail(venueRow, userLat, userLon);
  }

  findSummaries(params: SaunaFilterParams = {}): { venues: SaunaSummary[]; total: number } {
    const { conditions, bindings } = this.buildFilterClauses(params);

    // Count query
    const countSql = `
      SELECT COUNT(DISTINCT sv.id) AS total
      FROM sauna_venues sv
      LEFT JOIN venue_multisport_rules vmr ON sv.id = vmr.venue_id
      LEFT JOIN venue_operating_policies vop ON sv.id = vop.venue_id
      WHERE sv.status = 'active' ${conditions}
    `;

    const countRow = this.db.prepare(countSql).get(...bindings) as { total: number };
    const total = Number(countRow?.total) || 0;

    if (total === 0) {
      return { venues: [], total: 0 };
    }

    // Determine sorting
    let orderByClause = 'sv.is_promoted DESC, sv.rating_overall DESC, sv.review_count DESC';
    const sort = params.sort || 'recommended';

    if (sort === 'rating') {
      orderByClause = 'sv.rating_overall DESC, sv.review_count DESC';
    } else if (sort === 'reviews') {
      orderByClause = 'sv.review_count DESC, sv.rating_overall DESC';
    } else if (sort === 'name') {
      orderByClause = 'sv.name ASC';
    } else if (sort === 'distance' && params.lat != null && params.lon != null) {
      orderByClause = `haversine_km(${params.lat}, ${params.lon}, sv.latitude, sv.longitude) ASC`;
    }

    const limit = Math.max(1, Math.min(params.limit || 20, 100));
    const offset = Math.max(0, params.offset || 0);

    const selectSql = `
      SELECT DISTINCT
        sv.id,
        sv.name,
        sv.slug,
        sv.category,
        sv.short_description,
        sv.cover_image_url,
        sv.address_street,
        sv.address_city,
        sv.address_zip,
        sv.latitude,
        sv.longitude,
        sv.region_id,
        sv.city_id,
        sv.has_plunge_pool,
        sv.has_outdoor_cooling,
        sv.has_natural_water,
        sv.has_ceremonial_hall,
        sv.has_whirlpool,
        sv.rating_overall,
        sv.review_count,
        sv.favorite_count,
        sv.is_promoted,
        sv.promoted_badge,
        vmr.is_accepted AS ms_is_accepted,
        vmr.benefit_type AS ms_benefit_type,
        vmr.time_limit_minutes AS ms_time_limit_minutes,
        vmr.discount_amount_czk AS ms_discount_amount_czk,
        vmr.entry_surcharge_czk AS ms_entry_surcharge_czk
      FROM sauna_venues sv
      LEFT JOIN venue_multisport_rules vmr ON sv.id = vmr.venue_id
      LEFT JOIN venue_operating_policies vop ON sv.id = vop.venue_id
      WHERE sv.status = 'active' ${conditions}
      ORDER BY ${orderByClause}
      LIMIT ? OFFSET ?
    `;

    const queryBindings = [...bindings, limit, offset];
    const rows = this.db.prepare(selectSql).all(...queryBindings) as Array<Record<string, any>>;

    const venues: SaunaSummary[] = rows.map((r) => {
      let distance_km: number | undefined;
      if (params.lat != null && params.lon != null) {
        const dist = haversineDistanceKm(params.lat, params.lon, r.latitude, r.longitude);
        if (dist != null) distance_km = dist;
      }

      return {
        id: r.id,
        name: r.name,
        slug: r.slug,
        category: r.category as VenueCategoryCode,
        short_description: r.short_description,
        cover_image_url: r.cover_image_url,
        address_street: r.address_street,
        address_city: r.address_city,
        address_zip: r.address_zip,
        latitude: Number(r.latitude),
        longitude: Number(r.longitude),
        region_id: r.region_id,
        city_id: r.city_id,
        has_plunge_pool: Boolean(r.has_plunge_pool),
        has_outdoor_cooling: Boolean(r.has_outdoor_cooling),
        has_natural_water: Boolean(r.has_natural_water),
        has_ceremonial_hall: Boolean(r.has_ceremonial_hall),
        has_whirlpool: Boolean(r.has_whirlpool),
        rating_overall: Number(r.rating_overall || 0),
        review_count: Number(r.review_count || 0),
        favorite_count: Number(r.favorite_count || 0),
        is_promoted: Boolean(r.is_promoted),
        promoted_badge: r.promoted_badge,
        distance_km,
        multisport: r.ms_is_accepted
          ? {
              is_accepted: Boolean(r.ms_is_accepted),
              benefit_type: r.ms_benefit_type as MultisportBenefitTypeCode,
              time_limit_minutes: r.ms_time_limit_minutes,
              discount_amount_czk: r.ms_discount_amount_czk,
              entry_surcharge_czk: r.ms_entry_surcharge_czk,
            }
          : undefined,
      };
    });

    return { venues, total };
  }

  findNearby(lat: number, lon: number, limit = 3, excludeId?: string): SaunaSummary[] {
    let sql = `
      SELECT
        sv.id,
        sv.name,
        sv.slug,
        sv.category,
        sv.short_description,
        sv.cover_image_url,
        sv.address_street,
        sv.address_city,
        sv.address_zip,
        sv.latitude,
        sv.longitude,
        sv.region_id,
        sv.city_id,
        sv.has_plunge_pool,
        sv.has_outdoor_cooling,
        sv.has_natural_water,
        sv.has_ceremonial_hall,
        sv.has_whirlpool,
        sv.rating_overall,
        sv.review_count,
        sv.favorite_count,
        sv.is_promoted,
        sv.promoted_badge,
        vmr.is_accepted AS ms_is_accepted,
        vmr.benefit_type AS ms_benefit_type,
        vmr.time_limit_minutes AS ms_time_limit_minutes,
        vmr.discount_amount_czk AS ms_discount_amount_czk,
        vmr.entry_surcharge_czk AS ms_entry_surcharge_czk,
        haversine_km(?, ?, sv.latitude, sv.longitude) AS distance_km
      FROM sauna_venues sv
      LEFT JOIN venue_multisport_rules vmr ON sv.id = vmr.venue_id
      WHERE sv.status = 'active'
    `;

    const bindings: any[] = [lat, lon];
    if (excludeId) {
      sql += ' AND sv.id != ?';
      bindings.push(excludeId);
    }

    sql += ' ORDER BY distance_km ASC LIMIT ?';
    bindings.push(limit);

    const rows = this.db.prepare(sql).all(...bindings) as Array<Record<string, any>>;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category as VenueCategoryCode,
      short_description: r.short_description,
      cover_image_url: r.cover_image_url,
      address_street: r.address_street,
      address_city: r.address_city,
      address_zip: r.address_zip,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      region_id: r.region_id,
      city_id: r.city_id,
      has_plunge_pool: Boolean(r.has_plunge_pool),
      has_outdoor_cooling: Boolean(r.has_outdoor_cooling),
      has_natural_water: Boolean(r.has_natural_water),
      has_ceremonial_hall: Boolean(r.has_ceremonial_hall),
      has_whirlpool: Boolean(r.has_whirlpool),
      rating_overall: Number(r.rating_overall || 0),
      review_count: Number(r.review_count || 0),
      favorite_count: Number(r.favorite_count || 0),
      is_promoted: Boolean(r.is_promoted),
      promoted_badge: r.promoted_badge,
      distance_km: r.distance_km != null ? Math.round(Number(r.distance_km) * 10) / 10 : undefined,
      multisport: r.ms_is_accepted
        ? {
            is_accepted: Boolean(r.ms_is_accepted),
            benefit_type: r.ms_benefit_type as MultisportBenefitTypeCode,
            time_limit_minutes: r.ms_time_limit_minutes,
            discount_amount_czk: r.ms_discount_amount_czk,
            entry_surcharge_czk: r.ms_entry_surcharge_czk,
          }
        : undefined,
    }));
  }

  getMapMarkers(params: SaunaFilterParams = {}): MapMarker[] {
    const { conditions, bindings } = this.buildFilterClauses(params);

    const sql = `
      SELECT DISTINCT
        sv.id,
        sv.name,
        sv.slug,
        sv.category,
        sv.latitude,
        sv.longitude,
        sv.rating_overall,
        sv.review_count,
        sv.is_promoted,
        sv.promoted_badge,
        sv.address_city,
        vmr.benefit_type AS ms_benefit_type,
        vmr.is_accepted AS ms_is_accepted
      FROM sauna_venues sv
      LEFT JOIN venue_multisport_rules vmr ON sv.id = vmr.venue_id
      LEFT JOIN venue_operating_policies vop ON sv.id = vop.venue_id
      WHERE sv.status = 'active' ${conditions}
      ORDER BY sv.is_promoted DESC, sv.rating_overall DESC
    `;

    const rows = this.db.prepare(sql).all(...bindings) as Array<Record<string, any>>;

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      category: r.category as VenueCategoryCode,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      rating_overall: Number(r.rating_overall || 0),
      review_count: Number(r.review_count || 0),
      is_promoted: Boolean(r.is_promoted),
      promoted_badge: r.promoted_badge,
      address_city: r.address_city,
      multisport_benefit: r.ms_is_accepted ? (r.ms_benefit_type as MultisportBenefitTypeCode) : undefined,
    }));
  }

  create(venue: Partial<SaunaVenue>): SaunaVenue {
    const id = venue.id || `venue_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO sauna_venues (
        id, city_id, region_id, country_id, name, slug, category,
        short_description, description, address_street, address_city, address_zip,
        latitude, longitude, phone, email, website_url, booking_url,
        cover_image_url, gallery_urls,
        has_plunge_pool, has_outdoor_cooling, has_natural_water, has_ice_well,
        has_bucket_shower, has_experience_showers, has_ceremonial_hall,
        has_whirlpool, has_steam_bath, has_herbal_sauna, has_private_rental,
        rating_overall, rating_cleanliness, rating_heat_steam, rating_cooling,
        rating_staff_ceremonies, rating_value, review_count, favorite_count,
        is_promoted, promoted_badge, promoted_tier, is_verified_partner, status,
        created_at, updated_at
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
        ?, ?, ?, ?, ?,
        ?, ?
      )
    `);

    stmt.run(
      id,
      venue.city_id || '',
      venue.region_id || '',
      venue.country_id || 'CZ',
      venue.name || '',
      venue.slug || '',
      venue.category || 'public',
      venue.short_description || '',
      venue.description || '',
      venue.address_street || '',
      venue.address_city || '',
      venue.address_zip || '',
      venue.latitude || 0,
      venue.longitude || 0,
      venue.phone ?? null,
      venue.email ?? null,
      venue.website_url ?? null,
      venue.booking_url ?? null,
      venue.cover_image_url || '',
      venue.gallery_urls ? JSON.stringify(venue.gallery_urls) : '[]',
      venue.has_plunge_pool ? 1 : 0,
      venue.has_outdoor_cooling ? 1 : 0,
      venue.has_natural_water ? 1 : 0,
      venue.has_ice_well ? 1 : 0,
      venue.has_bucket_shower ? 1 : 0,
      venue.has_experience_showers ? 1 : 0,
      venue.has_ceremonial_hall ? 1 : 0,
      venue.has_whirlpool ? 1 : 0,
      venue.has_steam_bath ? 1 : 0,
      venue.has_herbal_sauna ? 1 : 0,
      venue.has_private_rental ? 1 : 0,
      venue.rating_overall || 0,
      venue.rating_cleanliness || 0,
      venue.rating_heat_steam || 0,
      venue.rating_cooling || 0,
      venue.rating_staff_ceremonies || 0,
      venue.rating_value || 0,
      venue.review_count || 0,
      venue.favorite_count || 0,
      venue.is_promoted ? 1 : 0,
      venue.promoted_badge ?? null,
      venue.promoted_tier ?? null,
      venue.is_verified_partner ? 1 : 0,
      venue.status || 'active',
      now,
      now
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to load venue after creation: ${id}`);
    }
    return created;
  }

  update(id: string, venue: Partial<SaunaVenue>): SaunaVenue | null {
    const existing = this.findById(id);
    if (!existing) return null;

    const updates: string[] = [];
    const values: any[] = [];

    const allowedFields: Array<keyof SaunaVenue> = [
      'name', 'slug', 'category', 'short_description', 'description',
      'address_street', 'address_city', 'address_zip', 'latitude', 'longitude',
      'phone', 'email', 'website_url', 'booking_url', 'cover_image_url',
      'has_plunge_pool', 'has_outdoor_cooling', 'has_natural_water', 'has_ice_well',
      'has_bucket_shower', 'has_experience_showers', 'has_ceremonial_hall',
      'has_whirlpool', 'has_steam_bath', 'has_herbal_sauna', 'has_private_rental',
      'is_promoted', 'promoted_badge', 'promoted_tier', 'status', 'is_verified_partner'
    ];

    for (const field of allowedFields) {
      if (venue[field] !== undefined) {
        updates.push(`${field} = ?`);
        const val = venue[field];
        if (typeof val === 'boolean') {
          values.push(val ? 1 : 0);
        } else {
          values.push(val ?? null);
        }
      }
    }

    if (venue.gallery_urls !== undefined) {
      updates.push('gallery_urls = ?');
      values.push(JSON.stringify(venue.gallery_urls));
    }

    if (updates.length === 0) return existing;

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE sauna_venues SET ${updates.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);

    return this.findById(id);
  }

  updateAggregateRatings(venueId: string): void {
    this.db.exec(`
      UPDATE sauna_venues
      SET
        rating_overall = ROUND((SELECT AVG(rating_overall) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published'), 2),
        rating_cleanliness = ROUND((SELECT AVG(rating_cleanliness) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published'), 2),
        rating_heat_steam = ROUND((SELECT AVG(rating_heat_steam) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published'), 2),
        rating_cooling = ROUND((SELECT AVG(rating_cooling) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published'), 2),
        rating_staff_ceremonies = ROUND((SELECT AVG(rating_staff_ceremonies) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published'), 2),
        rating_value = ROUND((SELECT AVG(rating_value) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published'), 2),
        review_count = (SELECT COUNT(*) FROM reviews WHERE venue_id = '${venueId}' AND status = 'published')
      WHERE id = '${venueId}';
    `);
  }

  private buildFilterClauses(params: SaunaFilterParams): { conditions: string; bindings: any[] } {
    let conditions = '';
    const bindings: any[] = [];

    // Text search (name, description, address, city)
    if (params.q && params.q.trim()) {
      const term = `%${params.q.trim().toLowerCase()}%`;
      conditions += ' AND (LOWER(sv.name) LIKE ? OR LOWER(sv.description) LIKE ? OR LOWER(sv.address_city) LIKE ? OR LOWER(sv.address_street) LIKE ?)';
      bindings.push(term, term, term, term);
    }

    // Category
    if (params.category) {
      conditions += ' AND sv.category = ?';
      bindings.push(params.category);
    }

    // Region
    if (params.region_id) {
      conditions += ' AND sv.region_id = ?';
      bindings.push(params.region_id);
    }

    // City
    if (params.city_id) {
      conditions += ' AND sv.city_id = ?';
      bindings.push(params.city_id);
    }

    // MultiSport benefit type
    if (params.benefit_type) {
      conditions += ' AND vmr.is_accepted = 1 AND vmr.benefit_type = ?';
      bindings.push(params.benefit_type);
    }

    // MultiSport minimum time limit
    if (params.min_time_limit) {
      conditions += ' AND vmr.is_accepted = 1 AND (vmr.time_limit_minutes IS NULL OR vmr.time_limit_minutes >= ?)';
      bindings.push(params.min_time_limit);
    }

    // Cooling option filter
    if (params.cooling) {
      const c = params.cooling;
      if (c === 'indoor_plunge_pool' || c === 'plunge_pool') {
        conditions += ' AND (sv.has_plunge_pool = 1 OR EXISTS (SELECT 1 FROM venue_cooling_options vco WHERE vco.venue_id = sv.id AND vco.cooling_option_id IN (?, ?)))';
        bindings.push('indoor_plunge_pool', 'outdoor_plunge_pool');
      } else if (c === 'natural_water' || c === 'natural_water_river' || c === 'natural_water_lake') {
        conditions += ' AND (sv.has_natural_water = 1 OR EXISTS (SELECT 1 FROM venue_cooling_options vco WHERE vco.venue_id = sv.id AND vco.cooling_option_id IN (?, ?)))';
        bindings.push('natural_water_river', 'natural_water_lake');
      } else if (c === 'outdoor_cooling') {
        conditions += ' AND sv.has_outdoor_cooling = 1';
      } else if (c === 'ice_well') {
        conditions += ' AND sv.has_ice_well = 1';
      } else if (c === 'bucket_shower') {
        conditions += ' AND sv.has_bucket_shower = 1';
      } else if (c === 'experience_showers') {
        conditions += ' AND sv.has_experience_showers = 1';
      } else {
        conditions += ' AND EXISTS (SELECT 1 FROM venue_cooling_options vco WHERE vco.venue_id = sv.id AND vco.cooling_option_id = ?)';
        bindings.push(c);
      }
    }

    // Sauna type filter
    if (params.sauna_type) {
      const st = params.sauna_type;
      if (st === 'ceremonial_hall') {
        conditions += ' AND (sv.has_ceremonial_hall = 1 OR EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = sv.id AND vs.sauna_type_id = ?))';
        bindings.push('ceremonial_hall');
      } else if (st === 'steam_bath') {
        conditions += ' AND (sv.has_steam_bath = 1 OR EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = sv.id AND vs.sauna_type_id = ?))';
        bindings.push('steam_bath');
      } else if (st === 'bio_herbal') {
        conditions += ' AND (sv.has_herbal_sauna = 1 OR EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = sv.id AND vs.sauna_type_id = ?))';
        bindings.push('bio_herbal');
      } else {
        conditions += ' AND EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = sv.id AND vs.sauna_type_id = ?)';
        bindings.push(st);
      }
    }

    // Nudity policy filter
    if (params.nudity_policy) {
      conditions += ' AND vop.nudity_policy = ?';
      bindings.push(params.nudity_policy);
    }

    // Geolocation radius bounding
    if (params.lat != null && params.lon != null && params.radius_km != null) {
      conditions += ' AND haversine_km(?, ?, sv.latitude, sv.longitude) <= ?';
      bindings.push(params.lat, params.lon, params.radius_km);
    }

    return { conditions, bindings };
  }

  private buildSaunaDetail(r: Record<string, any>, userLat?: number, userLon?: number): SaunaDetail {
    const venueId = r.id;

    // MultiSport rule
    const msRow = this.db
      .prepare('SELECT * FROM venue_multisport_rules WHERE venue_id = ?')
      .get(venueId) as Record<string, any> | undefined;

    let multisport: VenueMultisportRule | null = null;
    if (msRow) {
      multisport = {
        venue_id: msRow.venue_id,
        is_accepted: Boolean(msRow.is_accepted),
        benefit_type: msRow.benefit_type as MultisportBenefitTypeCode,
        time_limit_minutes: msRow.time_limit_minutes,
        discount_amount_czk: msRow.discount_amount_czk,
        discount_percentage: msRow.discount_percentage,
        entry_surcharge_czk: msRow.entry_surcharge_czk,
        overtime_surcharge_per_block_czk: msRow.overtime_surcharge_per_block_czk,
        overtime_block_minutes: msRow.overtime_block_minutes,
        included_zones: msRow.included_zones,
        towel_sheet_service_included: Boolean(msRow.towel_sheet_service_included),
        valid_days: msRow.valid_days as MultisportValidDaysCode,
        valid_hours_description: msRow.valid_hours_description,
        accepted_card_types: msRow.accepted_card_types
          ? (typeof msRow.accepted_card_types === 'string' ? JSON.parse(msRow.accepted_card_types) : msRow.accepted_card_types)
          : [],
        note: msRow.note,
        last_verified_at: msRow.last_verified_at,
      };
    }

    // Operating policies
    const polRow = this.db
      .prepare('SELECT * FROM venue_operating_policies WHERE venue_id = ?')
      .get(venueId) as Record<string, any> | undefined;

    let policies: VenueOperatingPolicy | null = null;
    if (polRow) {
      policies = {
        venue_id: polRow.venue_id,
        access_type: polRow.access_type as OperatingAccessTypeCode,
        nudity_policy: polRow.nudity_policy as NudityPolicyCode,
        women_only_policy: polRow.women_only_policy,
        women_only_schedule_note: polRow.women_only_schedule_note,
        men_only_schedule_note: polRow.men_only_schedule_note,
        children_policy: polRow.children_policy,
        children_min_age: polRow.children_min_age,
        barrier_free_access: polRow.barrier_free_access,
        parking_policy: polRow.parking_policy,
        parking_notes: polRow.parking_notes,
        refreshment_type: polRow.refreshment_type,
        towels_and_sheets: polRow.towels_and_sheets,
      };
    }

    // Cooling options
    const coolingRows = this.db.prepare(`
      SELECT vco.*, co.name_cz, co.name_en, co.category, co.icon_name, co.description AS co_description
      FROM venue_cooling_options vco
      JOIN cooling_options co ON vco.cooling_option_id = co.id
      WHERE vco.venue_id = ?
      ORDER BY vco.is_featured DESC
    `).all(venueId) as Array<Record<string, any>>;

    const cooling_options: VenueCoolingOption[] = coolingRows.map((c) => ({
      id: c.id,
      venue_id: c.venue_id,
      cooling_option_id: c.cooling_option_id,
      water_temperature_celsius: c.water_temperature_celsius != null ? Number(c.water_temperature_celsius) : null,
      description: c.description,
      is_featured: Boolean(c.is_featured),
      cooling_option: {
        id: c.cooling_option_id,
        name_cz: c.name_cz,
        name_en: c.name_en,
        category: c.category,
        icon_name: c.icon_name,
        description: c.co_description,
      },
    }));

    // Saunas
    const saunaRows = this.db.prepare(`
      SELECT vs.*, st.name_cz, st.name_en, st.default_temp_celsius, st.default_humidity_percentage, st.icon_name, st.description AS st_description
      FROM venue_saunas vs
      JOIN sauna_types st ON vs.sauna_type_id = st.id
      WHERE vs.venue_id = ?
    `).all(venueId) as Array<Record<string, any>>;

    const saunas: VenueSauna[] = saunaRows.map((s) => ({
      id: s.id,
      venue_id: s.venue_id,
      sauna_type_id: s.sauna_type_id,
      custom_name: s.custom_name,
      temperature_celsius_min: Number(s.temperature_celsius_min),
      temperature_celsius_max: Number(s.temperature_celsius_max),
      humidity_percentage_min: Number(s.humidity_percentage_min),
      humidity_percentage_max: Number(s.humidity_percentage_max),
      capacity_persons: s.capacity_persons != null ? Number(s.capacity_persons) : null,
      wood_type: s.wood_type,
      stove_type: s.stove_type,
      features: s.features ? (typeof s.features === 'string' ? JSON.parse(s.features) : s.features) : null,
      description: s.description,
      photo_url: s.photo_url,
      sauna_type: {
        id: s.sauna_type_id,
        name_cz: s.name_cz,
        name_en: s.name_en,
        default_temp_celsius: Number(s.default_temp_celsius),
        default_humidity_percentage: Number(s.default_humidity_percentage),
        icon_name: s.icon_name,
        description: s.st_description,
      },
    }));

    // Amenities
    const amenityRows = this.db.prepare(`
      SELECT va.*, af.name_cz, af.name_en, af.icon_name, af.description AS af_description
      FROM venue_amenities va
      JOIN amenity_facilities af ON va.amenity_id = af.id
      WHERE va.venue_id = ?
    `).all(venueId) as Array<Record<string, any>>;

    const amenities: VenueAmenity[] = amenityRows.map((a) => ({
      id: a.id,
      venue_id: a.venue_id,
      amenity_id: a.amenity_id,
      quantity: Number(a.quantity || 1),
      description: a.description,
      amenity: {
        id: a.amenity_id,
        name_cz: a.name_cz,
        name_en: a.name_en,
        icon_name: a.icon_name,
        description: a.af_description,
      },
    }));

    // Opening hours
    const hoursRows = this.db.prepare(`
      SELECT * FROM venue_opening_hours WHERE venue_id = ? ORDER BY day_of_week ASC
    `).all(venueId) as Array<Record<string, any>>;

    const opening_hours: VenueOpeningHours[] = hoursRows.map((h) => ({
      id: h.id,
      venue_id: h.venue_id,
      day_of_week: Number(h.day_of_week),
      open_time: h.open_time,
      close_time: h.close_time,
      is_closed: Boolean(h.is_closed),
      special_note: h.special_note,
    }));

    // Pricing
    const pricingRows = this.db.prepare(`
      SELECT * FROM venue_pricing WHERE venue_id = ? ORDER BY is_default DESC, price_czk ASC
    `).all(venueId) as Array<Record<string, any>>;

    const pricing: VenuePricing[] = pricingRows.map((p) => ({
      id: p.id,
      venue_id: p.venue_id,
      ticket_name: p.ticket_name,
      duration_minutes: p.duration_minutes != null ? Number(p.duration_minutes) : null,
      price_czk: Number(p.price_czk),
      price_student_czk: p.price_student_czk != null ? Number(p.price_student_czk) : null,
      price_senior_czk: p.price_senior_czk != null ? Number(p.price_senior_czk) : null,
      is_default: Boolean(p.is_default),
      note: p.note,
    }));

    // Reviews
    const reviewRows = this.db.prepare(`
      SELECT r.*, u.display_name, u.avatar_url, u.role, u.bio, u.reviews_count, u.helpful_votes_received
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.venue_id = ? AND r.status = 'published'
      ORDER BY r.helpful_votes_count DESC, r.created_at DESC
    `).all(venueId) as Array<Record<string, any>>;

    const reviews: Review[] = reviewRows.map((rev) => ({
      id: rev.id,
      venue_id: rev.venue_id,
      user_id: rev.user_id,
      rating_overall: Number(rev.rating_overall),
      rating_cleanliness: Number(rev.rating_cleanliness),
      rating_heat_steam: Number(rev.rating_heat_steam),
      rating_cooling: Number(rev.rating_cooling),
      rating_staff_ceremonies: Number(rev.rating_staff_ceremonies),
      rating_value: Number(rev.rating_value),
      title: rev.title,
      content: rev.content,
      tips: rev.tips,
      recommended_time: rev.recommended_time,
      visit_date: rev.visit_date,
      is_verified_visit: Boolean(rev.is_verified_visit),
      helpful_votes_count: Number(rev.helpful_votes_count || 0),
      status: rev.status,
      created_at: rev.created_at,
      updated_at: rev.updated_at,
      user: {
        id: rev.user_id,
        display_name: rev.display_name,
        avatar_url: rev.avatar_url,
        role: rev.role,
        bio: rev.bio,
        is_email_verified: true,
        reviews_count: Number(rev.reviews_count || 0),
        helpful_votes_received: Number(rev.helpful_votes_received || 0),
      },
    }));

    // Ceremonies
    const ceremonyRows = this.db.prepare(`
      SELECT * FROM sauna_ceremonies WHERE venue_id = ? ORDER BY day_of_week ASC, start_time ASC
    `).all(venueId) as Array<Record<string, any>>;

    const ceremonies: SaunaCeremony[] = ceremonyRows.map((c) => ({
      id: c.id,
      venue_id: c.venue_id,
      title: c.title,
      category: c.category as CeremonyCategoryCode,
      description: c.description,
      ceremony_master: c.ceremony_master,
      hall_name: c.hall_name,
      day_of_week: c.day_of_week,
      is_recurring: Boolean(c.is_recurring),
      recurrence_pattern: c.recurrence_pattern,
      start_time: c.start_time,
      end_time: c.end_time,
      event_date: c.event_date,
      special_entry_fee_czk: Number(c.special_entry_fee_czk || 0),
      is_featured: Boolean(c.is_featured),
      created_at: c.created_at,
    }));

    let distance_km: number | undefined;
    if (userLat != null && userLon != null) {
      const dist = haversineDistanceKm(userLat, userLon, r.latitude, r.longitude);
      if (dist != null) distance_km = dist;
    }

    let gallery_urls: string[] = [];
    try {
      gallery_urls = r.gallery_urls ? (typeof r.gallery_urls === 'string' ? JSON.parse(r.gallery_urls) : r.gallery_urls) : [];
    } catch {
      gallery_urls = [];
    }

    return {
      id: r.id,
      city_id: r.city_id,
      region_id: r.region_id,
      country_id: r.country_id,
      name: r.name,
      slug: r.slug,
      category: r.category as VenueCategoryCode,
      short_description: r.short_description,
      description: r.description,
      address_street: r.address_street,
      address_city: r.address_city,
      address_zip: r.address_zip,
      latitude: Number(r.latitude),
      longitude: Number(r.longitude),
      phone: r.phone,
      email: r.email,
      website_url: r.website_url,
      booking_url: r.booking_url,
      cover_image_url: r.cover_image_url,
      gallery_urls,
      has_plunge_pool: Boolean(r.has_plunge_pool),
      has_outdoor_cooling: Boolean(r.has_outdoor_cooling),
      has_natural_water: Boolean(r.has_natural_water),
      has_ice_well: Boolean(r.has_ice_well),
      has_bucket_shower: Boolean(r.has_bucket_shower),
      has_experience_showers: Boolean(r.has_experience_showers),
      has_ceremonial_hall: Boolean(r.has_ceremonial_hall),
      has_whirlpool: Boolean(r.has_whirlpool),
      has_steam_bath: Boolean(r.has_steam_bath),
      has_herbal_sauna: Boolean(r.has_herbal_sauna),
      has_private_rental: Boolean(r.has_private_rental),
      rating_overall: Number(r.rating_overall || 0),
      rating_cleanliness: Number(r.rating_cleanliness || 0),
      rating_heat_steam: Number(r.rating_heat_steam || 0),
      rating_cooling: Number(r.rating_cooling || 0),
      rating_staff_ceremonies: Number(r.rating_staff_ceremonies || 0),
      rating_value: Number(r.rating_value || 0),
      review_count: Number(r.review_count || 0),
      favorite_count: Number(r.favorite_count || 0),
      is_promoted: Boolean(r.is_promoted),
      promoted_badge: r.promoted_badge,
      promoted_tier: r.promoted_tier,
      promoted_until: r.promoted_until,
      claimed_by_user_id: r.claimed_by_user_id,
      claimed_at: r.claimed_at,
      is_verified_partner: Boolean(r.is_verified_partner),
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      multisport,
      policies,
      cooling_options,
      saunas,
      amenities,
      opening_hours,
      pricing,
      reviews,
      ceremonies,
      distance_km,
    };
  }
}

export const saunaRepository = new SaunaRepository();
