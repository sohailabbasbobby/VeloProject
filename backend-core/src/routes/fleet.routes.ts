import { Router } from 'express';
import { logOdometer, reportIssue, resolveIssue, getTenantFleet, logBookingExpense, logGeneralExpense } from '../controllers/fleet.controller';

const router = Router();

router.post('/odometer', logOdometer);
router.post('/issues', reportIssue);
router.post('/issues/:id/resolve', resolveIssue);
router.get('/vehicles', getTenantFleet);
router.post('/booking-expenses', logBookingExpense);
router.post('/general-expenses', logGeneralExpense);

export default router;
