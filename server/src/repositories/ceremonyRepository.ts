import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/connection.js';
import type { SaunaCeremony, CeremonyCategoryCode } from '@shared';

export interface FindCeremoniesOptions {
  venue_id?: string;
  category?: CeremonyCategoryCode;
  day_of_week?: number;
  limit?: number;
  offset?: number;
}

export class CeremonyRepository {
  private db: DatabaseSync;

  constructor(customDb?: DatabaseSync) {
    this.db = customDb || getDb();
  }

  findUpcoming(options: FindCeremoniesOptions = {}): SaunaCeremony[] {
    let sql = `
      SELECT
        sc.*,
        sv.name AS venue_name,
        sv.slug AS venue_slug
      FROM sauna_ceremonies sc
      JOIN sauna_venues sv ON sc.venue_id = sv.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (options.venue_id) {
      sql += ' AND sc.venue_id = ?';
      params.push(options.venue_id);
    }
    if (options.category) {
      sql += ' AND sc.category = ?';
      params.push(options.category);
    }
    if (options.day_of_week !== undefined) {
      sql += ' AND sc.day_of_week = ?';
      params.push(options.day_of_week);
    }

    sql += ' ORDER BY sc.is_featured DESC, sc.day_of_week ASC, sc.start_time ASC';

    if (options.limit) {
      sql += ' LIMIT ?';
      params.push(options.limit);
      if (options.offset) {
        sql += ' OFFSET ?';
        params.push(options.offset);
      }
    }

    const rows = this.db.prepare(sql).all(...params) as Array<Record<string, any>>;
    return rows.map((r) => this.mapRowToCeremony(r));
  }

  findById(id: string): SaunaCeremony | null {
    const row = this.db.prepare(`
      SELECT
        sc.*,
        sv.name AS venue_name,
        sv.slug AS venue_slug
      FROM sauna_ceremonies sc
      JOIN sauna_venues sv ON sc.venue_id = sv.id
      WHERE sc.id = ?
    `).get(id) as Record<string, any> | undefined;

    if (!row) return null;
    return this.mapRowToCeremony(row);
  }

  create(ceremony: Partial<SaunaCeremony>): SaunaCeremony {
    const id = ceremony.id || `cer_${ceremony.venue_id}_${Date.now()}`;
    const stmt = this.db.prepare(`
      INSERT INTO sauna_ceremonies (
        id, venue_id, title, category, description, ceremony_master, hall_name,
        day_of_week, is_recurring, recurrence_pattern, start_time, end_time,
        event_date, special_entry_fee_czk, is_featured, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `);

    stmt.run(
      id,
      ceremony.venue_id || '',
      ceremony.title || '',
      ceremony.category || 'relaxing',
      ceremony.description || '',
      ceremony.ceremony_master ?? null,
      ceremony.hall_name ?? null,
      ceremony.day_of_week ?? null,
      ceremony.is_recurring !== undefined ? (ceremony.is_recurring ? 1 : 0) : 1,
      ceremony.recurrence_pattern || 'weekly',
      ceremony.start_time || '18:00',
      ceremony.end_time || '18:20',
      ceremony.event_date ?? null,
      ceremony.special_entry_fee_czk || 0,
      ceremony.is_featured ? 1 : 0
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve ceremony after creation: ${id}`);
    }
    return created;
  }

  delete(id: string): boolean {
    const res = this.db.prepare('DELETE FROM sauna_ceremonies WHERE id = ?').run(id);
    return Number(res.changes) > 0;
  }

  private mapRowToCeremony(r: Record<string, any>): SaunaCeremony {
    return {
      id: r.id,
      venue_id: r.venue_id,
      title: r.title,
      category: r.category as CeremonyCategoryCode,
      description: r.description,
      ceremony_master: r.ceremony_master,
      hall_name: r.hall_name,
      day_of_week: r.day_of_week,
      is_recurring: Boolean(r.is_recurring),
      recurrence_pattern: r.recurrence_pattern,
      start_time: r.start_time,
      end_time: r.end_time,
      event_date: r.event_date,
      special_entry_fee_czk: Number(r.special_entry_fee_czk || 0),
      is_featured: Boolean(r.is_featured),
      created_at: r.created_at,
      venue_name: r.venue_name,
      venue_slug: r.venue_slug,
    };
  }
}

export const ceremonyRepository = new CeremonyRepository();
