import { Router } from 'express';
import { asyncHandler, badRequest } from '../utils/httpError';
import { MapsService } from '../utils/mapsService';

/**
 * MAPS API (self-hosted maps swap) — Google Places (New) autocomplete/details
 * and Directions estimates proxied through OUR backend so the API key never
 * ships inside the mobile apps. All endpoints are FAIL-OPEN: without a key or
 * on any upstream error they return empty/null results so clients fall back
 * to manual entry / honest estimates.
 */
const router = Router();

// GET /api/maps/autocomplete?input=…&sessionToken=…&lat=…&lng=…
router.get('/autocomplete', asyncHandler(async (req, res) => {
    const input = String(req.query.input || '');
    if (input.trim().length < 2) throw badRequest('input (min 2 chars) is required.');
    const lat = req.query.lat ? Number(req.query.lat) : undefined;
    const lng = req.query.lng ? Number(req.query.lng) : undefined;
    const near = Number.isFinite(lat) && Number.isFinite(lng) ? { lat: lat as number, lng: lng as number } : undefined;
    const suggestions = await MapsService.placesAutocomplete(input, req.query.sessionToken ? String(req.query.sessionToken) : undefined, near);
    res.json({ success: true, data: { suggestions, configured: MapsService.isConfigured() } });
}));

// GET /api/maps/places/:placeId?sessionToken=…
router.get('/places/:placeId', asyncHandler(async (req, res) => {
    const details = await MapsService.placesDetails(String(req.params.placeId || ''), req.query.sessionToken ? String(req.query.sessionToken) : undefined);
    if (!details) {
        // Fail-open: client falls back to manual lat/lng entry.
        res.json({ success: true, data: null, configured: MapsService.isConfigured() });
        return;
    }
    res.json({ success: true, data: details });
}));

// GET /api/maps/directions?originLat=…&originLng=…&destLat=…&destLng=…
router.get('/directions', asyncHandler(async (req, res) => {
    const oLat = Number(req.query.originLat), oLng = Number(req.query.originLng);
    const dLat = Number(req.query.destLat), dLng = Number(req.query.destLng);
    if (![oLat, oLng, dLat, dLng].every(Number.isFinite)) {
        throw badRequest('originLat, originLng, destLat, destLng are required numbers.');
    }
    const estimate = await MapsService.directionsRoute({ lat: oLat, lng: oLng }, { lat: dLat, lng: dLng });
    // Fail-open with an honest null: no fabricated distance/duration.
    res.json({ success: true, data: estimate, configured: MapsService.isConfigured() });
}));

export default router;
