import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { createTestDatabase, createTestApp, getAuthToken } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: User Authentication & Session Security Workflow', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('TEST-AUTH-01: successfully registers a new user with bcrypt-hashed password', async () => {
    const newUser = {
      email: 'jan.novak@seznam.cz',
      password: 'BezpecneHeslo2026!',
      display_name: 'Jan Novák',
    };

    const res = await request(app)
      .post('/api/auth/register')
      .send(newUser);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(newUser.email);
    expect(res.body.user.display_name).toBe(newUser.display_name);
    expect(res.body.user.role).toBe('user');

    // Verify stored password hash in database
    const userInDb = db.prepare('SELECT * FROM users WHERE email = ?').get(newUser.email) as any;
    expect(userInDb).toBeDefined();
    expect(userInDb.password_hash).not.toBe(newUser.password);
    expect(bcrypt.compareSync(newUser.password, userInDb.password_hash)).toBe(true);
  });

  it('TEST-AUTH-02: rejects duplicate email registration with 409 Conflict', async () => {
    const existingEmail = 'eva.novakova@seznam.cz'; // already seeded in catalogs.json

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        email: existingEmail,
        password: 'AnotherPassword123!',
        display_name: 'Podvodný Uživatel',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('již existuje');
  });

  it('TEST-AUTH-03: logs in existing user with correct credentials and returns JWT', async () => {
    const plainPassword = 'Password123!';
    const hash = bcrypt.hashSync(plainPassword, 10);
    const testEmail = 'prihlaseni.test@email.cz';

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role)
      VALUES ('user_login_test', ?, ?, 'Test Přihlášení', 'user')
    `).run(testEmail, hash);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: plainPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe(testEmail);
    expect(res.body.user.display_name).toBe('Test Přihlášení');
  });

  it('TEST-AUTH-04: rejects login with incorrect password with 401 Unauthorized', async () => {
    const plainPassword = 'CorrectPassword123!';
    const hash = bcrypt.hashSync(plainPassword, 10);
    const testEmail = 'spatne.heslo@email.cz';

    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role)
      VALUES ('user_wrong_pass', ?, ?, 'Špatné Heslo Test', 'user')
    `).run(testEmail, hash);

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword999!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Neplatné přihlašovací údaje');
  });

  it('TEST-AUTH-05: protects /api/auth/me endpoint against unauthenticated calls', async () => {
    // Unauthenticated call
    const unauthRes = await request(app).get('/api/auth/me');
    expect(unauthRes.status).toBe(401);
    expect(unauthRes.body.success).toBe(false);

    // Authenticated call with valid token
    const testUser = { id: 'user_protected_test', email: 'protected@seznam.cz', role: 'user' };
    db.prepare(`
      INSERT INTO users (id, email, password_hash, display_name, role)
      VALUES (?, ?, 'hash', 'Chráněný Uživatel', 'user')
    `).run(testUser.id, testUser.email);

    const token = getAuthToken(testUser);
    const authRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(authRes.status).toBe(200);
    expect(authRes.body.success).toBe(true);
    expect(authRes.body.user.id).toBe(testUser.id);
    expect(authRes.body.user.email).toBe(testUser.email);
  });

  it('TEST-AUTH-06: rejects registration with missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'incomplete@user.cz' }); // missing password and display_name

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('Chybí');
  });

  it('TEST-AUTH-07: rejects login for non-existent user with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'neexistujici@email.cz',
        password: 'AnyPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toBe('Neplatné přihlašovací údaje');
  });
});

