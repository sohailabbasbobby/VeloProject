import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, conflict, forbidden } from '../utils/httpError';
import { SettingsService } from '../services/settings.service';
import { MapsService, Coordinate } from '../utils/mapsService';
import { VeloClearingEngine } from '../services/veloClearingEngine';
import { TwilioProxyService } from '../services/twilio.service';
import { NotificationService } from '../utils/notificationService';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * TRIPS CONTROLLER — booking lifecycle: creation with fully custom per-trip pricing
 * (§1.2), own-fleet-first dispatch (§1.3), driver acceptance with conflict detection,
 * phase progression, completion (escrow release + clearing + ledger), cancellation with
 * admin approval gate, masked Twilio contact and ratings (Ghost Fulfilment privacy).
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;

const genTaskId = (): string => {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let s = '';
    for (let i = 0; i < 6; i++) s += alphabet[Math.floor(Math.random() * alphabet.length)];
    return `VLT-${s}`;
};

const haversineMiles = (a: { lat: number; lng: number }, b: { lat: number; lng: number }): number => {
    const R = 3958.8;
    const dLat = ((b.lat - a.lat) * Math.PI) / 180;
    const dLng = ((b.lng - a.lng) * Math.PI) / 180;
    const s = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
    return round2(2 * R * Math.asin(Math.sqrt(s)));
};

/** DETECTS driver schedule conflicts between an incoming offer and an accepted trip (§1.3). */
const detectConflict = async (driverId: string, incomingTrip: any): Promise<{ conflict: boolean; existing?: any; etaDeltaMinutes?: number; locationDeltaMiles?: number }> => {
    const activeRes = await db.query(
        `SELECT id, task_id, pickup_address, pickup_lat, pickup_lng, scheduled_at, state
         FROM trips WHERE driver_id = $1 AND state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS')
         ORDER BY COALESCE(scheduled_at, accepted_at) ASC`,
        [driverId]
    );
    for (const existing of activeRes.rows) {
        const existingStart = existing.scheduled_at ? new Date(existing.scheduled_at) : new Date();
        const incomingStart = incomingTrip.scheduled_at ? new Date(incomingTrip.scheduled_at) : new Date();
        const etaDeltaMinutes = Math.abs((existingStart.getTime() - incomingStart.getTime()) / 60000);
        const locationDeltaMiles = haversineMiles(
            { lat: Number(existing.dropoff_lat || 0), lng: Number(existing.dropoff_lng || 0) },
            { lat: Number(incomingTrip.pickup_lat || 0), lng: Number(incomingTrip.pickup_lng || 0) }
        );
        // Conflict: overlapping time window AND geographically incompatible handoff (>15 mi in <=60 min)
        if (etaDeltaMinutes <= 60 && locationDeltaMiles > 15) {
            return { conflict: true, existing, etaDeltaMinutes: Math.round(etaDeltaMinutes), locationDeltaMiles };
        }
    }
    return { conflict: false };
};

/** Kicks off own-fleet-first dispatch: offers the job to the originating tenant's online drivers. */
const startOwnFleetOffering = async (client: any, trip: any): Promise<void> => {
    const dispatch = await SettingsService.getDispatchSettings();
    const timeoutMs = trip.booking_type === 'SCHEDULED'
        ? dispatch.ownFleetScheduledTimeoutMinutes * 60 * 1000
        : dispatch.ownFleetAsapTimeoutSeconds * 1000;
    const expiresAt = new Date(Date.now() + timeoutMs);

    const centerLng = trip.pickup_lng ?? 0;
    const centerLat = trip.pickup_lat ?? 0;
    const tier = trip.requested_tier || 'EXECUTIVE';

    const candidateRes = await client.query(
        `SELECT d.id FROM driver_locations dl
         JOIN drivers d ON d.id = dl.driver_id
         JOIN driver_operator_memberships m ON m.driver_id = d.id AND m.tenant_id = $1 AND m.status = 'ACTIVE'
         WHERE dl.is_online = TRUE AND dl.vehicle_tier = $2 AND dl.current_location IS NOT NULL
           AND ST_DWithin(dl.current_location, ST_SetSRID(ST_MakePoint($3,$4),4326), $5)
         ORDER BY dl.current_location <-> ST_SetSRID(ST_MakePoint($3,$4),4326)
         LIMIT 10`,
        [trip.tenant_id, tier, centerLng, centerLat, dispatch.nearbyDriverRadiusMeters]
    );

    for (const row of candidateRes.rows) {
        await client.query(
            `INSERT INTO trip_offers (trip_id, driver_id, tenant_id, expires_at) VALUES ($1,$2,$3,$4)`,
            [trip.id, row.id, trip.tenant_id, expiresAt]
        );
        NotificationService.notifyDriverTripOffer(trip.tenant_id, row.id, trip.task_id, trip.pickup_address, expiresAt)
            .catch(() => undefined);
    }

    await client.query(
        `UPDATE trips SET state = 'OFFERING_OWN_FLEET', own_fleet_deadline = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [trip.id, expiresAt]
    );
};

/** Rolls back expired own-fleet windows and auto-escalates originating-tenant-opted jobs to the pool. */
export const processDispatchTimeouts = async (): Promise<void> => {
    const expired = await db.query(
        `UPDATE trips SET state = 'PENDING_DISPATCH', own_fleet_deadline = NULL, updated_at = CURRENT_TIMESTAMP
         WHERE state = 'OFFERING_OWN_FLEET' AND own_fleet_deadline <= CURRENT_TIMESTAMP
         RETURNING id, task_id, tenant_id, channel, auto_pool_enabled`
    );
    for (const trip of expired.rows) {
        await db.query(`UPDATE trip_offers SET response = 'EXPIRED' WHERE trip_id = $1 AND response = 'PENDING'`, [trip.id]);
        if (trip.auto_pool_enabled) {
            try {
                await publishTripToPool(trip.id, trip.tenant_id);
            } catch (err) {
                console.error(`[DISPATCH] Auto-pool escalation failed for ${trip.task_id}:`, (err as Error).message);
            }
        }
    }
};

/** Publishes a trip to the B2B pool (delegates floor validation to pool controller logic). */
import { postJob as poolPostJob } from './pool.controller';
const publishTripToPool = async (tripId: string, tenantId: string): Promise<void> => {
    // Internal path: replicate postJob's validation directly against the DB.
    const { rows } = await db.query(
        `SELECT id, task_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng,
                distance_miles, custom_price, requested_tier, state
         FROM trips WHERE id = $1 AND originating_tenant_id = $2`,
        [tripId, tenantId]
    );
    if (rows.length === 0) return;
    const trip = rows[0];
    const tier = trip.requested_tier || 'EXECUTIVE';
    const distanceMiles = Number(trip.distance_miles || 0);
    const { floor } = await SettingsService.computeFloorPrice(String(tier), distanceMiles);
    if (Number(trip.custom_price) < floor) return; // below floor: stays with originating tenant

    await withTransaction(tenantId, async (client) => {
        await client.query(
            `UPDATE trips SET state = 'IN_POOL', channel = 'POOL', pool_floor_price = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [tripId, floor]
        );
        await client.query(
            `INSERT INTO b2b_pool_jobs
                (trip_id, originating_tenant_id, pickup_location, pickup_geom, dropoff_location, dropoff_geom,
                 vehicle_tier, distance_miles, base_wholesale_fare, current_wholesale_fare, state)
             VALUES ($1,$2,$3, ST_SetSRID(ST_MakePoint($4,$5),4326), $6, ST_SetSRID(ST_MakePoint($7,$8),4326),
                     $9,$10,$11,$11,'OPEN')
             ON CONFLICT (trip_id) DO UPDATE SET state = 'OPEN', current_wholesale_fare = $11,
                base_wholesale_fare = $11, countering_tenant_id = NULL, negotiation_deadline = NULL`,
            [tripId, tenantId, trip.pickup_address, trip.pickup_lng, trip.pickup_lat,
             trip.dropoff_address, trip.dropoff_lng, trip.dropoff_lat, tier, distanceMiles, round2(Number(trip.custom_price))]
        );
    });
};

// ------------------------------------------------------------------------------------
// BOOKING CREATION
// ------------------------------------------------------------------------------------
export const createTrip = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, clientId, driverId } = getAuthContext(req);
    if (!tenantId) throw forbidden('Tenant context required.');
    const {
        pickupAddress, pickupLat, pickupLng, dropoffAddress, dropoffLat, dropoffLng,
        customPrice, bookingType = 'ASAP', scheduledAt, passengerName, passengerPhone,
        passengerCount = 1, baggageCount = 0, requestedTier = 'EXECUTIVE',
        privateClientId, corporateAccountId, corporateBookerName, notes, autoPoolEnabled = true,
    } = req.body || {};

    if (!pickupAddress || !dropoffAddress) throw badRequest('Pickup and dropoff addresses are required.');
    const price = Number(customPrice);
    if (!price || price <= 0) throw badRequest('A custom price for this trip must be entered by the back-office admin (§1.2 — no flat fee schedule exists).');
    if (!passengerName) throw badRequest('Passenger name is required.');
    if (passengerCount < 1) throw badRequest('At least one passenger is required.');
    if (bookingType === 'SCHEDULED' && !scheduledAt) throw badRequest('scheduledAt is required for scheduled bookings.');

    // Real capacity validation against the vehicle database
    const capRes = await db.query(
        `SELECT MIN(passenger_capacity) AS min_pax, MIN(baggage_capacity) AS min_bags
         FROM vehicles WHERE tenant_id = $1 AND tier = $2 AND status = 'ACTIVE'`,
        [tenantId, requestedTier]
    );
    const cap = capRes.rows[0];
    if (cap && cap.min_pax !== null && Number(cap.min_pax) < passengerCount) {
        throw badRequest(`Vehicle class ${requestedTier} supports at most ${cap.min_pax} passengers per vehicle. Reduce passenger count or upgrade the class.`);
    }
    if (cap && cap.min_bags !== null && Number(cap.min_bags) < baggageCount) {
        throw badRequest(`Vehicle class ${requestedTier} supports at most ${cap.min_bags} bags. Reduce baggage or upgrade the class.`);
    }

    // Route metrics from the live Google Routes API (distance drives floor pricing)
    let distanceMiles: number | null = null;
    let durationMinutes: number | null = null;
    if (pickupLat && pickupLng && dropoffLat && dropoffLng) {
        try {
            const metrics = await MapsService.getRouteMetrics(
                { lat: Number(pickupLat), lng: Number(pickupLng) } as Coordinate,
                { lat: Number(dropoffLat), lng: Number(dropoffLng) } as Coordinate
            );
            distanceMiles = metrics.distanceMiles;
            durationMinutes = metrics.estimatedDurationMinutes;
        } catch (err) {
            throw conflict(`Route evaluation failed: ${(err as Error).message}`);
        }
    }

    const escrow = await import('../controllers/escrow.controller');

    const trip = await withTransaction(tenantId, async (client) => {
        const tenantRes = await client.query('SELECT id, name FROM tenants WHERE id = $1', [tenantId]);
        const tenant = tenantRes.rows[0];

        const tripRes = await client.query(
            `INSERT INTO trips
                (task_id, tenant_id, originating_tenant_id, state, custom_price,
                 pickup_address, pickup_lat, pickup_lng, pickup_geom,
                 dropoff_address, dropoff_lat, dropoff_lng, dropoff_geom,
                 distance_miles, duration_minutes, booking_type, scheduled_at,
                 passenger_name, passenger_phone, passenger_count, baggage_count, requested_tier,
                 private_client_id, corporate_account_id, corporate_booker_name,
                 originating_tenant_name, originating_tenant_logo_url, notes, auto_pool_enabled)
             VALUES ($1,$2,$2,'PENDING_DISPATCH',$3,
                     $4,$5,$6, ST_SetSRID(ST_MakePoint($6,$5),4326),
                     $7,$8,$9, ST_SetSRID(ST_MakePoint($9,$8),4326),
                     $10,$11,$12,$13,
                     $14,$15,$16,$17,$18,
                     $19,$20,$21,
                     $22, (SELECT logo_url FROM white_label_configs WHERE tenant_id = $2), $23, $24)
             RETURNING *`,
            [genTaskId(), tenantId, price,
             pickupAddress, pickupLat || null, pickupLng || null,
             dropoffAddress, dropoffLat || null, dropoffLng || null,
             distanceMiles, durationMinutes, bookingType,
             bookingType === 'SCHEDULED' ? new Date(scheduledAt) : null,
             passengerName, passengerPhone || null, passengerCount, baggageCount, requestedTier,
             clientId || privateClientId || null, corporateAccountId || null, corporateBookerName || null,
             tenant.name, notes || null, Boolean(autoPoolEnabled)]
        );
        const tripRow = tripRes.rows[0];

        // Escrow capture at booking time (§1.3)
        await escrow.createEscrowForTrip(client, tripRow.id, tenantId, price);

        await startOwnFleetOffering(client, tripRow);
        return tripRow;
    });

    res.status(201).json({ success: true, data: trip });
});

// ------------------------------------------------------------------------------------
// DRIVER OFFERS / ACCEPTANCE (multi-tenant conflict engine)
// ------------------------------------------------------------------------------------
export const listMyOffers = asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    await processDispatchTimeouts();

    const { rows } = await db.query(
        `SELECT o.id AS offer_id, o.expires_at, t.*, orig.name AS originating_tenant_name,
                t.originating_tenant_logo_url AS operator_logo
         FROM trip_offers o
         JOIN trips t ON t.id = o.trip_id
         LEFT JOIN tenants orig ON orig.id = t.originating_tenant_id
         WHERE o.driver_id = $1 AND o.response = 'PENDING' AND o.expires_at > CURRENT_TIMESTAMP
         ORDER BY o.offered_at DESC`,
        [driverId]
    );

    // Conflict engine evaluation for each incoming offer (§1.3)
    const enriched = [];
    for (const offer of rows) {
        const conflictResult = await detectConflict(driverId, offer);
        enriched.push({
            ...offer,
            scheduleConflict: conflictResult.conflict,
            conflictWith: conflictResult.conflict ? conflictResult.existing : null,
            etaDeltaMinutes: conflictResult.etaDeltaMinutes,
            locationDeltaMiles: conflictResult.locationDeltaMiles,
        });
    }
    res.json({ success: true, data: enriched });
});

/** Driver accepts an offer. If a conflict exists the driver must choose; the forfeited trip auto-releases. */
export const respondToOffer = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    const offerId = String(req.params.offerId);
    const { action = 'ACCEPT', forfeitTripId, acknowledgeConflict = false } = req.body || {};

    const result = await withTransaction(tenantId, async (client) => {
        const offerRes = await client.query(
            `SELECT o.*, t.task_id, t.id AS trip_id FROM trip_offers o JOIN trips t ON t.id = o.trip_id
             WHERE o.id = $1 AND o.driver_id = $2 AND o.response = 'PENDING' FOR UPDATE OF o`,
            [offerId, driverId]
        );
        if (offerRes.rows.length === 0) throw conflict('Offer is no longer pending.');
        const offer = offerRes.rows[0];

        if (action === 'DECLINE') {
            await client.query(`UPDATE trip_offers SET response = 'DECLINED', responded_at = CURRENT_TIMESTAMP WHERE id = $1`, [offer.id]);
            return { status: 'DECLINED' };
        }

        // Conflict resolution: driver explicitly forfeits the other trip
        if (forfeitTripId) {
            await client.query(
                `UPDATE trips SET state = 'PENDING_DISPATCH', driver_id = NULL, vehicle_id = NULL, accepted_at = NULL,
                    conflict_acknowledged = TRUE, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND driver_id = $2 AND state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED')`,
                [forfeitTripId, driverId]
            );
            await client.query(
                `INSERT INTO schedule_conflicts (driver_id, trip_a_id, trip_b_id, status, resolved_at, forfeited_trip_id)
                 VALUES ($1,$2,$3,'RESOLVED_KEEP_B',CURRENT_TIMESTAMP,$4)`,
                [driverId, offer.trip_id, forfeitTripId, forfeitTripId]
            );
        }

        const vehicleRes = await client.query(
            `SELECT va.vehicle_id FROM vehicle_assignments va
             WHERE va.driver_id = $1 AND va.tenant_id = $2 AND va.is_primary = TRUE LIMIT 1`,
            [driverId, offer.tenant_id]
        );

        await client.query(
            `UPDATE trip_offers SET response = 'ACCEPTED', responded_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [offer.id]
        );
        await client.query(
            `UPDATE trips SET state = 'ASSIGNED', driver_id = $2, vehicle_id = COALESCE($3, vehicle_id),
                accepted_at = CURRENT_TIMESTAMP, own_fleet_deadline = NULL,
                conflict_acknowledged = $4, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [offer.trip_id, driverId, vehicleRes.rows[0]?.vehicle_id || null, Boolean(acknowledgeConflict)]
        );
        // Withdraw from pool if mirrored there
        await client.query(`UPDATE b2b_pool_jobs SET state = 'ALLOCATED', allocated_at = CURRENT_TIMESTAMP WHERE trip_id = $1 AND state IN ('OPEN','NEGOTIATION')`, [offer.trip_id]);
        return { status: 'ACCEPTED', tripId: offer.trip_id };
    });

    res.json({ success: true, data: result });
});

// ------------------------------------------------------------------------------------
// ACTIVE TRIP PROGRESSION (phases + Twilio masking)
// ------------------------------------------------------------------------------------
export const getDriverActiveTrip = asyncHandler(async (req: Request, res: Response) => {
    const { driverId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');

    const { rows } = await db.query(
        `SELECT t.*, pc.driver_proxy_number, pc.passenger_proxy_number,
                v.make || ' ' || v.model AS vehicle_name, v.plate_number
         FROM trips t
         LEFT JOIN proxy_contacts pc ON pc.trip_id = t.id
         LEFT JOIN vehicles v ON v.id = t.vehicle_id
         WHERE t.driver_id = $1 AND t.state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS')
         ORDER BY t.accepted_at DESC LIMIT 1`,
        [driverId]
    );
    if (rows.length === 0) return res.json({ success: true, data: null });
    res.json({ success: true, data: rows[0] });
});

export const advanceTripPhase = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    if (!driverId) throw forbidden('Driver authentication required.');
    const tripId = String(req.params.tripId);
    const { phase } = req.body || {}; // 'ARRIVED' | 'START' | 'COMPLETE'

    const transitions: Record<string, { from: string[]; to: string; tsCol: string }> = {
        ARRIVED: { from: ['ASSIGNED', 'DRIVER_EN_ROUTE'], to: 'ARRIVED', tsCol: 'accepted_at' },
        START: { from: ['ARRIVED'], to: 'IN_PROGRESS', tsCol: 'started_at' },
        COMPLETE: { from: ['IN_PROGRESS'], to: 'COMPLETED', tsCol: 'completed_at' },
    };
    const t = transitions[String(phase).toUpperCase()];
    if (!t) throw badRequest("phase must be 'ARRIVED', 'START' or 'COMPLETE'.");

    const { odometer } = req.body || {};
    const updated = await withTransaction(tenantId, async (client) => {
        const res2 = await client.query(
            `UPDATE trips SET state = '${t.to}', ${t.to === 'COMPLETED' ? 'completed_at' : t.to === 'IN_PROGRESS' ? 'started_at' : 'accepted_at'} =
                CASE WHEN $2::text = 'ARRIVED' AND accepted_at IS NULL THEN CURRENT_TIMESTAMP ELSE COALESCE(${t.tsCol}, CURRENT_TIMESTAMP) END,
                odometer_end = COALESCE($3, odometer_end), updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND driver_id = $4 AND state = ANY($5) RETURNING *`,
            [tripId, String(phase).toUpperCase(), odometer ? Number(odometer) : null, driverId, t.from]
        );
        if (res2.rows.length === 0) throw conflict(`Trip cannot transition to ${t.to} from its current state.`);
        return res2.rows[0];
    });

    if (String(phase).toUpperCase() === 'COMPLETE') {
        await completeTripSettlement(tripId);
    }
    res.json({ success: true, data: updated });
});

/** Completion settlement: clearing + ledger + escrow release in one path. */
const completeTripSettlement = async (tripId: string): Promise<void> => {
    const tripRes = await db.query(
        `SELECT id, custom_price, final_price, platform_fee_net, tip, originating_tenant_id, fulfilling_tenant_id, driver_id, state
         FROM trips WHERE id = $1`,
        [tripId]
    );
    if (tripRes.rows.length === 0) return;
    const trip = tripRes.rows[0];

    const settlement = await VeloClearingEngine.settleTrip({
        bookingId: tripId,
        originatingTenantId: trip.originating_tenant_id,
        fulfillingTenantId: trip.fulfilling_tenant_id,
        customPrice: Number(trip.final_price || trip.custom_price),
        customPlatformFeeNet: Number(trip.platform_fee_net),
        tip: Number(trip.tip || 0),
    });

    await withTransaction(trip.originating_tenant_id, async (client) => {
        await client.query(
            `UPDATE trips SET driver_earnings = $2, final_price = COALESCE(final_price, $3), updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [tripId, settlement.driverEarnings, settlement.wholesaleFare]
        );
        for (const entry of settlement.driverLedgerEntries) {
            await client.query(
                `INSERT INTO driver_ledgers (driver_id, tenant_id, trip_id, entry_type, direction, amount, description)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)
                 ON CONFLICT DO NOTHING`,
                [trip.driver_id, trip.originating_tenant_id, tripId, entry.entryType, entry.direction, entry.amount, entry.description]
            );
        }
        if (settlement.isNetworkTrade) {
            await client.query(
                `INSERT INTO network_clearing_ledger
                 (booking_id, originating_tenant_id, fulfilling_tenant_id, wholesale_fare,
                  fulfiller_fee_net, fulfiller_fee_vat, fulfiller_fee_gross, finder_margin_net)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
                [tripId, trip.originating_tenant_id, trip.fulfilling_tenant_id, settlement.wholesaleFare,
                 settlement.platformFeeNet, settlement.platformFeeVat, settlement.platformFeeGross, settlement.finderMarginNet]
            );
        }
    });

    // Release escrow via the escrow controller's release path
    try {
        const escrow = await import('../controllers/escrow.controller');
        const fakeReq = { params: { tripId }, headers: { 'x-tenant-id': trip.originating_tenant_id } } as any;
        const fakeRes = { json: () => undefined, status: () => fakeRes } as any;
        await escrow.releaseEscrow(fakeReq, fakeRes, () => undefined);
    } catch (err) {
        console.error(`[SETTLEMENT] Escrow release failed for ${tripId}:`, (err as Error).message);
    }
};

// ------------------------------------------------------------------------------------
// PASSENGER-GRACE NO-SHOW + MASKED CONTACT + CANCELLATION + RATINGS
// ------------------------------------------------------------------------------------
export const requestMaskedContact = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    const tripId = String(req.params.tripId);
    if (!driverId) throw forbidden('Driver authentication required.');

    const tripRes = await db.query(
        `SELECT t.*, d.phone AS driver_phone FROM trips t
         JOIN drivers d ON d.id = t.driver_id
         WHERE t.id = $1 AND t.driver_id = $2`,
        [tripId, driverId]
    );
    if (tripRes.rows.length === 0) throw notFound('Trip not found.');
    const trip = tripRes.rows[0];

    // Raw numbers are never returned — only proxy numbers (Ghost Fulfilment §1.3)
    const proxy = await TwilioProxyService.createProxySession(tripId, trip.driver_phone, trip.passenger_phone);
    await db.query(
        `INSERT INTO proxy_contacts (trip_id, twilio_proxy_service_sid, driver_proxy_number, passenger_proxy_number, expires_at)
         VALUES ($1,$2,$3,$4, CURRENT_TIMESTAMP + INTERVAL '24 hours')`,
        [tripId, proxy.serviceSid, proxy.driverProxyNumber, proxy.passengerProxyNumber]
    );
    res.json({ success: true, data: { callNow: proxy.passengerProxyNumber, message: 'Dial the proxy number to reach the passenger. The real number is never shared.' } });
});

export const requestCancellation = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    const tripId = String(req.params.tripId);
    const { reason } = req.body || {};
    if (!reason) throw badRequest('A cancellation reason category is required.');

    // Emergency cancellations are admin-approval-gated — no mock delays (§5)
    await db.query(
        `UPDATE trips SET cancellation_reason = $2, cancellation_approver = 'PENDING', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND driver_id = $3 AND state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS')`,
        [tripId, String(reason), driverId]
    );
    NotificationService.dispatch({
        recipientType: 'TENANT_ADMIN', recipientId: null, tenantId: tenantId!,
        title: 'Cancellation Approval Required',
        body: `Driver requested cancellation of trip ${tripId}: ${reason}`,
        channels: ['IN_APP'],
        metadata: { type: 'CANCELLATION_REQUEST', tripId },
    }).catch(() => undefined);
    res.json({ success: true, data: { tripId, approval: 'PENDING' } });
});

export const resolveCancellation = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const tripId = String(req.params.tripId);
    const { approved } = req.body || {};
    if (typeof approved !== 'boolean') throw badRequest('approved (boolean) is required.');

    if (!approved) {
        await db.query(
            `UPDATE trips SET cancellation_approver = 'ADMIN_REJECTED', cancellation_reason = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND cancellation_approver = 'PENDING'`,
            [tripId]
        );
        return res.json({ success: true, data: { tripId, approval: 'ADMIN_REJECTED' } });
    }

    await withTransaction(tenantId!, async (client) => {
        await client.query(
            `UPDATE trips SET state = 'CANCELLED', cancelled_at = CURRENT_TIMESTAMP, cancellation_approver = 'ADMIN_APPROVED', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND cancellation_approver = 'PENDING'`,
            [tripId]
        );
        // Refund escrow
        await client.query(
            `UPDATE escrow_vault SET state = 'REFUNDED', updated_at = CURRENT_TIMESTAMP WHERE booking_id = $1 AND state = 'HELD'`,
            [tripId]
        );
    });
    res.json({ success: true, data: { tripId, approval: 'ADMIN_APPROVED' } });
});

export const submitTripRating = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId, clientId } = getAuthContext(req);
    const tripId = String(req.params.tripId);
    const { stars, feedback, raterType = 'PASSENGER' } = req.body || {};
    if (!stars || stars < 1 || stars > 5) throw badRequest('stars must be 1–5.');

    // Pool-fulfilled job ratings are private to the two tenants (visibility TENANTS_ONLY, §1.3)
    const tripRes = await db.query(`SELECT channel, fulfilling_tenant_id, originating_tenant_id FROM trips WHERE id = $1`, [tripId]);
    if (tripRes.rows.length === 0) throw notFound('Trip not found.');
    const isPoolJob = tripRes.rows[0].channel === 'POOL';

    const visibility = isPoolJob ? 'TENANTS_ONLY' : (raterType === 'DRIVER' ? 'TENANTS_ONLY' : 'PASSENGER_TRIP');
    await db.query(
        `INSERT INTO trip_ratings (trip_id, rater_type, stars, feedback, visibility) VALUES ($1,$2,$3,$4,$5)`,
        [tripId, raterType, stars, feedback || null, visibility]
    );

    if (raterType === 'PASSENGER' && driverId) {
        await db.query(
            `UPDATE drivers SET average_rating = ROUND(((average_rating * jobs_completed) + $2) / (jobs_completed + 1), 2),
                    jobs_completed = jobs_completed + 1
             WHERE id = $1`,
            [driverId, stars]
        );
    }
    res.json({ success: true, data: { tripId, visibility } });
});
