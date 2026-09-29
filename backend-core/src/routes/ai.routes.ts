import { Router } from 'express';
import * as ai from '../controllers/ai.controller';

const router = Router();
router.post('/documents/verify', ai.verifyComplianceDocument);
router.get('/documents', ai.listComplianceDocuments);
router.post('/documents/:id/override', ai.overrideDocumentVerification);
export default router;
