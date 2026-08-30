import { Router } from 'express';
import { updateSystemConfig, getMockData } from '../controllers/system.controller';

const router = Router();

/**
 * VELO CORE ROUTE: POST /api/system/config
 * Allows master administrators to dynamically alter operational physics.
 */
router.post('/config', updateSystemConfig);
router.get('/mock-data', getMockData);

export default router;
