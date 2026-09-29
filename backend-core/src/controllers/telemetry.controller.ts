import { Request, Response } from 'express';
import { db } from '../config/db';
import { asyncHandler, badRequest } from '../utils/httpError';
import { getAuthContext } from '../middleware/tenant.middleware';

/**
 * TELEMETRY CONTROLLER (§2) — real ingestion of driver GPS pings (PostGIS),
 * app health signals and API latency samples feeding the live map + diagnostics.
 */

export const ingestPing = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    if (!driverId) throw badRequest('Driver authentication required.');
    const { lat, lng, bearing, speed, vehicleTier = 'EXECUTIVE', isOnline = true } = req.body || {};
    if (lat === undefined || lng === undefined) throw badRequest('lat and lng are required.');

    await db.query(
        `INSERT INTO telemetry_events (tenant_id, driver_id, event_type, payload, lat, lng)
         VALUES ($1,$2,'GPS_PING',$3,$4,$5)`,
        [tenantId, driverId, JSON.stringify({ bearing, speed, isOnline }), Number(lat), Number(lng)]
    );

    await db.query(
        `INSERT INTO driver_locations (driver_id, tenant_id, vehicle_tier, is_online, current_location, bearing, speed)
         VALUES ($1,$2,$3,$4, ST_SetSRID(ST_MakePoint($5,$6),4326), $7, $8)
         ON CONFLICT (driver_id) DO UPDATE SET
            vehicle_tier = $3, is_online = $4,
            current_location = ST_SetSRID(ST_MakePoint($5,$6),4326),
            bearing = $7, speed = $8, updated_at = CURRENT_TIMESTAMP`,
        [driverId, tenantId, vehicleTier, Boolean(isOnline), Number(lng), Number(lat), bearing || null, speed || null]
    );

    res.status(201).json({ success: true, data: { ingested: true } });
});

export const ingestHealthSignal = asyncHandler(async (req: Request, res: Response) => {
    const { driverId, tenantId } = getAuthContext(req);
    const { signal, details } = req.body || {};
    if (!signal) throw badRequest('signal is required.');
    await db.query(
        `INSERT INTO telemetry_events (tenant_id, driver_id, event_type, payload)
         VALUES ($1,$2,'APP_HEALTH',$3)`,
        [tenantId || null, driverId || null, JSON.stringify({ signal, details: details || {} })]
    );
    res.status(201).json({ success: true, data: { ingested: true } });
});

/** Live fleet map feed (ERP Operations Hub map modal + LiveFleetMapModal). */
export const liveFleet = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT d.id AS driver_id, d.reference_code, (d.first_name || ' ' || d.last_name) AS driver_name,
                d.status, dl.vehicle_tier, dl.is_online, dl.bearing, dl.speed, dl.updated_at,
                ST_Y(dl.current_location) AS lat, ST_X(dl.current_location) AS lng,
                va_vehicle.reference_code AS vehicle_code, (va_vehicle.make || ' ' || va_vehicle.model) AS vehicle_name
         FROM driver_locations dl
         JOIN drivers d ON d.id = dl.driver_id
         LEFT JOIN vehicle_assignments va ON va.driver_id = d.id AND va.is_primary = TRUE AND va.assigned_to IS NULL
         LEFT JOIN vehicles va_vehicle ON va_vehicle.id = va.vehicle_id
         WHERE dl.tenant_id = $1 AND dl.is_online = TRUE AND dl.current_location IS NOT NULL
         ORDER BY dl.updated_at DESC`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});

/** Recent active trips with coordinates for the live map (Operations Hub). */
export const liveTrips = asyncHandler(async (req: Request, res: Response) => {
    const { tenantId } = getAuthContext(req);
    const { rows } = await db.query(
        `SELECT t.id, t.task_id, t.state, t.pickup_address, t.dropoff_address,
                t.pickup_lat, t.pickup_lng, t.dropoff_lat, t.dropoff_lng,
                (d.first_name || ' ' || d.last_name) AS driver_name
         FROM trips t LEFT JOIN drivers d ON d.id = t.driver_id
         WHERE t.tenant_id = $1 AND t.state IN ('ASSIGNED','DRIVER_EN_ROUTE','ARRIVED','IN_PROGRESS','OFFERING_OWN_FLEET','IN_POOL')
         ORDER BY t.updated_at DESC LIMIT 100`,
        [tenantId]
    );
    res.json({ success: true, data: rows });
});
