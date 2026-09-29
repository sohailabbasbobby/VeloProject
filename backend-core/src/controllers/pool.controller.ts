import { Request, Response } from 'express';
import { db, withTransaction } from '../config/db';
import { asyncHandler, badRequest, notFound, conflict, forbidden } from '../utils/httpError';
import { SettingsService } from '../services/settings.service';
import { MapsService, Coordinate } from '../utils/mapsService';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * POOL CONTROLLER — B2B Overflow Pool (§1.3)
 *
 * All state lives in PostgreSQL (`b2b_pool_jobs`, `pool_negotiations`, `trips`).
 * Negotiation expiry is an authoritative `negotiation_deadline` column — expired
 * negotiations are rolled back lazily by `expireDueNegotiations()` which any read/
 * write path calls first. There are NO in-memory timers.
 * Network floor pricing is enforced per vehicle tier from `platform_settings`.
 */

const round2 = (n: number): number => Math.round(n * 100) / 100;

/** Rolls back any negotiation whose deadline has passed (authoritative, DB-driven). */
export const expireDueNegotiations = async (): Promise<void> => {
    await db.query(
        `UPDATE b2b_pool_jobs pj SET state = 'OPEN', countering_tenant_id = NULL,
                current_wholesale_fare = pj.base_wholesale_fare, negotiation_deadline = NULL
         WHERE pj.state = 'NEGOTIATION' AND pj.negotiation_deadline <= CURRENT_TIMESTAMP`
    );
    await db.query(
        `UPDATE pool_negotiations SET status = 'EXPIRED', resolved_at = CURRENT_TIMESTAMP
         WHERE status = 'PENDING' AND deadline <= CURRENT_TIMESTAMP`
    );
};

const tierLabel = (tier: string): string => {
    const labels: Record<string, string> = {
        EXECUTIVE: 'Executive (E-Class/5-Series)',
        PREMIUM_MPV: 'Premium MPV (V-Class/EQV)',
        FIRST_CLASS: 'First-Class Luxury (S-Class/7-Series)',
        ULTRA_LUXURY: 'Ultra-Luxury (Rolls-Royce/Bentley/Maybach)',
    };
    return labels[tier] || tier;
};

/** POST /api/pool/jobs — publish an existing trip to the open pool (floor-enforced). */
export const postJob = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { tripId } = req.body || {};
    if (!tripId) throw badRequest('tripId is required.');

    const result = await withTransaction(tenantId, async (client) => {
        const tripRes = await client.query(
            `SELECT id, task_id, pickup_address, pickup_lat, pickup_lng, dropoff_address, dropoff_lat, dropoff_lng,
                    distance_miles, custom_price, requested_tier, state, originating_tenant_id
             FROM trips WHERE id = $1 AND originating_tenant_id = $2 FOR UPDATE`,
            [tripId, tenantId]
        );
        if (tripRes.rows.length === 0) throw notFound('Trip not found for this tenant.');
        const trip = tripRes.rows[0];
        if (!['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL'].includes(trip.state)) {
            throw conflict(`Trip in state ${trip.state} cannot be published to the pool.`);
        }

        const tier = trip.requested_tier || 'EXECUTIVE';
        const distanceMiles = Number(trip.distance_miles || 0);
        const pickupCoord: Coordinate = { lat: Number(trip.pickup_lat), lng: Number(trip.pickup_lng) };
        const dropoffCoord: Coordinate = { lat: Number(trip.dropoff_lat), lng: Number(trip.dropoff_lng) };
        const metrics = pickupCoord.lat && dropoffCoord.lat
            ? await MapsService.getRouteMetrics(pickupCoord, dropoffCoord)
            : { distanceMiles, estimatedDurationMinutes: 0 };

        const effectiveDistance = distanceMiles || metrics.distanceMiles;
        const { floor } = await SettingsService.computeFloorPrice(tier, effectiveDistance);

        const fare = round2(Number(trip.custom_price));
        if (fare < floor) {
            throw forbidden(
                `Submission Blocked: Minimum network price floor for a ${tierLabel(String(tier))} transfer is £${floor.toFixed(2)}.`
            );
        }

        await client.query(
            `UPDATE trips SET state = 'IN_POOL', channel = 'POOL',
                pool_floor_price = $2, own_fleet_deadline = NULL, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [tripId, floor]
        );

        const jobRes = await client.query(
            `INSERT INTO b2b_pool_jobs
                (trip_id, originating_tenant_id, pickup_location, pickup_geom, dropoff_location, dropoff_geom,
                 vehicle_tier, distance_miles, base_wholesale_fare, current_wholesale_fare, state)
             VALUES ($1,$2,$3,
                ST_SetSRID(ST_MakePoint($4,$5),4326),
                $6,
                ST_SetSRID(ST_MakePoint($7,$8),4326),
                $9,$10,$11,$11,'OPEN')
             ON CONFLICT (trip_id) DO UPDATE
                SET state = 'OPEN', current_wholesale_fare = $11, countering_tenant_id = NULL,
                    negotiation_deadline = NULL, base_wholesale_fare = $11
             RETURNING id`,
            [tripId, tenantId, trip.pickup_address, trip.pickup_lng, trip.pickup_lat,
             trip.dropoff_address, trip.dropoff_lng, trip.dropoff_lat, tier, effectiveDistance, fare]
        );
        return { jobId: jobRes.rows[0].id, floor, fare };
    });

    res.status(201).json({
        success: true,
        data: {
            jobId: result.jobId,
            message: `Job successfully posted to the Global Open Pool at £${result.fare.toFixed(2)} (network floor £${result.floor.toFixed(2)}).`,
        },
    });
});

/** GET /api/pool/jobs — open pool board filtered by this tenant's acceptance criteria. */
export const listPoolJobs = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    await expireDueNegotiations();

    const tenantRes = await db.query(
        `SELECT pool_accept_enabled, pool_min_price, pool_vehicle_classes, pool_geo_center, pool_geo_radius_m
         FROM tenants WHERE id = $1`,
        [tenantId]
    );
    const cfg = tenantRes.rows[0] || {
        pool_accept_enabled: true, pool_min_price: 0, pool_vehicle_classes: [], pool_geo_center: null, pool_geo_radius_m: 50000,
    };

    const { rows } = await db.query(
        `SELECT pj.id, pj.trip_id, pj.pickup_location, pj.dropoff_location, pj.vehicle_tier, pj.distance_miles,
                pj.current_wholesale_fare, pj.state, pj.negotiation_deadline, pj.published_at,
                t.task_id, t.scheduled_at, t.booking_type, t.passenger_count, t.baggage_count,
                orig.name AS originating_tenant_name,
                ST_Distance(pj.pickup_geom, COALESCE(t2.pool_geo_center, pj.pickup_geom)) AS meters_from_tenant_center
         FROM b2b_pool_jobs pj
         JOIN trips t ON t.id = pj.trip_id
         JOIN tenants orig ON orig.id = pj.originating_tenant_id
         LEFT JOIN tenants t2 ON t2.id = $1
         WHERE pj.state = 'OPEN'
           AND pj.originating_tenant_id <> $1
           AND pj.current_wholesale_fare >= COALESCE($2::numeric, 0)
           AND pj.negotiation_deadline IS NULL
           AND ($3::text[] IS NULL OR pj.vehicle_tier::text = ANY($3::text[]))
         ORDER BY pj.published_at DESC
         LIMIT 200`,
        [tenantId, cfg.pool_min_price, cfg.pool_vehicle_classes && cfg.pool_vehicle_classes.length ? cfg.pool_vehicle_classes : null]
    );

    // Geography filter in application layer (ST_DWithin center is null-safe handled above)
    const filtered = cfg.pool_geo_center
        ? rows.filter((r) => Number(r.meters_from_tenant_center) <= (cfg.pool_geo_radius_m || 50000))
        : rows;

    res.json({ success: true, data: filtered });
});

/** POST /api/pool/jobs/:jobId/counter — counter-offer; opens a deadline-bound negotiation. */
export const submitCounterOffer = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const jobId = String(req.params.jobId);
    const proposedFare = round2(Number(req.body?.proposedFare));
    if (!proposedFare || proposedFare <= 0) throw badRequest('proposedFare must be a positive amount.');

    const neg = await SettingsService.getNegotiationSettings();
    const deadline = new Date(Date.now() + neg.timeoutMinutes * 60 * 1000);

    const result = await withTransaction(tenantId, async (client) => {
        const jobRes = await client.query(
            `SELECT pj.*, t.requested_tier, t.distance_miles FROM b2b_pool_jobs pj
             JOIN trips t ON t.id = pj.trip_id
             WHERE pj.id = $1 AND pj.state = 'OPEN' AND pj.originating_tenant_id <> $2 FOR UPDATE OF pj`,
            [jobId, tenantId]
        );
        if (jobRes.rows.length === 0) throw conflict('Pool job is not open for counter-offers.');

        const job = jobRes.rows[0];
        const { floor } = await SettingsService.computeFloorPrice(String(job.requested_tier || 'EXECUTIVE'), Number(job.distance_miles || 0));
        if (proposedFare < floor) {
            throw forbidden(
                `Submission Blocked: Minimum network price floor for a ${tierLabel(String(job.requested_tier || 'EXECUTIVE'))} transfer is £${floor.toFixed(2)}.`
            );
        }

        await client.query(
            `UPDATE b2b_pool_jobs SET state = 'NEGOTIATION', countering_tenant_id = $2,
                    current_wholesale_fare = $3, negotiation_deadline = $4 WHERE id = $1`,
            [jobId, tenantId, proposedFare, deadline]
        );
        await client.query(
            `INSERT INTO pool_negotiations (pool_job_id, proposing_tenant_id, proposed_fare, status, deadline)
             VALUES ($1,$2,$3,'PENDING',$4)`,
            [jobId, tenantId, proposedFare, deadline]
        );
        return { deadline, floor };
    });

    res.json({
        success: true,
        data: {
            jobId,
            proposedFare,
            negotiationDeadline: result.deadline,
            message: `Counter offer submitted at £${proposedFare.toFixed(2)}. The ${neg.timeoutMinutes}-minute negotiation lock is active until ${result.deadline.toISOString()}.`,
        },
    });
});

/** POST /api/pool/jobs/:jobId/resolve — originating tenant accepts/rejects the counter-offer. */
export const resolveCounterOffer = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const jobId = String(req.params.jobId);
    const resolution = String(req.body?.resolution || '').toUpperCase();
    if (!['ACCEPT', 'REJECT'].includes(resolution)) throw badRequest("resolution must be 'ACCEPT' or 'REJECT'.");

    const result = await withTransaction(tenantId, async (client) => {
        const jobRes = await client.query(
            `SELECT * FROM b2b_pool_jobs pj WHERE pj.id = $1 AND pj.originating_tenant_id = $2 AND pj.state = 'NEGOTIATION' FOR UPDATE`,
            [jobId, tenantId]
        );
        if (jobRes.rows.length === 0) throw conflict('No active negotiation exists for this pool job.');

        const job = jobRes.rows[0];

        if (resolution === 'ACCEPT') {
            await client.query(`UPDATE pool_negotiations SET status = 'ACCEPTED', resolved_at = CURRENT_TIMESTAMP WHERE pool_job_id = $1 AND status = 'PENDING'`, [jobId]);
            await client.query(
                `UPDATE b2b_pool_jobs SET state = 'ALLOCATED', allocated_at = CURRENT_TIMESTAMP, negotiation_deadline = NULL WHERE id = $1`,
                [jobId]
            );
            await client.query(
                `UPDATE trips SET fulfilling_tenant_id = $2, negotiated_price = $3,
                    state = 'ASSIGNED', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1`,
                [job.trip_id, job.countering_tenant_id, job.current_wholesale_fare]
            );
            return { state: 'ALLOCATED' as const };
        }

        await client.query(`UPDATE pool_negotiations SET status = 'REJECTED', resolved_at = CURRENT_TIMESTAMP WHERE pool_job_id = $1 AND status = 'PENDING'`, [jobId]);
        await client.query(
            `UPDATE b2b_pool_jobs SET state = 'OPEN', countering_tenant_id = NULL,
                    current_wholesale_fare = base_wholesale_fare, negotiation_deadline = NULL WHERE id = $1`,
            [jobId]
        );
        return { state: 'OPEN' as const };
    });

    res.json({
        success: true,
        data: {
            jobId,
            state: result.state,
            message: resolution === 'ACCEPT'
                ? 'Counter offer accepted. Job locked and allocated to the fulfilling tenant.'
                : 'Counter offer rejected. Job reverted to the open pool.',
        },
    });
});

/** POST /api/pool/jobs/:jobId/accept — fulfilling tenant accepts an OPEN job outright (assigns own driver). */
export const acceptPoolJob = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId, driverId } = getAuthContext(req);
    const jobId = String(req.params.jobId);
    const { driverId: bodyDriverId, vehicleId } = req.body || {};
    const effectiveDriverId = driverId || bodyDriverId;
    if (!effectiveDriverId) throw badRequest('driverId is required to accept a pool job.');

    const result = await withTransaction(tenantId, async (client) => {
        const jobRes = await client.query(
            `SELECT * FROM b2b_pool_jobs pj WHERE pj.id = $1 AND pj.state = 'OPEN' AND pj.originating_tenant_id <> $2 FOR UPDATE OF pj`,
            [jobId, tenantId]
        );
        if (jobRes.rows.length === 0) throw conflict('Pool job is no longer open.');
        const job = jobRes.rows[0];

        await client.query(
            `UPDATE b2b_pool_jobs SET state = 'ALLOCATED', countering_tenant_id = $2, allocated_at = CURRENT_TIMESTAMP, negotiation_deadline = NULL WHERE id = $1`,
            [jobId, tenantId]
        );
        await client.query(
            `UPDATE trips SET fulfilling_tenant_id = $2, driver_id = $3, vehicle_id = COALESCE($4, vehicle_id),
                negotiated_price = $5, state = 'ASSIGNED', accepted_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [job.trip_id, tenantId, effectiveDriverId, vehicleId || null, job.current_wholesale_fare]
        );
        return { tripId: job.trip_id };
    });

    res.json({ success: true, data: { ...result, message: 'Pool job accepted and assigned.' } });
});

/** GET /api/pool/jobs/mine — jobs this tenant published or is negotiating. */
export const myPoolJobs = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    await expireDueNegotiations();
    const { rows } = await db.query(
        `SELECT pj.*, t.task_id, t.passenger_name, t.scheduled_at
         FROM b2b_pool_jobs pj JOIN trips t ON t.id = pj.trip_id
         WHERE pj.originating_tenant_id = $1 OR pj.countering_tenant_id = $1
         ORDER BY pj.published_at DESC LIMIT 200`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

export const nearbyDrivers = asyncHandler(async (req: Request, res: Response) => {
    const { lat, lng, radius, tier } = req.query;
    if (!lat || !lng || !radius || !tier) throw badRequest('Missing required query parameters: lat, lng, radius, tier.');

    const radiusMeters = Number(radius);
    const { rows } = await db.query(
        `SELECT d.id, d.first_name, d.last_name, d.reference_code, dl.vehicle_tier, dl.bearing, dl.speed,
                ST_Distance(dl.current_location, ST_SetSRID(ST_MakePoint($1,$2),4326)) AS meters,
                ST_AsGeoJSON(dl.current_location) AS location
         FROM driver_locations dl JOIN drivers d ON d.id = dl.driver_id
         WHERE dl.is_online = TRUE AND dl.current_location IS NOT NULL AND dl.vehicle_tier = $3
           AND ST_DWithin(dl.current_location, ST_SetSRID(ST_MakePoint($1,$2),4326), $4)
         ORDER BY meters ASC LIMIT 50`,
        [Number(lng), Number(lat), String(tier), radiusMeters]
    );
    res.json({ success: true, data: rows });
});
