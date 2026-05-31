import { Router } from 'express';
import { processNetworkSettlement, updateGlobalFeeConfig } from '../controllers/clearing.controller';

const router = Router();

/**
 * VELO CORE ROUTE: /api/network-clear/settle
 * Process transaction extractions evaluating strictly in-house vs B2B trade rules.
 */
router.post('/settle', processNetworkSettlement);

/**
 * VELO CORE ROUTE: POST /api/network-clear/config
 * Allows master administrators to dynamically alter fee formats and modes.
 */
router.post('/config', updateGlobalFeeConfig);

export default router;
