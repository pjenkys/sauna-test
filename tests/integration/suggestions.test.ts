import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestDatabase, createTestApp } from '../setup';
import { DatabaseSync } from 'node:sqlite';
import express from 'express';

describe('Integration: Community Suggestions & Moderation Workflow', () => {
  let db: DatabaseSync;
  let app: express.Application;

  beforeEach(() => {
    db = createTestDatabase();
    app = createTestApp(db);
  });

  it('TEST-SUG-01: submits public community proposal with initial status "pending"', async () => {
    const proposalData = {
      name: 'Sauna U Lesa',
      category: 'hotel_mountain',
      city: 'Liberec',
      address: 'Lesní 124, Liberec',
      multisport_status: 'accepted_90m',
      cooling_options: ['plunge_pool', 'bucket_shower'],
      notes: 'Krásná nová sauna u sjezdovky.',
      submitter_email: 'david.liberec@gmail.com',
    };

    const res = await request(app)
      .post('/api/suggestions')
      .send(proposalData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.suggestion_id).toBeDefined();

    // Verify row in venue_suggestions
    const row = db.prepare('SELECT * FROM venue_suggestions WHERE id = ?').get(res.body.suggestion_id) as any;
    expect(row).toBeDefined();
    expect(row.venue_name || row.name).toBe(proposalData.name);
    expect(row.category).toBe(proposalData.category);
    expect(row.submitter_email).toBe(proposalData.submitter_email);
    expect(row.status).toBe('pending');
  });

  it('TEST-SUG-02: rejects proposal submission with missing required fields or invalid email with 400', async () => {
    // Missing address
    const res1 = await request(app)
      .post('/api/suggestions')
      .send({
        name: 'Sauna Bez Adresy',
        submitter_email: 'user@test.cz',
      });
    expect(res1.status).toBe(400);
    expect(res1.body.success).toBe(false);

    // Invalid email (no @)
    const res2 = await request(app)
      .post('/api/suggestions')
      .send({
        name: 'Sauna Špatný Email',
        address: 'Náměstí 1, Praha',
        submitter_email: 'not-an-email',
      });
    expect(res2.status).toBe(400);
    expect(res2.body.success).toBe(false);
  });

  it('TEST-SUG-03: submits outdated info / correction report for existing venue', async () => {
    const venueId = 'saunaspot-dvorce';
    const reportData = {
      venue_id: venueId,
      report_type: 'multisport_rule_changed',
      details: 'MultiSport limit změněn z 90 na 120 minut o víkendech.',
      submitter_email: 'informator@saunari.cz',
    };

    const res = await request(app)
      .post('/api/suggestions/edit')
      .send(reportData);

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.suggestion_id).toBeDefined();

    // Verify saved in venue_edit_suggestions
    const editRow = db.prepare('SELECT * FROM venue_edit_suggestions WHERE id = ?').get(res.body.suggestion_id) as any;
    expect(editRow).toBeDefined();
    expect(editRow.venue_id).toBe(venueId);
    expect(editRow.report_type).toBe(reportData.report_type);
    expect(editRow.details || editRow.suggested_changes_json).toBe(reportData.details);
    expect(editRow.status).toBe('pending');

    // Missing details returns 400
    const badRes = await request(app)
      .post('/api/suggestions/edit')
      .send({ venue_id: venueId });
    expect(badRes.status).toBe(400);
  });

  it('TEST-SUG-04: moderator approves proposal -> updates status and creates active venue in database', async () => {
    // 1. Submit proposal
    const submitRes = await request(app)
      .post('/api/suggestions')
      .send({
        name: 'Krkonošská Vyhlídka',
        category: 'hotel_mountain',
        city: 'Liberec',
        address: 'Horská 50, Liberec',
        submitter_email: 'petr@krkonose.cz',
      });
    const sugId = submitRes.body.suggestion_id;

    // 2. Moderator approves
    const approveRes = await request(app)
      .patch(`/api/admin/suggestions/${sugId}/approve`);

    expect(approveRes.status).toBe(200);
    expect(approveRes.body.success).toBe(true);
    expect(approveRes.body.venue_id).toBeDefined();

    const createdVenueId = approveRes.body.venue_id;

    // 3. Verify suggestion status updated to approved
    const sugRow = db.prepare('SELECT status FROM venue_suggestions WHERE id = ?').get(sugId) as any;
    expect(sugRow.status).toBe('approved');

    // 4. Verify new venue exists in sauna_venues and is active
    const venueRow = db.prepare('SELECT * FROM sauna_venues WHERE id = ?').get(createdVenueId) as any;
    expect(venueRow).toBeDefined();
    expect(venueRow.name).toBe('Krkonošská Vyhlídka');
    expect(venueRow.status).toBe('active');

    // 5. Verify venue is retrievable via public detail endpoint
    const detailRes = await request(app).get(`/api/saunas/${createdVenueId}`);
    expect(detailRes.status).toBe(200);
    expect(detailRes.body.data.name).toBe('Krkonošská Vyhlídka');
  });

  it('TEST-SUG-05: moderator rejects proposal with reason comment', async () => {
    // 1. Submit proposal
    const submitRes = await request(app)
      .post('/api/suggestions')
      .send({
        name: 'Neplatný Podnik',
        address: 'Neexistující 999',
        submitter_email: 'troll@fake.cz',
      });
    const sugId = submitRes.body.suggestion_id;

    // 2. Moderator rejects with reason
    const rejectRes = await request(app)
      .patch(`/api/admin/suggestions/${sugId}/reject`)
      .send({ reason: 'Podnik neexistuje na uvedené adrese.' });

    expect(rejectRes.status).toBe(200);
    expect(rejectRes.body.success).toBe(true);

    // 3. Verify status and comment
    const sugRow = db.prepare('SELECT status, moderator_comment FROM venue_suggestions WHERE id = ?').get(sugId) as any;
    expect(sugRow.status).toBe('rejected');
    expect(sugRow.moderator_comment).toBe('Podnik neexistuje na uvedené adrese.');
  });

  it('TEST-SUG-06: returns 404 when approving non-existent proposal', async () => {
    const res = await request(app).patch('/api/admin/suggestions/sug_non_existent/approve');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});

