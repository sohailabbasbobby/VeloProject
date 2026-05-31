import { Router } from 'express';
import { trackFlight, executeCommand, translateMessage } from '../controllers/ai.controller';

const router = Router();

router.post('/track-flight', trackFlight);
router.post('/command', executeCommand);
router.post('/translate', translateMessage);

export default router;
