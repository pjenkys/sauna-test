import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/connection.js';
import type { Review, UserPublicProfile } from '@shared';

export interface CreateReviewData {
  venue_id: string;
  user_id: string;
  rating_overall: number;
  rating_cleanliness: number;
  rating_heat_steam: number;
  rating_cooling: number;
  rating_staff_ceremonies: number;
  rating_value: number;
  title: string;
  content: string;
  tips?: string | null;
  recommended_time?: string | null;
  visit_date?: string | null;
  is_verified_visit?: boolean;
}

export class ReviewRepository {
  private db: DatabaseSync;

  constructor(customDb?: DatabaseSync) {
    this.db = customDb || getDb();
  }

  findByVenueId(venueId: string, limit = 50, offset = 0): Review[] {
    const sql = `
      SELECT
        r.*,
        u.display_name AS user_display_name,
        u.avatar_url AS user_avatar_url,
        u.role AS user_role,
        u.bio AS user_bio,
        u.reviews_count AS user_reviews_count,
        u.helpful_votes_received AS user_helpful_votes_received
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.venue_id = ? AND r.status = 'published'
      ORDER BY r.helpful_votes_count DESC, r.created_at DESC
      LIMIT ? OFFSET ?
    `;

    const rows = this.db.prepare(sql).all(venueId, limit, offset) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRowToReview(r));
  }

  findById(id: string): Review | null {
    const sql = `
      SELECT
        r.*,
        u.display_name AS user_display_name,
        u.avatar_url AS user_avatar_url,
        u.role AS user_role,
        u.bio AS user_bio,
        u.reviews_count AS user_reviews_count,
        u.helpful_votes_received AS user_helpful_votes_received
      FROM reviews r
      JOIN users u ON r.user_id = u.id
      WHERE r.id = ?
    `;

    const row = this.db.prepare(sql).get(id) as Record<string, any> | undefined;
    if (!row) return null;
    return this.mapRowToReview(row);
  }

  create(data: CreateReviewData): Review {
    const id = `rev_${data.venue_id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    this.db.exec('BEGIN TRANSACTION');
    try {
      const stmt = this.db.prepare(`
        INSERT INTO reviews (
          id, venue_id, user_id, rating_overall, rating_cleanliness,
          rating_heat_steam, rating_cooling, rating_staff_ceremonies, rating_value,
          title, content, tips, recommended_time, visit_date, is_verified_visit,
          helpful_votes_count, status, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          0, 'published', ?, ?
        )
      `);

      stmt.run(
        id,
        data.venue_id,
        data.user_id,
        data.rating_overall,
        data.rating_cleanliness,
        data.rating_heat_steam,
        data.rating_cooling,
        data.rating_staff_ceremonies,
        data.rating_value,
        data.title.trim(),
        data.content.trim(),
        data.tips?.trim() ?? null,
        data.recommended_time?.trim() ?? null,
        data.visit_date ?? null,
        data.is_verified_visit ? 1 : 0,
        now,
        now
      );

      // Recalculate venue aggregates
      this.recalculateVenueRatings(data.venue_id);

      // Update user review count
      this.db
        .prepare('UPDATE users SET reviews_count = (SELECT COUNT(*) FROM reviews WHERE user_id = ?) WHERE id = ?')
        .run(data.user_id, data.user_id);

      this.db.exec('COMMIT');
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to load review after creation: ${id}`);
    }
    return created;
  }

  voteHelpful(reviewId: string, userId: string): boolean {
    const review = this.findById(reviewId);
    if (!review) return false;

    // Check if user already voted
    const existing = this.db
      .prepare('SELECT 1 FROM review_helpful_votes WHERE review_id = ? AND user_id = ?')
      .get(reviewId, userId);

    if (existing) {
      return false; // Already voted
    }

    const voteId = `vote_${reviewId}_${userId}`;
    this.db.exec('BEGIN TRANSACTION');
    try {
      this.db
        .prepare('INSERT INTO review_helpful_votes (id, review_id, user_id, created_at) VALUES (?, ?, ?, CURRENT_TIMESTAMP)')
        .run(voteId, reviewId, userId);

      this.db
        .prepare('UPDATE reviews SET helpful_votes_count = helpful_votes_count + 1 WHERE id = ?')
        .run(reviewId);

      this.db
        .prepare('UPDATE users SET helpful_votes_received = helpful_votes_received + 1 WHERE id = ?')
        .run(review.user_id);

      this.db.exec('COMMIT');
      return true;
    } catch (err) {
      this.db.exec('ROLLBACK');
      throw err;
    }
  }

  recalculateVenueRatings(venueId: string): { overall: number; count: number } {
    const stats = this.db.prepare(`
      SELECT
        ROUND(AVG(rating_overall), 2) AS avg_overall,
        ROUND(AVG(rating_cleanliness), 2) AS avg_cleanliness,
        ROUND(AVG(rating_heat_steam), 2) AS avg_heat_steam,
        ROUND(AVG(rating_cooling), 2) AS avg_cooling,
        ROUND(AVG(rating_staff_ceremonies), 2) AS avg_staff,
        ROUND(AVG(rating_value), 2) AS avg_value,
        COUNT(*) AS total_count
      FROM reviews
      WHERE venue_id = ? AND status = 'published'
    `).get(venueId) as Record<string, any>;

    const overall = Number(stats?.avg_overall) || 0;
    const cleanliness = Number(stats?.avg_cleanliness) || 0;
    const heatSteam = Number(stats?.avg_heat_steam) || 0;
    const cooling = Number(stats?.avg_cooling) || 0;
    const staff = Number(stats?.avg_staff) || 0;
    const value = Number(stats?.avg_value) || 0;
    const count = Number(stats?.total_count) || 0;

    this.db.prepare(`
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
    `).run(overall, cleanliness, heatSteam, cooling, staff, value, count, venueId);

    return { overall, count };
  }

  private mapRowToReview(r: Record<string, any>): Review {
    const user: UserPublicProfile = {
      id: r.user_id,
      display_name: r.user_display_name,
      avatar_url: r.user_avatar_url,
      role: r.user_role,
      bio: r.user_bio,
      is_email_verified: true,
      reviews_count: Number(r.user_reviews_count || 0),
      helpful_votes_received: Number(r.user_helpful_votes_received || 0),
    };

    return {
      id: r.id,
      venue_id: r.venue_id,
      user_id: r.user_id,
      rating_overall: Number(r.rating_overall),
      rating_cleanliness: Number(r.rating_cleanliness),
      rating_heat_steam: Number(r.rating_heat_steam),
      rating_cooling: Number(r.rating_cooling),
      rating_staff_ceremonies: Number(r.rating_staff_ceremonies),
      rating_value: Number(r.rating_value),
      title: r.title,
      content: r.content,
      tips: r.tips,
      recommended_time: r.recommended_time,
      visit_date: r.visit_date,
      is_verified_visit: Boolean(r.is_verified_visit),
      helpful_votes_count: Number(r.helpful_votes_count || 0),
      status: r.status,
      created_at: r.created_at,
      updated_at: r.updated_at,
      user,
    };
  }
}

export const reviewRepository = new ReviewRepository();
