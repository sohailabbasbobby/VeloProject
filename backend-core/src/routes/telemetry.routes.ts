import { Router } from 'express';
import { ingestPing } from '../controllers/telemetry.controller';

const router = Router();

/**
 * VELO CORE ROUTE: /api/telemetry/ping
 * High-frequency ingestion endpoint for driver GPS arrays.
 */
router.post('/ping', ingestPing);

export default router;
