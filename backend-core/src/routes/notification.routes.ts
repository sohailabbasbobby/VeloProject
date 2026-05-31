import { Router } from 'express';
import { testNotificationTrigger } from '../controllers/notification.controller';

const router = Router();

/**
 * VELO CORE ROUTE: /api/notifications/test-trigger
 * Triggers simulated SMS and WhatsApp payloads directly to the terminal.
 */
router.post('/test-trigger', testNotificationTrigger);

export default router;
