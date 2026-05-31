import { Router } from 'express';
import { signupTenant, verifyDocuments } from '../controllers/onboarding.controller';

const router = Router();

router.post('/signup', signupTenant);
router.post('/verify-docs', verifyDocuments);

export default router;
