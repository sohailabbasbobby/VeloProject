import { Router } from 'express';
import { processSplitSettlement, freezeEscrow } from '../controllers/escrow.controller';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

/**
 * VELO CORE ROUTE: /api/escrow/settle
 * Process B2B cross-tenant splits extracting exactly £1.00 from both sides.
 * This route requires standard tenant RLS validation.
 */
router.post('/settle', tenantMiddleware, processSplitSettlement);

/**
 * VELO CORE ROUTE: /api/escrow/freeze
 * Administrative endpoint used exclusively by the Back-Office Tower to trigger a database-level Row Lock on a payout.
 * Bypasses standard tenant middleware, utilizing custom admin headers inside the controller.
 */
router.post('/freeze', freezeEscrow);

export default router;
