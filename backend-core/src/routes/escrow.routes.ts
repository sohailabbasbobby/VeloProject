import { Router } from 'express';
import * as escrow from '../controllers/escrow.controller';

const router = Router();
router.get('/', escrow.listEscrow);
router.post('/trips/:tripId/capture', escrow.captureEscrow);
router.post('/trips/:tripId/release', escrow.releaseEscrow);
router.post('/trips/:tripId/dispute', escrow.disputeEscrow);
router.post('/trips/:tripId/refund', escrow.refundEscrow);
router.post('/trips/:tripId/arbitrate', escrow.arbitrateEscrow);
router.post('/trips/:tripId/freeze', escrow.freezeEscrow);
export default router;
