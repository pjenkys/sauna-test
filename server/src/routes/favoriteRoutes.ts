import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const favoriteRouter = Router();

/**
 * POST /api/users/me/lists
 * Adds a venue to user's personal list ("Oblíbené", "Chci navštívit", "Navštíveno").
 * Automatically syncs the venue's favorite_count aggregate.
 */
favoriteRouter.post('/', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const { venue_id, list_type, visited_at, personal_notes } = req.body;

  if (!venue_id || !list_type) {
    return res.status(400).json({ success: false, error: 'Chybí venue_id nebo list_type' });
  }

  const vType = String(list_type);
  const validTypes = ['favorite', 'want_to_visit', 'visited'];
  if (!validTypes.includes(vType)) {
    return res.status(400).json({ success: false, error: 'Neplatný typ seznamu' });
  }

  const db = getDb();
  const vId = String(venue_id);

  // Check duplicate
  const existing = db
    .prepare(`SELECT id FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?`)
    .get(user.id, vId, vType);

  if (existing) {
    return res.status(409).json({ success: false, error: 'Sauna již je v tomto seznamu' });
  }

  const listId = `list_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      INSERT INTO user_venue_lists (id, user_id, venue_id, list_type, visited_at, personal_notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(listId, user.id, vId, vType, visited_at ? String(visited_at) : null, personal_notes ? String(personal_notes) : null);

    if (vType === 'favorite') {
      db.prepare(`UPDATE sauna_venues SET favorite_count = favorite_count + 1 WHERE id = ?`).run(vId);
    }

    db.exec('COMMIT;');
    return res.status(201).json({ success: true });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE /api/users/me/lists/:venueId
 * Removes a venue from user's personal list and decrements favorite_count.
 */
favoriteRouter.delete('/:venueId', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const venueId = String(req.params.venueId);
  const listType = String(req.query.type || 'favorite');

  const db = getDb();

  const entry = db
    .prepare(`SELECT id FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?`)
    .get(user.id, venueId, listType) as any;

  if (entry) {
    db.exec('BEGIN TRANSACTION;');
    try {
      db.prepare(`DELETE FROM user_venue_lists WHERE id = ?`).run(String(entry.id));

      if (listType === 'favorite') {
        db.prepare(`UPDATE sauna_venues SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?`).run(venueId);
      }

      db.exec('COMMIT;');
    } catch (err: any) {
      db.exec('ROLLBACK;');
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  return res.json({ success: true });
});

/**
 * GET /api/users/me/lists
 * Retrieves all saved lists for the authenticated user organized by list type.
 */
favoriteRouter.get('/', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const db = getDb();

  const rows = db
    .prepare(`
      SELECT l.id as list_entry_id, l.list_type, l.visited_at, l.personal_notes, l.created_at as added_at, v.*
      FROM user_venue_lists l
      JOIN sauna_venues v ON l.venue_id = v.id
      WHERE l.user_id = ?
      ORDER BY l.created_at DESC
    `)
    .all(user.id) as any[];

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
