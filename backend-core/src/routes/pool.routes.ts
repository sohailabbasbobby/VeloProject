import { Router } from 'express';
import * as pool from '../controllers/pool.controller';

const router = Router();
router.get('/jobs', pool.listPoolJobs);
router.post('/jobs', pool.postJob);
router.get('/jobs/mine', pool.myPoolJobs);
router.post('/jobs/:jobId/counter', pool.submitCounterOffer);
router.post('/jobs/:jobId/resolve', pool.resolveCounterOffer);
router.post('/jobs/:jobId/accept', pool.acceptPoolJob);
router.get('/nearby-drivers', pool.nearbyDrivers);
export default router;
