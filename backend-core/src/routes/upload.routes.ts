import { Router } from 'express';
import { uploadReceipt } from '../controllers/upload.controller';

const router = Router();

/**
 * VELO CORE ROUTE: POST /api/fleet/upload-receipt
 * Processes secure image transmission for financial outlays.
 */
router.post('/upload-receipt', uploadReceipt);

export default router;
