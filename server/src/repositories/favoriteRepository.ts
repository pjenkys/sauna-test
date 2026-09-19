import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/connection.js';
import type { UserVenueListEntry, UserListTypeCode, SaunaSummary } from '@shared';

export class FavoriteRepository {
  private db: DatabaseSync;

  constructor(customDb?: DatabaseSync) {
    this.db = customDb || getDb();
  }

  getUserList(userId: string, listType?: UserListTypeCode): UserVenueListEntry[] {
    let sql = `
      SELECT
        uvl.id,
        uvl.user_id,
        uvl.venue_id,
        uvl.list_type,
        uvl.visited_at,
        uvl.personal_notes,
        uvl.created_at,
        sv.name AS venue_name,
        sv.slug AS venue_slug,
        sv.category AS venue_category,
        sv.short_description AS venue_short_description,
        sv.cover_image_url AS venue_cover_image_url,
        sv.address_street AS venue_address_street,
        sv.address_city AS venue_address_city,
        sv.address_zip AS venue_address_zip,
        sv.latitude AS venue_latitude,
        sv.longitude AS venue_longitude,
        sv.region_id AS venue_region_id,
        sv.city_id AS venue_city_id,
        sv.has_plunge_pool AS venue_has_plunge_pool,
        sv.has_outdoor_cooling AS venue_has_outdoor_cooling,
        sv.has_natural_water AS venue_has_natural_water,
        sv.has_ceremonial_hall AS venue_has_ceremonial_hall,
        sv.has_whirlpool AS venue_has_whirlpool,
        sv.rating_overall AS venue_rating_overall,
        sv.review_count AS venue_review_count,
        sv.favorite_count AS venue_favorite_count,
        sv.is_promoted AS venue_is_promoted,
        sv.promoted_badge AS venue_promoted_badge,
        vmr.is_accepted AS ms_is_accepted,
        vmr.benefit_type AS ms_benefit_type,
        vmr.time_limit_minutes AS ms_time_limit_minutes,
        vmr.discount_amount_czk AS ms_discount_amount_czk,
        vmr.entry_surcharge_czk AS ms_entry_surcharge_czk
      FROM user_venue_lists uvl
      JOIN sauna_venues sv ON uvl.venue_id = sv.id
      LEFT JOIN venue_multisport_rules vmr ON sv.id = vmr.venue_id
      WHERE uvl.user_id = ?
    `;

    const params: any[] = [userId];
    if (listType) {
      sql += ' AND uvl.list_type = ?';
      params.push(listType);
    }
    sql += ' ORDER BY uvl.created_at DESC';

    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, any>>;

    return rows.map((r) => {
      const summary: SaunaSummary = {
        id: r.venue_id,
        name: r.venue_name,
        slug: r.venue_slug,
        category: r.venue_category,
        short_description: r.venue_short_description,
        cover_image_url: r.venue_cover_image_url,
        address_street: r.venue_address_street,
        address_city: r.venue_address_city,
        address_zip: r.venue_address_zip,
        latitude: Number(r.venue_latitude),
        longitude: Number(r.venue_longitude),
        region_id: r.venue_region_id,
        city_id: r.venue_city_id,
        has_plunge_pool: Boolean(r.venue_has_plunge_pool),
        has_outdoor_cooling: Boolean(r.venue_has_outdoor_cooling),
        has_natural_water: Boolean(r.venue_has_natural_water),
        has_ceremonial_hall: Boolean(r.venue_has_ceremonial_hall),
        has_whirlpool: Boolean(r.venue_has_whirlpool),
        rating_overall: Number(r.venue_rating_overall || 0),
        review_count: Number(r.venue_review_count || 0),
        favorite_count: Number(r.venue_favorite_count || 0),
        is_promoted: Boolean(r.venue_is_promoted),
        promoted_badge: r.venue_promoted_badge,
        multisport: r.ms_is_accepted
          ? {
              is_accepted: Boolean(r.ms_is_accepted),
              benefit_type: r.ms_benefit_type,
              time_limit_minutes: r.ms_time_limit_minutes,
              discount_amount_czk: r.ms_discount_amount_czk,
              entry_surcharge_czk: r.ms_entry_surcharge_czk,
            }
          : undefined,
      };

      return {
        id: r.id,
        user_id: r.user_id,
        venue_id: r.venue_id,
        list_type: r.list_type as UserListTypeCode,
        visited_at: r.visited_at,
        personal_notes: r.personal_notes,
        created_at: r.created_at,
        venue: summary,
      };
    });
  }

  addToList(
    userId: string,
    venueId: string,
    listType: UserListTypeCode,
    notes?: string,
    visitedAt?: string
  ): UserVenueListEntry {
    const id = `list_${userId}_${venueId}_${listType}`;
    const stmt = this.db.prepare(`
      INSERT INTO user_venue_lists (id, user_id, venue_id, list_type, visited_at, personal_notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT(user_id, venue_id, list_type) DO UPDATE SET
        visited_at = excluded.visited_at,
        personal_notes = excluded.personal_notes
    `);

    stmt.run(id, userId, venueId, listType, visitedAt ?? null, notes ?? null);

    if (listType === 'favorite') {
      this.recalculateVenueFavoriteCount(venueId);
    }

    const entries = this.getUserList(userId, listType);
    const created = entries.find((e) => e.venue_id === venueId);
    if (!created) {
      throw new Error(`Failed to retrieve list entry after insert: ${id}`);
    }
    return created;
  }

  removeFromList(userId: string, venueId: string, listType: UserListTypeCode): boolean {
    const res = this.db
      .prepare('DELETE FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?')
      .run(userId, venueId, listType);

    if (listType === 'favorite') {
      this.recalculateVenueFavoriteCount(venueId);
    }

    return Number(res.changes) > 0;
  }

  isVenueInUserList(userId: string, venueId: string, listType: UserListTypeCode): boolean {
    const row = this.db
      .prepare('SELECT 1 FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?')
      .get(userId, venueId, listType);
    return Boolean(row);
  }

  recalculateVenueFavoriteCount(venueId: string): number {
    const row = this.db
      .prepare("SELECT COUNT(*) AS count FROM user_venue_lists WHERE venue_id = ? AND list_type = 'favorite'")
      .get(venueId) as { count: number };

    const count = Number(row?.count) || 0;
    this.db.prepare('UPDATE sauna_venues SET favorite_count = ? WHERE id = ?').run(count, venueId);
    return count;
  }
}

export const favoriteRepository = new FavoriteRepository();
