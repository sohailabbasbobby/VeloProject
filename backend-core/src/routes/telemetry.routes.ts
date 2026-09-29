import { Router } from 'express';
import * as telemetry from '../controllers/telemetry.controller';

const router = Router();
router.post('/ping', telemetry.ingestPing);
router.post('/health-signal', telemetry.ingestHealthSignal);
router.get('/live-fleet', telemetry.liveFleet);
router.get('/live-trips', telemetry.liveTrips);
export default router;
