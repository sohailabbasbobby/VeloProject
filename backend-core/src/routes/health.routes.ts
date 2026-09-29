import { Router } from 'express';
import { getHealth, ping } from '../controllers/health.controller';

const router = Router();
router.get('/', ping);
router.get('/full', getHealth);
export default router;
