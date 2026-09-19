import { Router } from 'express';
import type { Request, Response } from 'express';
import { getDb } from '../db/connection.js';

export const affiliateRouter = Router();

/**
 * GET /api/affiliate-products
 * Retrieves curated affiliate equipment products (sauna hats, oils, kilts, peelings).
 */
affiliateRouter.get('/affiliate-products', (_req: Request, res: Response) => {
  const db = getDb();
  const products = db
    .prepare(`
      SELECT * FROM affiliate_partner_products 
      WHERE is_active = 1 
      ORDER BY display_order ASC
    `)
    .all();

  return res.json({ success: true, data: products });
});

/**
 * POST /api/referrals/click
 * Tracks outbound clicks to venue booking systems and partner affiliate products.
 */
affiliateRouter.post('/referrals/click', (req: Request, res: Response) => {
  const { venue_id, affiliate_product_id, click_type, destination_url, user_agent, referrer } = req.body || {};
  const db = getDb();

  const clickId = `clk_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const ua = user_agent || req.headers['user-agent'] || null;
  const ref = referrer || req.headers.referer || null;

  try {
    db.prepare(`
      INSERT INTO partner_referral_clicks (
        id, venue_id, affiliate_product_id, click_type, destination_url, user_agent, referrer, clicked_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(
      clickId,
      venue_id || null,
      affiliate_product_id || null,
      click_type || 'venue_website',
      destination_url || null,
      ua,
      ref
    );
  } catch {
    // Fail silently on analytics logging
  }

  return res.status(204).send();
});
