import { Router } from 'express';
import * as notifications from '../controllers/notification.controller';

const router = Router();
router.get('/', notifications.listNotifications);
router.get('/unread-count', notifications.unreadCount);
router.post('/:id/read', notifications.markRead);
router.post('/read', notifications.markRead);
router.post('/dispatch', notifications.dispatchNotification);
export default router;
