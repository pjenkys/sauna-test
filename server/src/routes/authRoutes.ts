import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { hashPasswordSync, comparePasswordSync } from '../utils/password.js';
import { generateToken, requireAuth } from '../middleware/authMiddleware.js';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Registers a new user account with bcrypt password hashing.
 */
authRouter.post('/register', (req: Request, res: Response) => {
  const { email, password, display_name } = req.body;

  if (!email || !password || !display_name) {
    return res.status(400).json({ success: false, error: 'Chybí povinné údaje' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();

  const existing = db.prepare(`SELECT id FROM users WHERE LOWER(email) = ?`).get(normalizedEmail);
  if (existing) {
    return res.status(409).json({ success: false, error: 'Uživatel s tímto e-mailem již existuje' });
  }

  const id = `user_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const hash = hashPasswordSync(password);

  db.prepare(`
    INSERT INTO users (id, email, password_hash, display_name, role)
    VALUES (?, ?, ?, ?, 'user')
  `).run(id, normalizedEmail, hash, display_name.trim());

  const user = {
    id,
    email: normalizedEmail,
    display_name: display_name.trim(),
    role: 'user',
  };

  const token = generateToken(user);
  return res.status(201).json({ success: true, token, user });
});

/**
 * POST /api/auth/login
 * Authenticates user credentials and returns signed JWT token.
 */
authRouter.post('/login', (req: Request, res: Response) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Chybí e-mail nebo heslo' });
  }

  const normalizedEmail = email.trim().toLowerCase();
  const db = getDb();

  const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = ?`).get(normalizedEmail) as any;
  if (!user) {
    return res.status(401).json({ success: false, error: 'Neplatné přihlašovací údaje' });
  }

  const isValid = comparePasswordSync(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Neplatné přihlašovací údaje' });
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    role: user.role,
  };

  const token = generateToken(tokenPayload);

  return res.json({
    success: true,
    token,
    user: tokenPayload,
  });
});

/**
 * GET /api/auth/me
 * Retrieves current authenticated user session and public profile stats.
 */
authRouter.get('/me', requireAuth, (req: Request, res: Response) => {
  const userPayload = req.user!;
  const db = getDb();

  const user = db.prepare(`
    SELECT id, email, display_name, role, reviews_count, helpful_votes_received, avatar_url, bio
    FROM users
    WHERE id = ?
  `).get(userPayload.id) as any;

  if (!user) {
    return res.status(404).json({ success: false, error: 'Uživatel nenalezen' });
  }

  return res.json({ success: true, user });
});
