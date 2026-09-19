import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import type { Server } from 'http';
import { app } from '../../server/src/app.js';
import { config } from '../../server/src/config.js';
import { setDb } from '../../server/src/db/connection.js';
import { createTestDatabase, getProductionApp } from '../setup.js';
import type { DatabaseSync } from 'node:sqlite';

describe('Production App Bootstrap & Express 5 Lifecycle Integration', () => {
  let db: DatabaseSync;
  let serverInstance: Server | null = null;

  beforeAll(() => {
    // Initialize in-memory test database and connect to the real production server singleton
    db = createTestDatabase();
    setDb(db);
  });

  afterAll(() => {
    if (serverInstance && serverInstance.listening) {
      serverInstance.close();
    }
  });

  describe('1. Configuration & Express 5 Compatibility', () => {
    it('configures fallback PORT to 3001 aligning with Vite proxy and documentation', () => {
      // In tests, if process.env.PORT is not set, PORT must be 3001
      expect(config.PORT).toBe(parseInt(process.env.PORT || '3001', 10));
      expect([3001, parseInt(process.env.PORT || '3001', 10)]).toContain(config.PORT);
    });

    it('initializes Express 5 production app without PathError or route regex failure', () => {
      expect(app).toBeDefined();
      expect(typeof app.listen).toBe('function');
      expect(typeof app.use).toBe('function');
    });

    it('getProductionApp helper returns the configured singleton application', () => {
      const prodApp = getProductionApp(db);
      expect(prodApp).toBe(app);
    });
  });

  describe('2. Core Health and Infrastructure Endpoints', () => {
    it('responds to GET /health with 200 and valid service payload', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body).toMatchObject({
        status: 'ok',
        service: 'czech-sauna-database-server',
      });
      expect(res.body.timestamp).toBeDefined();
    });

    it('responds to GET /api/health with 200 and valid service payload', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.status).toBe('ok');
    });

    it('handles CORS preflight on API routes', async () => {
      const res = await request(app)
        .options('/api/saunas')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'GET');
      expect([200, 204]).toContain(res.status);
      expect(res.headers['access-control-allow-origin']).toBe('*');
    });
  });

  describe('3. Production SPA Static Asset & Fallback Routing', () => {
    it('serves SPA index.html for root path GET /', async () => {
      const res = await request(app).get('/');
      // If client/dist exists, it serves 200 HTML
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('<!doctype html>');
    });

    it('serves SPA index.html for deep client routes (e.g. GET /saunas/praha)', async () => {
      const res = await request(app).get('/saunas/praha');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
      expect(res.text).toContain('<!doctype html>');
    });

    it('serves SPA index.html for unknown client routes (e.g. GET /chci-navstivit)', async () => {
      const res = await request(app).get('/chci-navstivit');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/text\/html/);
    });
  });

  describe('4. API Route Isolation from SPA Fallback', () => {
    it('executes real database query for GET /api/saunas without being intercepted by SPA', async () => {
      const res = await request(app).get('/api/saunas');
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.meta).toBeDefined();
      expect(res.body.meta.count).toBeGreaterThan(0);
    });

    it('returns 404 JSON for non-existent API routes instead of falling back to SPA index.html', async () => {
      const res = await request(app).get('/api/completely-unknown-route-endpoint');
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('Požadovaný koncový bod nebyl nalezen');
    });

    it('returns 404 JSON for non-existent POST API endpoints', async () => {
      const res = await request(app).post('/api/unknown-post-endpoint').send({ test: true });
      expect(res.status).toBe(404);
      expect(res.headers['content-type']).toMatch(/json/);
      expect(res.body.success).toBe(false);
    });
  });

  describe('5. Real Server Listen & Teardown', () => {
    it('starts listening on an ephemeral port without errors and closes cleanly', async () => {
      await new Promise<void>((resolve, reject) => {
        serverInstance = app.listen(0, () => {
          const addr = serverInstance?.address();
          expect(addr).toBeDefined();
          serverInstance?.close((err) => {
            if (err) return reject(err);
            resolve();
          });
        });
        serverInstance.on('error', reject);
      });
    });
  });
});
