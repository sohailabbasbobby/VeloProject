import { Router } from 'express';
import { updateSystemConfig } from '../controllers/system.controller';

const router = Router();

/**
 * VELO CORE ROUTE: POST /api/system/config
 * Allows master administrators to dynamically alter operational physics.
 */
router.post('/config', updateSystemConfig);

export default router;
