import { Request, Response } from 'express';
import { db } from '../config/db';
import { asyncHandler, badRequest, forbidden } from '../utils/httpError';
import { SettingsService } from '../services/settings.service';
import { MapsService, Coordinate } from '../utils/mapsService';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * QUOTE CONTROLLER (§6 Secure Booking Engine) — live backend quote API.
 * Prices derive from the persisted network floor settings + real Google route
 * metrics. No mock pricing. VAT never appears on customer retail fares (Rule 9).
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;

export const getQuote = asyncHandler(async (req: Request, res: Response) => {
    const { pickupLat, pickupLng, dropoffLat, dropoffLng, tier = 'EXECUTIVE' } = req.body || {};
    if (!pickupLat || !pickupLng || !dropoffLat || !dropoffLng) {
        throw badRequest('pickup and dropoff coordinates are required for a live quote.');
    }

    const metrics = await MapsService.getRouteMetrics(
        { lat: Number(pickupLat), lng: Number(pickupLng) } as Coordinate,
        { lat: Number(dropoffLat), lng: Number(dropoffLng) } as Coordinate
    );

    // Quote = network floor for the tier over this route (retail price, VAT-free per Rule 9)
    const { floor } = await SettingsService.computeFloorPrice(String(tier), metrics.distanceMiles);

    res.json({
        success: true,
        data: {
            tier,
            distanceMiles: metrics.distanceMiles,
            durationMinutes: metrics.estimatedDurationMinutes,
            quote: floor,
            currency: 'GBP',
            note: 'Fixed all-inclusive retail quote. VAT applies only to the platform fee charged to drivers, never to this fare.',
        },
    });
});

export const getVehicleClasses = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    // Real capacity data from the live vehicle database
    const { rows } = await db.query(
        `SELECT tier,
                COUNT(*) AS vehicle_count,
                MIN(passenger_capacity) AS min_capacity,
                MAX(passenger_capacity) AS max_capacity,
                MAX(baggage_capacity) AS max_bags
         FROM vehicles WHERE tenant_id = $1 AND status = 'ACTIVE'
         GROUP BY tier ORDER BY tier`,
        [tenantId]
    );
    const floors = await SettingsService.getNetworkFloors();
    const data = rows.map((r) => ({
        tier: r.tier,
        vehicleCount: Number(r.vehicle_count),
        capacity: { min: Number(r.min_capacity), max: Number(r.max_capacity) },
        maxBags: Number(r.max_bags),
        floorFrom: floors[r.tier]?.base ?? null,
    }));
    res.json({ success: true, data });
});

/** Passenger's own trips (authenticated via Firebase uid → private_clients). */
export const listMyTrips = asyncHandler(async (req: Request, res: Response) => {
    const { clientId } = getAuthContext(req);
    if (!clientId) throw forbidden('Passenger authentication required.');
    const scope = String(req.query.scope || 'all');

    const { rows } = await db.query(
        `SELECT id, task_id, state, channel, custom_price, final_price, tip,
                pickup_address, dropoff_address, scheduled_at, completed_at, created_at,
                distance_miles, duration_minutes, requested_tier, passenger_count
         FROM trips WHERE private_client_id = $1
         ${scope === 'upcoming' ? `AND state NOT IN ('COMPLETED','CANCELLED','EXPIRED')` : ''}
         ORDER BY created_at DESC LIMIT 100`,
        [clientId]
    );
    res.json({ success: true, data: rows });
});
