import { Router } from 'express';
import { requireAdmin } from '../middleware/tenant.middleware';
import * as analytics from '../controllers/analytics.controller';

/**
 * B2B / Platform-owner routes (backoffice master admin, §4).
 * Admin-key gated. Tenant-scoped pool interactions live under /api/pool.
 */
const router = Router();
router.use(requireAdmin);
router.get('/tenants', analytics.listTenantsAdmin);
router.post('/tenants', analytics.upsertTenantAdmin);
router.get('/pool', analytics.platformPoolOversight);
router.post('/pool/:jobId/override', analytics.overridePoolJob);
router.get('/compliance', analytics.platformCompliance);
router.get('/overview', analytics.platformOverview);
export default router;
