import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { requireAuth } from '../middleware/authMiddleware.js';

export const reviewRouter = Router();

/**
 * POST /api/reviews
 * Creates a new multi-criteria review (1-5 stars + 5 criteria breakdown)
 * and atomically recalculates the venue's overall rating and counters.
 */
reviewRouter.post('/', requireAuth, (req: Request, res: Response) => {
  const user = req.user!;
  const {
    venue_id,
    overall_rating,
    cleanliness,
    heat_quality,
    cooling_quality,
    staff_ceremony,
    price_value,
    title,
    content,
    tips,
    visit_date,
    recommended_time,
  } = req.body;

  if (!venue_id || overall_rating === undefined) {
    return res.status(400).json({ success: false, error: 'Chybí venue_id nebo overall_rating' });
  }

  const nOverall = Number(overall_rating);
  if (isNaN(nOverall) || nOverall < 1 || nOverall > 5) {
    return res.status(400).json({ success: false, error: 'Hodnocení musí být mezi 1 a 5' });
  }

  if (content && typeof content === 'string' && content.length > 3000) {
    return res.status(400).json({ success: false, error: 'Maximální délka recenze je 3000 znaků' });
  }

  const db = getDb();
  const vId = String(venue_id);

  // Check duplicate review
  const dup = db
    .prepare(`SELECT id FROM reviews WHERE venue_id = ? AND user_id = ?`)
    .get(vId, user.id);

  if (dup) {
    return res.status(409).json({ success: false, error: 'Pro tuto saunu jste již recenzi napsali' });
  }

  const reviewId = `rev_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const now = new Date().toISOString();

  db.exec('BEGIN TRANSACTION;');
  try {
    const nClean = cleanliness != null ? Number(cleanliness) : nOverall;
    const nHeat = heat_quality != null ? Number(heat_quality) : nOverall;
    const nCool = cooling_quality != null ? Number(cooling_quality) : nOverall;
    const nStaff = staff_ceremony != null ? Number(staff_ceremony) : nOverall;
    const nVal = price_value != null ? Number(price_value) : nOverall;

    db.prepare(`
      INSERT INTO reviews (
        id, venue_id, user_id, rating_overall, rating_cleanliness, rating_heat_steam,
        rating_cooling, rating_staff_ceremonies, rating_value, title, content, tips,
        recommended_time, visit_date, is_verified_visit, helpful_votes_count, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 'published', ?, ?)
    `).run(
      reviewId,
      vId,
      user.id,
      nOverall,
      nClean,
      nHeat,
      nCool,
      nStaff,
      nVal,
      title ? String(title).trim() : 'Uživatelská recenze',
      content ? String(content).trim() : '',
      tips ? String(tips).trim() : null,
      recommended_time ? String(recommended_time).trim() : null,
      visit_date ? String(visit_date) : null,
      now,
      now
    );

    // Atomically recalculate average ratings
    const stats = db
      .prepare(`
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
      `)
      .get(vId) as any;

    const count = Number(stats?.count || 0);
    const avgOverall = stats?.avg_overall != null ? Math.round(Number(stats.avg_overall) * 100) / 100 : 0;
    const avgClean = stats?.avg_clean != null ? Math.round(Number(stats.avg_clean) * 100) / 100 : 0;
    const avgHeat = stats?.avg_heat != null ? Math.round(Number(stats.avg_heat) * 100) / 100 : 0;
    const avgCool = stats?.avg_cool != null ? Math.round(Number(stats.avg_cool) * 100) / 100 : 0;
    const avgStaff = stats?.avg_staff != null ? Math.round(Number(stats.avg_staff) * 100) / 100 : 0;
    const avgVal = stats?.avg_val != null ? Math.round(Number(stats.avg_val) * 100) / 100 : 0;

    db.prepare(`
      UPDATE sauna_venues
      SET 
        rating_overall = ?,
        rating_cleanliness = ?,
        rating_heat_steam = ?,
        rating_cooling = ?,
        rating_staff_ceremonies = ?,
        rating_value = ?,
        review_count = ?
      WHERE id = ?
    `).run(avgOverall, avgClean, avgHeat, avgCool, avgStaff, avgVal, count, vId);

    db.prepare(`UPDATE users SET reviews_count = reviews_count + 1 WHERE id = ?`).run(user.id);

    db.exec('COMMIT;');

    const createdReview = db.prepare(`SELECT * FROM reviews WHERE id = ?`).get(reviewId);
    return res.status(201).json({ success: true, review: createdReview });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/reviews/:venueId
 * Retrieves all published reviews for a venue with reviewer profile snippets.
 */
reviewRouter.get('/:venueId', (req: Request, res: Response) => {
  const venueId = String(req.params.venueId);
  const db = getDb();

  const reviews = db
    .prepare(`
      SELECT 
        r.*,
        u.display_name as user_name,
        u.avatar_url as user_avatar,
        u.role as user_role
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.venue_id = ? AND r.status = 'published'
      ORDER BY r.helpful_votes_count DESC, r.created_at DESC
    `)
    .all(venueId);

  return res.json({ success: true, data: reviews });
});

/**
 * POST /api/reviews/:id/helpful
 * Casts a helpful vote on a community review and increments author reputation.
 */
reviewRouter.post('/:id/helpful', requireAuth, (req: Request, res: Response) => {
  const id = String(req.params.id);
  const user = req.user!;
  const db = getDb();

  // Check if vote already exists
  const existingVote = db
    .prepare(`SELECT 1 FROM review_helpful_votes WHERE review_id = ? AND user_id = ?`)
    .get(id, user.id);

  if (existingVote) {
    return res.status(409).json({ success: false, error: 'Této recenzi jste již hlas udělili' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    const voteId = `vote_${id}_${user.id}`;
    db.prepare(`
      INSERT INTO review_helpful_votes (id, review_id, user_id)
      VALUES (?, ?, ?)
    `).run(voteId, id, user.id);

    db.prepare(`UPDATE reviews SET helpful_votes_count = helpful_votes_count + 1 WHERE id = ?`).run(id);

    const rev = db.prepare(`SELECT user_id FROM reviews WHERE id = ?`).get(id) as any;
    if (rev) {
      db.prepare(`UPDATE users SET helpful_votes_received = helpful_votes_received + 1 WHERE id = ?`).run(String(rev.user_id));
    }

    db.exec('COMMIT;');
    return res.json({ success: true });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, error: err.message });
  }
});
