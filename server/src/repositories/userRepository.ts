import { DatabaseSync } from 'node:sqlite';
import { getDb } from '../db/connection.js';
import type { User, UserRole } from '@shared';

export interface CreateUserData {
  id?: string;
  email: string;
  password_hash: string;
  display_name: string;
  avatar_url?: string | null;
  role?: UserRole;
  bio?: string | null;
  preferred_region_id?: string | null;
}

export class UserRepository {
  private db: DatabaseSync;

  constructor(customDb?: DatabaseSync) {
    this.db = customDb || getDb();
  }

  findById(id: string): User | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE id = ?')
      .get(id) as Record<string, any> | undefined;

    if (!row) return null;
    return this.mapRowToUser(row);
  }

  findByEmail(email: string): User | null {
    const row = this.db
      .prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)')
      .get(email) as Record<string, any> | undefined;

    if (!row) return null;
    return this.mapRowToUser(row);
  }

  create(data: CreateUserData): User {
    const id = data.id || `user_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const role = data.role || 'user';
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO users (
        id, email, password_hash, display_name, avatar_url, role,
        bio, preferred_region_id, is_email_verified, reviews_count,
        helpful_votes_received, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?, ?)
    `);

    stmt.run(
      id,
      data.email.trim().toLowerCase(),
      data.password_hash,
      data.display_name.trim(),
      data.avatar_url ?? null,
      role,
      data.bio ?? null,
      data.preferred_region_id ?? null,
      now,
      now
    );

    const created = this.findById(id);
    if (!created) {
      throw new Error(`Failed to retrieve user after insertion: ${id}`);
    }
    return created;
  }

  update(id: string, fields: Partial<User>): User | null {
    const user = this.findById(id);
    if (!user) return null;

    const updates: string[] = [];
    const values: any[] = [];

    if (fields.display_name !== undefined) {
      updates.push('display_name = ?');
      values.push(fields.display_name);
    }
    if (fields.avatar_url !== undefined) {
      updates.push('avatar_url = ?');
      values.push(fields.avatar_url);
    }
    if (fields.bio !== undefined) {
      updates.push('bio = ?');
      values.push(fields.bio);
    }
    if (fields.role !== undefined) {
      updates.push('role = ?');
      values.push(fields.role);
    }
    if (fields.preferred_region_id !== undefined) {
      updates.push('preferred_region_id = ?');
      values.push(fields.preferred_region_id);
    }
    if (fields.is_email_verified !== undefined) {
      updates.push('is_email_verified = ?');
      values.push(fields.is_email_verified ? 1 : 0);
    }

    if (updates.length === 0) return user;

    updates.push("updated_at = CURRENT_TIMESTAMP");
    values.push(id);

    const sql = `UPDATE users SET ${updates.join(', ')} WHERE id = ?`;
    this.db.prepare(sql).run(...values);

    return this.findById(id);
  }

  private mapRowToUser(row: Record<string, any>): User {
    return {
      id: row.id,
      email: row.email,
      password_hash: row.password_hash,
      display_name: row.display_name,
      avatar_url: row.avatar_url,
      role: row.role as UserRole,
      bio: row.bio,
      preferred_region_id: row.preferred_region_id,
      is_email_verified: Boolean(row.is_email_verified),
      reviews_count: row.reviews_count || 0,
      helpful_votes_received: row.helpful_votes_received || 0,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}

export const userRepository = new UserRepository();
