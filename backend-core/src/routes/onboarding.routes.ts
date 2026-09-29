import { Router } from 'express';
import * as onboarding from '../controllers/onboarding.controller';

const router = Router();
router.get('/drivers', onboarding.listDrivers);
router.get('/drivers/:id', onboarding.getDriver);
router.post('/drivers', onboarding.createDriver);
router.put('/drivers/:id', onboarding.updateDriver);
router.delete('/drivers/:id', onboarding.deactivateDriver);
router.post('/drivers/:id/memberships', onboarding.addDriverMembership);
router.get('/my/operators', onboarding.getMyOperators);
router.get('/my/roster', onboarding.getMyRoster);
router.post('/gatekeeper', onboarding.submitGatekeeperCheck);
router.post('/go-offline', onboarding.goOffline);
export default router;
