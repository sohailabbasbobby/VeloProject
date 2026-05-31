import { Router } from 'express';
import { postJob, submitCounterOffer, resolveCounterOffer, getNearbyDrivers } from '../controllers/pool.controller';

const router = Router();

// Route: Post a new job to the network (enforces safety pricing floor)
router.post('/', postJob);

// Route: Fulfiller submits a counter-offer (Triggers 10-minute lock)
router.post('/:jobId/counter', submitCounterOffer);

// Route: Originator resolves the counter (Accepts or Rejects, clearing the lock timer)
router.post('/:jobId/resolve', resolveCounterOffer);

// Route: Mock Endpoint to test PostGIS geospatial driver bounding-box extraction
router.get('/nearby-drivers', getNearbyDrivers);

export default router;
