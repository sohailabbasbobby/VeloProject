import { Router } from 'express';
import * as analytics from '../controllers/analytics.controller';

const router = Router();
router.get('/kpis', analytics.operationsKpis);
router.get('/trips', analytics.listTrips);
router.get('/revenue-series', analytics.revenueSeries);
router.get('/drivers/performance', analytics.driverPerformance);
router.get('/fleet/utilization', analytics.fleetUtilization);
router.get('/financial/master-ledger', analytics.masterLedger);
router.get('/financial/vat', analytics.vatReport);
export default router;
