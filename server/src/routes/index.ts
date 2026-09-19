import { Router } from 'express';
import { saunaRouter } from './saunaRoutes.js';
import { authRouter } from './authRoutes.js';
import { reviewRouter } from './reviewRoutes.js';
import { favoriteRouter } from './favoriteRoutes.js';
import { claimRouter, adminClaimRouter } from './claimRoutes.js';
import { suggestionRouter, adminSuggestionRouter } from './suggestionRoutes.js';
import { ceremonyRouter } from './ceremonyRoutes.js';
import { affiliateRouter } from './affiliateRoutes.js';

export * from './saunaRoutes.js';
export * from './authRoutes.js';
export * from './reviewRoutes.js';
export * from './favoriteRoutes.js';
export * from './claimRoutes.js';
export * from './suggestionRoutes.js';
export * from './ceremonyRoutes.js';
export * from './affiliateRoutes.js';

export const apiRouter = Router();

// 1. Saunas & Geolocation
apiRouter.use('/saunas', saunaRouter);

// 2. Authentication & Profile
apiRouter.use('/auth', authRouter);

// 3. Multi-criteria Reviews
apiRouter.use('/reviews', reviewRouter);

// 4. User Personal Lists (Oblíbené, Chci navštívit, Navštíveno)
apiRouter.use('/users/me/lists', favoriteRouter);

// 5. B2B Operator Claims
apiRouter.use('/claims', claimRouter);
apiRouter.use('/admin/claims', adminClaimRouter);

// 6. Community Suggestions & Moderation
apiRouter.use('/suggestions', suggestionRouter);
apiRouter.use('/admin/suggestions', adminSuggestionRouter);

// 7. Ceremonies Calendar
apiRouter.use('/ceremonies', ceremonyRouter);

// 8. Affiliate Partner Products & Outbound Referral Click Tracking
apiRouter.use('/', affiliateRouter);
