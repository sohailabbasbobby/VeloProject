import { Router } from 'express';
import { getDetailedHealth } from '../controllers/health.controller';

const router = Router();

router.get('/detailed', getDetailedHealth);

export default router;
