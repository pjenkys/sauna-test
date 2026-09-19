import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { haversineDistance, formatDistance } from '../utils/haversine.js';
import { suggestRelaxations } from '../utils/zeroStateRelaxer.js';

export const saunaRouter = Router();

/**
 * GET /api/saunas
 * Deep search and compound filtering endpoint.
 * Supports MultiSport conditions, cooling options, sauna types, nudity policies,
 * text search, geographic filtering, and zero-state relaxation suggestions.
 */
saunaRouter.get('/', (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      benefit_type,
      time_limit,
      cooling,
      sauna_type,
      nudity_policy,
      region_id,
      city_id,
      lat,
      lon,
      radius_km,
      sort,
      bounds_north,
      bounds_south,
      bounds_east,
      bounds_west,
      has_ceremonial_hall,
      limit,
      offset,
    } = req.query as Record<string, string>;

    const db = getDb();

    let sql = `
      SELECT 
        v.*,
        ms.is_accepted as ms_is_accepted,
        ms.benefit_type as ms_benefit_type,
        ms.time_limit_minutes as ms_time_limit,
        ms.discount_amount_czk as ms_discount_czk,
        ms.discount_percentage as ms_discount_percent,
        ms.entry_surcharge_czk as ms_surcharge_czk,
        p.nudity_policy as policy_nudity
      FROM sauna_venues v
      LEFT JOIN venue_multisport_rules ms ON v.id = ms.venue_id
      LEFT JOIN venue_operating_policies p ON v.id = p.venue_id
      WHERE v.status = 'active'
    `;
    const params: any[] = [];

    // Fulltext search on name, short_description or city
    if (q && q.trim()) {
      const term = `%${q.trim()}%`;
      sql += ` AND (v.name LIKE ? OR v.short_description LIKE ? OR v.address_city LIKE ?)`;
      params.push(term, term, term);
    }

    // Category filter
    if (category) {
      sql += ` AND v.category = ?`;
      params.push(category);
    }

    // MultiSport filter
    if (benefit_type) {
      if (benefit_type === 'not_accepted') {
        sql += ` AND (ms.is_accepted = 0 OR ms.benefit_type = 'not_accepted')`;
      } else {
        sql += ` AND ms.is_accepted = 1 AND ms.benefit_type = ?`;
        params.push(benefit_type);
      }
    }

    // MultiSport time limit
    if (time_limit) {
      sql += ` AND ms.time_limit_minutes >= ?`;
      params.push(Number(time_limit));
    }

    // Cooling options filter
    if (cooling) {
      if (cooling === 'plunge_pool') {
        sql += ` AND v.has_plunge_pool = 1`;
      } else if (cooling === 'natural_water') {
        sql += ` AND v.has_natural_water = 1`;
      } else if (cooling === 'ice_well') {
        sql += ` AND v.has_ice_well = 1`;
      } else if (cooling === 'bucket_shower') {
        sql += ` AND v.has_bucket_shower = 1`;
      } else if (cooling === 'experience_showers') {
        sql += ` AND v.has_experience_showers = 1`;
      } else {
        sql += ` AND EXISTS (SELECT 1 FROM venue_cooling_options vco WHERE vco.venue_id = v.id AND vco.cooling_option_id = ?)`;
        params.push(cooling);
      }
    }

    // Sauna types filter
    if (sauna_type) {
      if (sauna_type === 'steam_bath') {
        sql += ` AND (v.has_steam_bath = 1 OR EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = v.id AND vs.sauna_type_id = ?))`;
        params.push(sauna_type);
      } else if (sauna_type === 'bio_herbal') {
        sql += ` AND (v.has_herbal_sauna = 1 OR EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = v.id AND vs.sauna_type_id = ?))`;
        params.push(sauna_type);
      } else {
        sql += ` AND EXISTS (SELECT 1 FROM venue_saunas vs WHERE vs.venue_id = v.id AND vs.sauna_type_id = ?)`;
        params.push(sauna_type);
      }
    }

    // Ceremonial hall flag
    if (has_ceremonial_hall === 'true' || has_ceremonial_hall === '1') {
      sql += ` AND v.has_ceremonial_hall = 1`;
    }

    // Nudity policy
    if (nudity_policy) {
      sql += ` AND p.nudity_policy = ?`;
      params.push(nudity_policy);
    }

    // Region filter
    if (region_id) {
      sql += ` AND v.region_id = ?`;
      params.push(region_id);
    }

    // City filter
    if (city_id) {
      sql += ` AND v.city_id = ?`;
      params.push(city_id);
    }

    // Map viewport bounds
    if (bounds_north && bounds_south && bounds_east && bounds_west) {
      sql += ` AND v.latitude BETWEEN ? AND ? AND v.longitude BETWEEN ? AND ?`;
      params.push(Number(bounds_south), Number(bounds_north), Number(bounds_west), Number(bounds_east));
    }

    const stmt = db.prepare(sql);
    let rows = (stmt.all as any)(...params) as any[];

    // Calculate proximity distance if user coordinates provided
    if (lat && lon) {
      const uLat = Number(lat);
      const uLon = Number(lon);
      rows = rows.map((r) => {
        const dist = haversineDistance(uLat, uLon, Number(r.latitude), Number(r.longitude));
        return {
          ...r,
          distance_km: Math.round(dist * 10) / 10,
          distance_formatted: formatDistance(dist),
        };
      });

      // Filter by radius if requested
      if (radius_km) {
        const rMax = Number(radius_km);
        rows = rows.filter((r) => r.distance_km <= rMax);
      }

      // Proximity sort
      if (sort === 'distance') {
        rows.sort((a, b) => a.distance_km - b.distance_km);
      }
    }

    // Sorting
    if (sort === 'rating') {
      rows.sort((a, b) => b.rating_overall - a.rating_overall);
    } else if (sort === 'reviews') {
      rows.sort((a, b) => b.review_count - a.review_count);
    } else if (sort === 'name') {
      rows.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
    } else if (!sort || sort === 'recommended') {
      // Default: promoted first, then rating, then review count
      rows.sort((a, b) => {
        if (b.is_promoted !== a.is_promoted) {
          return (b.is_promoted ? 1 : 0) - (a.is_promoted ? 1 : 0);
        }
        if (b.rating_overall !== a.rating_overall) {
          return b.rating_overall - a.rating_overall;
        }
        return b.review_count - a.review_count;
      });
    }

    const totalCount = rows.length;

    // Pagination
    if (limit || offset) {
      const l = limit ? Math.max(1, Number(limit)) : 50;
      const o = offset ? Math.max(0, Number(offset)) : 0;
      rows = rows.slice(o, o + l);
    }

    // Enrich rows with standard multisport object
    const enrichedData = rows.map((r) => ({
      ...r,
      multisport: r.ms_is_accepted
        ? {
            is_accepted: Boolean(r.ms_is_accepted),
            benefit_type: r.ms_benefit_type,
            time_limit_minutes: r.ms_time_limit,
            discount_amount_czk: r.ms_discount_czk,
            discount_percentage: r.ms_discount_percent,
            entry_surcharge_czk: r.ms_surcharge_czk,
          }
        : undefined,
    }));

    const suggestedRelaxations = suggestRelaxations(req.query, totalCount);

    return res.json({
      success: true,
      data: enrichedData,
      meta: {
        count: totalCount,
        suggestedRelaxations: totalCount === 0 ? suggestedRelaxations : undefined,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/saunas/recommendations
 * Recommends 1–3 nearest top saunas based on user GPS coordinates.
 */
saunaRouter.get('/recommendations', (req: Request, res: Response) => {
  const { lat, lon, limit } = req.query;
  if (!lat || !lon) {
    return res.status(400).json({ success: false, error: 'Latitude and longitude required' });
  }

  const uLat = Number(lat);
  const uLon = Number(lon);
  if (isNaN(uLat) || isNaN(uLon)) {
    return res.status(400).json({ success: false, error: 'Neplatné souřadnice' });
  }

  const maxLimit = limit ? Math.max(1, Math.min(Number(limit), 10)) : 3;
  const db = getDb();

  const stmt = db.prepare(`
    SELECT 
      v.*,
      ms.is_accepted as ms_is_accepted,
      ms.benefit_type as ms_benefit_type,
      ms.time_limit_minutes as ms_time_limit,
      ms.discount_amount_czk as ms_discount_czk,
      ms.discount_percentage as ms_discount_percent,
      ms.entry_surcharge_czk as ms_surcharge_czk
    FROM sauna_venues v
    LEFT JOIN venue_multisport_rules ms ON v.id = ms.venue_id
    WHERE v.status = 'active'
  `);
  const all = stmt.all() as any[];

  const withDist = all.map((r) => {
    const dist = haversineDistance(uLat, uLon, Number(r.latitude), Number(r.longitude));
    return {
      ...r,
      distance_km: Math.round(dist * 10) / 10,
      distance_formatted: formatDistance(dist),
      multisport: r.ms_is_accepted
        ? {
            is_accepted: Boolean(r.ms_is_accepted),
            benefit_type: r.ms_benefit_type,
            time_limit_minutes: r.ms_time_limit,
            discount_amount_czk: r.ms_discount_czk,
            discount_percentage: r.ms_discount_percent,
            entry_surcharge_czk: r.ms_surcharge_czk,
          }
        : undefined,
    };
  });

  withDist.sort((a, b) => a.distance_km - b.distance_km);
  const top = withDist.slice(0, maxLimit);

  return res.json({ success: true, data: top });
});

/**
 * GET /api/saunas/map-markers
 * Returns lightweight map markers for all active venues.
 */
saunaRouter.get('/map-markers', (_req: Request, res: Response) => {
  const db = getDb();
  const stmt = db.prepare(`
    SELECT 
      v.id, v.name, v.slug, v.latitude, v.longitude, v.category,
      v.is_promoted, v.promoted_badge, v.rating_overall, v.review_count, v.address_city,
      ms.benefit_type as multisport_benefit, ms.is_accepted as ms_is_accepted
    FROM sauna_venues v
    LEFT JOIN venue_multisport_rules ms ON v.id = ms.venue_id
    WHERE v.status = 'active'
    ORDER BY v.is_promoted DESC, v.rating_overall DESC
  `);
  const markers = (stmt.all() as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    latitude: Number(r.latitude),
    longitude: Number(r.longitude),
    category: r.category,
    is_promoted: Boolean(r.is_promoted),
    promoted_badge: r.promoted_badge,
    rating_overall: Number(r.rating_overall || 0),
    review_count: Number(r.review_count || 0),
    address_city: r.address_city,
    multisport_benefit: r.ms_is_accepted ? r.multisport_benefit : undefined,
  }));

  return res.json({ success: true, data: markers });
});

/**
 * GET /api/saunas/:slug
 * Complete venue details with cooling, saunas, amenities, hours, prices, reviews, ceremonies.
 */
saunaRouter.get('/:slug', (req: Request, res: Response) => {
  const slug = String(req.params.slug);
  const db = getDb();

  const venue = db.prepare(`
    SELECT * FROM sauna_venues WHERE slug = ? OR id = ?
  `).get(slug, slug) as any;

  if (!venue) {
    return res.status(404).json({ success: false, error: 'Venue not found' });
  }

  const venueId = String(venue.id);

  // Load all child relations
  const ms = db.prepare(`SELECT * FROM venue_multisport_rules WHERE venue_id = ?`).get(venueId);
  const policy = db.prepare(`SELECT * FROM venue_operating_policies WHERE venue_id = ?`).get(venueId);

  const coolings = db.prepare(`
    SELECT vco.*, co.name_cz, co.name_en, co.icon_name
    FROM venue_cooling_options vco
    JOIN cooling_options co ON vco.cooling_option_id = co.id
    WHERE vco.venue_id = ?
  `).all(venueId);

  const saunas = db.prepare(`
    SELECT vs.*, st.name_cz, st.name_en
    FROM venue_saunas vs
    JOIN sauna_types st ON vs.sauna_type_id = st.id
    WHERE vs.venue_id = ?
  `).all(venueId);

  const amenities = db.prepare(`
    SELECT va.*, af.name_cz, af.name_en, af.icon_name
    FROM venue_amenities va
    JOIN amenity_facilities af ON va.amenity_id = af.id
    WHERE va.venue_id = ?
  `).all(venueId);

  const hours = db.prepare(`
    SELECT * FROM venue_opening_hours WHERE venue_id = ? ORDER BY day_of_week
  `).all(venueId);

  const pricing = db.prepare(`
    SELECT * FROM venue_pricing WHERE venue_id = ? ORDER BY price_czk
  `).all(venueId);

  const ceremonies = db.prepare(`
    SELECT * FROM sauna_ceremonies WHERE venue_id = ? ORDER BY start_time ASC
  `).all(venueId);

  const reviews = db.prepare(`
    SELECT r.*, u.display_name as user_name, u.avatar_url as user_avatar, u.role as user_role
    FROM reviews r
    JOIN users u ON r.user_id = u.id
    WHERE r.venue_id = ? AND r.status = 'published'
    ORDER BY r.helpful_votes_count DESC, r.created_at DESC
  `).all(venueId);

  return res.json({
    success: true,
    data: {
      ...venue,
      multisport: ms,
      policies: policy,
      cooling_options: coolings,
      saunas,
      amenities,
      opening_hours: hours,
      pricing,
      ceremonies,
      reviews,
    },
  });
});

/**
 * GET /api/saunas/multisport/summary
 * Returns overview statistics of MultiSport saunas in the database.
 */
saunaRouter.get('/multisport/summary', (req: Request, res: Response) => {
  try {
    const db = getDb();

    const totalSaunas = (db.prepare('SELECT COUNT(*) as cnt FROM sauna_venues').get() as any).cnt;
    const msAccepted = (db.prepare('SELECT COUNT(*) as cnt FROM venue_multisport_rules WHERE is_accepted = 1').get() as any).cnt;
    const withPool = (db.prepare('SELECT COUNT(*) as cnt FROM sauna_venues v JOIN venue_multisport_rules ms ON v.id = ms.venue_id WHERE ms.is_accepted = 1 AND v.has_plunge_pool = 1').get() as any).cnt;

    const benefitBreakdown = db.prepare(`
      SELECT benefit_type, COUNT(*) as count
      FROM venue_multisport_rules
      WHERE is_accepted = 1
      GROUP BY benefit_type
    `).all() as Array<{ benefit_type: string; count: number }>;

    const regionBreakdown = db.prepare(`
      SELECT r.name, r.short_name, v.region_id, COUNT(*) as count
      FROM sauna_venues v
      JOIN regions r ON v.region_id = r.id
      JOIN venue_multisport_rules ms ON v.id = ms.venue_id
      WHERE ms.is_accepted = 1
      GROUP BY v.region_id
      ORDER BY count DESC
    `).all();

    return res.json({
      success: true,
      data: {
        totalSaunas,
        msAcceptedSaunas: msAccepted,
        msWithPlungePool: withPool,
        benefitBreakdown,
        regionBreakdown,
      },
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

