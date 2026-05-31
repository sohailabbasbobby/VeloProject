import { Router } from 'express';
import { generatePayrollSummary } from '../controllers/payroll.controller';
import { tenantMiddleware } from '../middleware/tenant.middleware';

const router = Router();

/**
 * VELO CORE ROUTE: GET /api/payroll/summary
 * Protected by Row-Level Security Middleware. Aggregates multi-tenant payroll data.
 */
router.get('/summary', tenantMiddleware, generatePayrollSummary);

export default router;
