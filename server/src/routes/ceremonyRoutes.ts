import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const ceremonyRouter = Router();

/**
 * GET /api/ceremonies
 * Retrieves scheduled sauna rituals, master towel shows, and themed nights.
 */
ceremonyRouter.get('/', (req: Request, res: Response) => {
  const { venue_id, category, day_of_week } = req.query;
  const db = getDb();

  let sql = `
    SELECT sc.*, sv.name as venue_name, sv.slug as venue_slug
    FROM sauna_ceremonies sc
    JOIN sauna_venues sv ON sc.venue_id = sv.id
    WHERE sv.status = 'active'
  `;
  const params: any[] = [];

  if (venue_id) {
    sql += ` AND sc.venue_id = ?`;
    params.push(venue_id);
  }
  if (category) {
    sql += ` AND sc.category = ?`;
    params.push(category);
  }
  if (day_of_week !== undefined) {
    sql += ` AND sc.day_of_week = ?`;
    params.push(Number(day_of_week));
  }

  sql += ` ORDER BY sc.is_featured DESC, sc.day_of_week ASC, sc.start_time ASC`;

  const ceremonies = db.prepare(sql).all(...params);
  return res.json({ success: true, data: ceremonies });
});

/**
 * POST /api/ceremonies
 * Adds a new ceremonial event to a sauna venue calendar.
 */
ceremonyRouter.post('/', requireAuth, (req: Request, res: Response) => {
  const {
    venue_id,
    title,
    category,
    description,
    ceremony_master,
    hall_name,
    day_of_week,
    is_recurring,
    recurrence_pattern,
    start_time,
    end_time,
    event_date,
    special_entry_fee_czk,
    is_featured,
  } = req.body;

  if (!venue_id || !title || !start_time || !end_time) {
    return res.status(400).json({ success: false, error: 'Chybí povinné údaje ceremoniálu' });
  }

  const db = getDb();
  const id = `cer_${venue_id}_${Date.now()}`;

  db.prepare(`
    INSERT INTO sauna_ceremonies (
      id, venue_id, title, category, description, ceremony_master, hall_name,
      day_of_week, is_recurring, recurrence_pattern, start_time, end_time,
      event_date, special_entry_fee_czk, is_featured, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `).run(
    id,
    venue_id,
    String(title).trim(),
    category || 'relaxing',
    description ? String(description).trim() : '',
    ceremony_master ? String(ceremony_master).trim() : null,
    hall_name ? String(hall_name).trim() : null,
    day_of_week != null ? Number(day_of_week) : null,
    is_recurring !== undefined ? (is_recurring ? 1 : 0) : 1,
    recurrence_pattern || 'weekly',
    start_time,
    end_time,
    event_date || null,
    special_entry_fee_czk ? Number(special_entry_fee_czk) : 0,
    is_featured ? 1 : 0
  );

  const created = db.prepare(`SELECT * FROM sauna_ceremonies WHERE id = ?`).get(id);
  return res.status(201).json({ success: true, ceremony: created });
});
