import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Tier 4 E2E Journey 3: The Community Contributor (David)', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('executes full community contributor journey: zero-state search -> submit sauna proposal -> pending status -> admin approval -> searchable active venue', async () => {
    // 1. David searches for a newly opened sauna in Liberec
    const initialSearchRes = await request(app)
      .get('/api/saunas')
      .query({ q: 'Sauna U Lesa' });

    expect(initialSearchRes.status).toBe(200);
    expect(initialSearchRes.body.success).toBe(true);
    expect(initialSearchRes.body.data).toEqual([]);
    expect(initialSearchRes.body.meta.count).toBe(0);
    // Zero-state relaxation suggestions are offered
    expect(initialSearchRes.body.meta.suggestedRelaxations).toBeDefined();

    // 2. David clicks "Navrhnout novou saunu do databáze" and submits the form
    const proposalData = {
      name: 'Sauna U Lesa',
      category: 'hotel_mountain',
      city: 'Liberec',
      address: 'Lesní 124, Liberec',
      multisport_status: 'accepted_90m',
      cooling_options: ['plunge_pool', 'bucket_shower'],
      notes: 'Krásná nová horská sauna u lesa pod Ještědem.',
      submitter_email: 'david.liberec@gmail.com',
      submitter_name: 'David Liberecký',
    };

    const submitRes = await request(app)
      .post('/api/suggestions')
      .send(proposalData);

    expect(submitRes.status).toBe(201);
    expect(submitRes.body.success).toBe(true);
    expect(submitRes.body.suggestion_id).toBeDefined();
    const suggestionId = submitRes.body.suggestion_id;

    // Verify row is created in venue_suggestions with status = 'pending'
    const pendingRow = db.prepare('SELECT * FROM venue_suggestions WHERE id = ?').get(suggestionId) as any;
    expect(pendingRow).toBeDefined();
    expect(pendingRow.venue_name || pendingRow.name).toBe(proposalData.name);
    expect(pendingRow.category).toBe(proposalData.category);
    expect(pendingRow.status).toBe('pending');
    expect(pendingRow.created_venue_id).toBeNull();

    // 3. Before admin approval, the sauna must NOT appear in public searches
    const preApprovalSearch = await request(app)
      .get('/api/saunas')
      .query({ q: 'Sauna U Lesa' });

    expect(preApprovalSearch.status).toBe(200);
    expect(preApprovalSearch.body.data).toEqual([]);

    // 4. Platform Moderator reviews and approves the submission
    const approveRes = await request(app)
      .patch(`/api/admin/suggestions/${suggestionId}/approve`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.venue_id).toBeDefined();
    const newVenueId = approveRes.body.venue_id;

    // Verify suggestion status updated to approved and created_venue_id linked
    const approvedRow = db.prepare('SELECT * FROM venue_suggestions WHERE id = ?').get(suggestionId) as any;
    expect(approvedRow.status).toBe('approved');
    expect(approvedRow.created_venue_id).toBe(newVenueId);

    // Verify newly created venue in sauna_venues
    const newVenueRow = db.prepare('SELECT * FROM sauna_venues WHERE id = ?').get(newVenueId) as any;
    expect(newVenueRow).toBeDefined();
    expect(newVenueRow.name).toBe(proposalData.name);
    expect(newVenueRow.status).toBe('active');
    expect(newVenueRow.category).toBe(proposalData.category);

    // 5. David searches again -> now found!
    const postApprovalSearch = await request(app)
      .get('/api/saunas')
      .query({ q: 'Sauna U Lesa' });

    expect(postApprovalSearch.status).toBe(200);
    expect(postApprovalSearch.body.data.length).toBe(1);
    expect(postApprovalSearch.body.data[0].id).toBe(newVenueId);
    expect(postApprovalSearch.body.data[0].name).toBe('Sauna U Lesa');

    // 6. David can view the live venue detail page
    const detailRes = await request(app).get(`/api/saunas/${newVenueId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.id).toBe(newVenueId);
    expect(detailRes.body.data.name).toBe('Sauna U Lesa');
    expect(detailRes.body.data.address_city).toBe('Liberec');
  });
});
