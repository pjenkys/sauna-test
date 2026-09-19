import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp, getAuthToken } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: User Personal Lists & Favorites Management', () => {
  let db: DatabaseSync;
  let app: express.Application;
  const testUser = { id: 'user_fav_tester', email: 'fav.tester@email.cz', role: 'user' };
  let token: string;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);

    db.prepare(`
      INSERT OR IGNORE INTO users (id, email, password_hash, display_name, role)
      VALUES (?, ?, 'hash', 'Fav Tester', 'user')
    `).run(testUser.id, testUser.email);

    token = getAuthToken(testUser);
  });

  it('TEST-FAV-01: adds venue to "Oblíbené" and increments venue favorite_count', async () => {
    const venueId = 'saunaspot-dvorce';
    const beforeVenue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
    const initialCount = beforeVenue.favorite_count;

    const res = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({
        venue_id: venueId,
        list_type: 'favorite',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);

    // Verify row in user_venue_lists
    const listRow = db.prepare('SELECT * FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?')
      .get(testUser.id, venueId, 'favorite') as any;
    expect(listRow).toBeDefined();

    // Verify venue counter incremented
    const afterVenue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
    expect(afterVenue.favorite_count).toBe(initialCount + 1);
  });

  it('TEST-FAV-02: removes venue from "Oblíbené" and decrements venue favorite_count', async () => {
    const venueId = 'infinit-maximus-brno';

    // First add to favorites
    await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: venueId, list_type: 'favorite' });

    const beforeVenue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
    const countWithFav = beforeVenue.favorite_count;

    // Delete from favorites
    const res = await request(app)
      .delete(`/api/users/me/lists/${venueId}?type=favorite`)
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify row is gone
    const listRow = db.prepare('SELECT * FROM user_venue_lists WHERE user_id = ? AND venue_id = ? AND list_type = ?')
      .get(testUser.id, venueId, 'favorite');
    expect(listRow).toBeUndefined();

    // Verify venue counter decremented
    const afterVenue = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venueId) as any;
    expect(afterVenue.favorite_count).toBe(countWithFav - 1);
  });

  it('TEST-FAV-03: rejects duplicate addition to the same list with 409 Conflict', async () => {
    const venueId = 'lazne-na-lodi-praha';

    // First addition succeeds
    const res1 = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: venueId, list_type: 'favorite' });
    expect(res1.status).toBe(201);

    // Duplicate addition fails with 409
    const res2 = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: venueId, list_type: 'favorite' });
    expect(res2.status).toBe(409);
    expect(res2.body.success).toBe(false);
    expect(res2.body.error).toContain('již je v tomto seznamu');
  });

  it('TEST-FAV-04: manages multiple list types ("Chci navštívit" and "Navštíveno") independently', async () => {
    const venue1 = 'bazen-slovany-saunove-centrum';
    const venue2 = 'sareza-vodni-svet-capkovna';

    const initialCount1 = (db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venue1) as any).favorite_count;

    // Add venue1 to want_to_visit
    const res1 = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: venue1, list_type: 'want_to_visit' });
    expect(res1.status).toBe(201);

    // Add venue2 to visited
    const res2 = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: venue2, list_type: 'visited' });
    expect(res2.status).toBe(201);

    // Adding to want_to_visit does NOT increment favorite_count
    const venue1Db = db.prepare('SELECT favorite_count FROM sauna_venues WHERE id = ?').get(venue1) as any;
    expect(venue1Db.favorite_count).toBe(initialCount1);

    // Check rows exist with respective list_type
    const row1 = db.prepare('SELECT * FROM user_venue_lists WHERE user_id = ? AND venue_id = ?').get(testUser.id, venue1) as any;
    expect(row1.list_type).toBe('want_to_visit');

    const row2 = db.prepare('SELECT * FROM user_venue_lists WHERE user_id = ? AND venue_id = ?').get(testUser.id, venue2) as any;
    expect(row2.list_type).toBe('visited');
  });

  it('TEST-FAV-05: fetches grouped user profile lists with full venue card details', async () => {
    const favVenue = 'saunaspot-dvorce';
    const wantVenue = 'infinit-maximus-brno';
    const visitedVenue = 'saunia-westfield-chodov';

    await request(app).post('/api/users/me/lists').set('Authorization', `Bearer ${token}`).send({ venue_id: favVenue, list_type: 'favorite' });
    await request(app).post('/api/users/me/lists').set('Authorization', `Bearer ${token}`).send({ venue_id: wantVenue, list_type: 'want_to_visit' });
    await request(app).post('/api/users/me/lists').set('Authorization', `Bearer ${token}`).send({ venue_id: visitedVenue, list_type: 'visited' });

    const res = await request(app)
      .get('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toBeDefined();

    const lists = res.body.data;
    expect(Array.isArray(lists.favorite)).toBe(true);
    expect(Array.isArray(lists.want_to_visit)).toBe(true);
    expect(Array.isArray(lists.visited)).toBe(true);

    expect(lists.favorite.some((v: any) => v.id === favVenue)).toBe(true);
    expect(lists.want_to_visit.some((v: any) => v.id === wantVenue)).toBe(true);
    expect(lists.visited.some((v: any) => v.id === visitedVenue)).toBe(true);

    // Check venue object fields
    const card = lists.favorite.find((v: any) => v.id === favVenue);
    expect(card.name).toBe('Saunaspot Dvorce');
    expect(card.rating_overall).toBeDefined();
    expect(card.address_city).toContain('Praha');
  });

  it('TEST-FAV-06: rejects unauthenticated access to list endpoints with 401', async () => {
    const postRes = await request(app)
      .post('/api/users/me/lists')
      .send({ venue_id: 'saunaspot-dvorce', list_type: 'favorite' });
    expect(postRes.status).toBe(401);

    const getRes = await request(app).get('/api/users/me/lists');
    expect(getRes.status).toBe(401);

    const deleteRes = await request(app).delete('/api/users/me/lists/saunaspot-dvorce');
    expect(deleteRes.status).toBe(401);
  });

  it('TEST-FAV-07: rejects invalid list mutation requests missing required fields with 400', async () => {
    const res = await request(app)
      .post('/api/users/me/lists')
      .set('Authorization', `Bearer ${token}`)
      .send({ venue_id: 'saunaspot-dvorce' }); // missing list_type

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

