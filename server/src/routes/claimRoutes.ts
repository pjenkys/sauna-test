import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';
import { validateIco } from '../utils/icoValidator.js';
import { optionalAuth } from '../middleware/authMiddleware.js';

export const claimRouter = Router();
export const adminClaimRouter = Router();

/**
 * POST /api/claims
 * Submits an operator profile claim for a sauna venue with Czech IČO validation.
 */
claimRouter.post('/', optionalAuth, (req: Request, res: Response) => {
  const {
    venue_id,
    business_name,
    ico,
    applicant_name,
    applicant_role,
    business_email,
    phone,
    billing_address,
  } = req.body;

  if (!venue_id || !business_name || !ico) {
    return res.status(400).json({ success: false, error: 'Chybí povinná pole' });
  }

  if (!validateIco(ico)) {
    return res.status(400).json({ success: false, error: 'Neplatné kontrolní číslo IČO' });
  }

  const db = getDb();
  const vId = String(venue_id);

  // Check if venue already has verified partner
  const venue = db
    .prepare(`SELECT is_verified_partner FROM sauna_venues WHERE id = ?`)
    .get(vId) as any;

  if (venue && (venue.is_verified_partner === 1 || venue.is_verified_partner === true)) {
    return res.status(409).json({ success: false, error: 'Tento profil již je ověřeným provozovatelem' });
  }

  // Ensure userId references an existing user in users table for FK constraint
  let userId = req.user?.id;
  if (!userId) {
    const existingUser = db.prepare(`SELECT id FROM users LIMIT 1`).get() as any;
    userId = existingUser ? String(existingUser.id) : 'user_petr_novak';
  }

  const claimId = `claim_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

  db.prepare(`
    INSERT INTO venue_claims (
      id, venue_id, user_id, business_name, ico, applicant_name, applicant_role,
      official_email, official_phone, billing_address, verification_status,
      verification_method, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'corporate_domain_email', CURRENT_TIMESTAMP)
  `).run(
    claimId,
    vId,
    userId,
    String(business_name).trim(),
    String(ico).trim(),
    applicant_name ? String(applicant_name).trim() : '',
    applicant_role ? String(applicant_role).trim() : '',
    business_email ? String(business_email).trim().toLowerCase() : 'operator@sauna.cz',
    phone ? String(phone).trim() : '',
    billing_address ? String(billing_address) : null
  );

  return res.status(201).json({ success: true, claim_id: claimId });
});

/**
 * PATCH /api/admin/claims/:id/verify
 * Approves and verifies operator profile claim, tagging the venue as verified partner
 * without altering or biasing its authentic community rating.
 */
adminClaimRouter.patch('/:id/verify', (req: Request, res: Response) => {
  const id = String(req.params.id);
  const db = getDb();

  const claim = db.prepare(`SELECT * FROM venue_claims WHERE id = ?`).get(id) as any;
  if (!claim) {
    return res.status(404).json({ success: false, error: 'Žádost nenalezena' });
  }

  db.exec('BEGIN TRANSACTION;');
  try {
    db.prepare(`
      UPDATE venue_claims
      SET verification_status = 'approved', verified_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(id);

    db.prepare(`
      UPDATE sauna_venues
      SET is_verified_partner = 1, claimed_by_user_id = ?, claimed_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(String(claim.user_id), String(claim.venue_id));

    // Promote user to partner role if currently regular user
    db.prepare(`
      UPDATE users SET role = 'partner' WHERE id = ? AND role = 'user'
    `).run(String(claim.user_id));

    db.exec('COMMIT;');
    return res.json({ success: true });
  } catch (err: any) {
    db.exec('ROLLBACK;');
    return res.status(500).json({ success: false, error: err.message });
  }
});
