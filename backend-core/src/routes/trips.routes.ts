import { Router } from 'express';
import * as trips from '../controllers/trips.controller';
import * as corporate from '../controllers/corporate.controller';
import * as clearing from '../controllers/clearing.controller';
import { listMessages, postMessage } from '../controllers/messaging.controller';
import { getQuote, getVehicleClasses, listMyTrips } from '../controllers/quote.controller';

const router = Router();

// Trips lifecycle
router.get('/', trips.listMyOffers);
router.post('/', trips.createTrip);
router.get('/active', trips.getDriverActiveTrip);
router.post('/:tripId/phases', trips.advanceTripPhase);
router.post('/:tripId/contact', trips.requestMaskedContact);
router.post('/:tripId/cancel-request', trips.requestCancellation);
router.post('/:tripId/cancel-resolve', trips.resolveCancellation);
router.post('/:tripId/ratings', trips.submitTripRating);

// Corporate & private clients (entity-separated, §3.1)
router.get('/corporate', corporate.listCorporateAccounts);
router.get('/corporate/:id', corporate.getCorporateAccount);
router.post('/corporate', corporate.createCorporateAccount);
router.put('/corporate/:id', corporate.updateCorporateAccount);
router.post('/corporate/:id/users', corporate.addAuthorizedUser);
router.delete('/corporate/:id/users/:userId', corporate.removeAuthorizedUser);
router.get('/private-clients', corporate.listPrivateClients);
router.get('/private-clients/:id', corporate.getPrivateClient);
router.post('/private-clients', corporate.createPrivateClient);
router.put('/private-clients/:id', corporate.updatePrivateClient);
router.get('/addresses', corporate.listSavedAddresses);
router.post('/addresses', corporate.createSavedAddress);
router.delete('/addresses/:addressId', corporate.deleteSavedAddress);

// Customer app: live quote engine, real vehicle-class capacity, my trips (§6)
router.post('/quote', getQuote);
router.get('/vehicle-classes', getVehicleClasses);
router.get('/mine', listMyTrips);

// Engagement messaging (driver↔dispatch and client engagement threads)
router.get('/messages', listMessages);
router.post('/messages', postMessage);

// Clearing (fee computation + manual fee configuration per trip, DB-backed)
router.post('/clearing/compute', clearing.computeTripClearing);
router.post('/clearing/fee-config', clearing.setTripFeeConfig);

export default router;
