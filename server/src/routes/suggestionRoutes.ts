import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';

export const suggestionRouter = Router();
export const adminSuggestionRouter = Router();

function resolveRegionAndCity(cityName?: string): { region_id: string; city_id: string } {
  if (!cityName) {
    return { region_id: 'cz-pha', city_id: 'praha' };
  }
  const lower = cityName.toLowerCase().trim();
  if (lower.includes('liberec')) return { region_id: 'cz-lbk', city_id: 'liberec' };
  if (lower.includes('brno')) return { region_id: 'cz-jhm', city_id: 'brno' };
  if (lower.includes('ostrava')) return { region_id: 'cz-msk', city_id: 'ostrava' };
  if (lower.includes('plzeň') || lower.includes('plzen')) return { region_id: 'cz-plk', city_id: 'plzen' };
  if (lower.includes('olomouc')) return { region_id: 'cz-olk', city_id: 'olomouc' };
  if (lower.includes('hradec')) return { region_id: 'cz-hkk', city_id: 'hradec-kralove' };
  if (lower.includes('české') || lower.includes('budejovice')) return { region_id: 'cz-jhc', city_id: 'ceske-budejovice' };
  if (lower.includes('krkono') || lower.includes('špindl') || lower.includes('pec')) return { region_id: 'cz-hkk', city_id: 'spindleruv-mlyn' };
  return { region_id: 'cz-pha', city_id: 'praha' };
}

/**
 * POST /api/suggestions
 * Submits a new community sauna proposal for moderation.
 */
suggestionRouter.post('/', (req: Request, res: Response) => {
  const {
    name,
    venue_name,
    category,
    city,
    address,
    street_address,
    multisport_status,
    cooling_options,
    notes,
    description,
    submitter_email,
    submitter_name,
  } = req.body;

  const vName = (venue_name || name || '').trim();
  const vAddress = (street_address || address || '').trim();
  const vEmail = (submitter_email || '').trim();

  if (!vName || !vAddress || !vEmail || !vEmail.includes('@')) {
    return res.status(400).json({ success: false, error: 'Chybí název, adresa nebo platný e-mail' });
  }

  const db = getDb();
  const id = `sug_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const vCity = (city || 'Praha').trim();
  const { region_id } = resolveRegionAndCity(vCity);
  const sName = submitter_name ? String(submitter_name).trim() : vEmail.split('@')[0] || 'Anonym';
  const vCategory = category ? String(category) : 'public';
  const vDesc = description || notes || null;
  const vCooling = Array.isArray(cooling_options) ? JSON.stringify(cooling_options) : cooling_options ? String(cooling_options) : null;

  db.prepare(`
    INSERT INTO venue_suggestions (
      id, submitter_name, submitter_email, venue_name, category, street_address,
      city, region_id, multisport_accepted, multisport_details, cooling_options,
      description, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `).run(
    id,
    sName,
    vEmail,
    vName,
    vCategory,
    vAddress,
    vCity,
    region_id,
    multisport_status ? 1 : 0,
    multisport_status ? String(multisport_status) : null,
    vCooling,
    vDesc ? String(vDesc) : null
  );

  return res.status(201).json({ success: true, suggestion_id: id });
});

/**
 * POST /api/suggestions/edit
 * Reports outdated information or corrections for an existing venue.
 */
suggestionRouter.post('/edit', (req: Request, res: Response) => {
  const { venue_id, report_type, details, submitter_email } = req.body;

  if (!venue_id || !details) {
    return res.status(400).json({ success: false, error: 'Chybí venue_id nebo detaily návrhu' });
  }

  const db = getDb();
  const id = `sug_edit_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  db.prepare(`
    INSERT INTO venue_edit_suggestions (
      id, venue_id, report_type, details, suggested_data, submitter_email, status, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, 'pending', CURRENT_TIMESTAMP)
  `).run(
    id,
    String(venue_id),
    report_type ? String(report_type) : 'other',
    String(details),
    String(details),
    submitter_email ? String(submitter_email) : null
  );

  return res.status(201).json({ success: true, suggestion_id: id });
});

/**
 * GET /api/admin/suggestions
 * Lists all submitted proposals for moderator review.
 */
adminSuggestionRouter.get('/', (_req: Request, res: Response) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT * FROM venue_suggestions ORDER BY created_at DESC
  `).all();
  return res.json({ success: true, data: rows });
});

/**
 * PATCH /api/admin/suggestions/:id/approve
 * Approves a community proposal and publishes it as an active venue in the database.
 */
adminSuggestionRouter.patch('/:id/approve', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const db = getDb();

  const sug = db.prepare(`SELECT * FROM venue_suggestions WHERE id = ?`).get(id) as any;
  if (!sug) {
    return res.status(404).json({ success: false, error: 'Návrh nenalezen' });
  }

  const baseSlug = String(sug.venue_name)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const newVenueId = `venue_${baseSlug || Date.now()}`;
  const slug = newVenueId;
  const { region_id, city_id } = resolveRegionAndCity(String(sug.city));

  db.exec('BEGIN TRANSACTION;');
  try {
    // 1. Insert new sauna venue first (to satisfy FK in venue_suggestions.created_venue_id)
    db.prepare(`
      INSERT INTO sauna_venues (
        id, city_id, region_id, country_id, name, slug, category,
        short_description, description, address_street, address_city, address_zip,
        latitude, longitude, cover_image_url, status
      ) VALUES (
        ?, ?, ?, 'CZ', ?, ?, ?,
        'Nová sauna z komunitního návrhu', 'Komunitou schválená sauna.',
        ?, ?, '46001', 50.7671, 15.0562,
        'https://images.unsplash.com/photo-1540555700478-4be289fbecef', 'active'
      )
    `).run(
      newVenueId,
      city_id,
      region_id,
      String(sug.venue_name),
      slug,
      String(sug.category || 'public'),
      String(sug.street_address),
      String(sug.city)
    );

    // 2. Default MultiSport rules
    db.prepare(`
      INSERT INTO venue_multisport_rules (venue_id, is_accepted, benefit_type, time_limit_minutes, included_zones, valid_days, valid_hours_description, accepted_card_types)
      VALUES (?, 1, 'free_time_limited', 90, 'Saunový svět a ochlazovací bazének', 'all_week', 'Po celou otevírací dobu', '["Multisport Benefit", "Multisport Student"]')
    `).run(newVenueId);

    // 3. Default operating policies
    db.prepare(`
      INSERT INTO venue_operating_policies (venue_id, access_type, nudity_policy)
      VALUES (?, 'public_walkin', 'strict_nudist')
    `).run(newVenueId);

    // 4. Update suggestion status and reference to created venue
    db.prepare(`UPDATE venue_suggestions SET status = 'approved', reviewed_at = CURRENT_TIMESTAMP, created_venue_id = ? WHERE id = ?`).run(newVenueId, id);

    db.exec('COMMIT;');
    return res.json({ success: true, venue_id: newVenueId });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * PATCH /api/admin/suggestions/:id/reject
 * Rejects a community proposal with optional moderator commentary.
 */
adminSuggestionRouter.patch('/:id/reject', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const { reason, comment } = req.body || {};
  const db = getDb();

  const sug = db.prepare(`SELECT * FROM venue_suggestions WHERE id = ?`).get(id) as any;
  if (!sug) {
    return res.status(404).json({ success: false, error: 'Návrh nenalezen' });
  }

  const modComment = reason ? String(reason) : comment ? String(comment) : null;

  db.prepare(`
    UPDATE venue_suggestions 
    SET status = 'rejected', moderator_comment = ?, reviewed_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(modComment, id);

  return res.json({ success: true });
});
