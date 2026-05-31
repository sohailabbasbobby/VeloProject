import { Router } from 'express';
import { getTenantAnalytics, getPlatformAnalytics, getVehicleProductivity } from '../controllers/analytics.controller';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

/**
 * VELO CORE ROUTE: GET /api/analytics/tenant
 * Returns isolated fleet statistics protected by Row-Level Security.
 */
router.get('/tenant', tenantMiddleware, getTenantAnalytics);

/**
 * VELO CORE ROUTE: GET /api/analytics/platform
 * Returns omnipotent global aggregations protected by master admin-key validation.
 */
router.get('/platform', getPlatformAnalytics);

/**
 * VELO CORE ROUTE: GET /api/analytics/vehicle-productivity/:id
 * Returns Net Yield and financial breakdown for a specific vehicle.
 */
router.get('/vehicle-productivity/:id', getVehicleProductivity);

export default router;
