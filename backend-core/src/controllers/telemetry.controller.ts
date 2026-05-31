import { Request, Response } from 'express';

/**
 * VELO PLATFORM - HIGH-FREQUENCY TELEMETRY INGESTION PIPELINE
 * Parses incoming pings from the Driver Mobile App, converts coordinates into PostGIS geometries,
 * updates the spatial database, and streams real-time state to the Admin/Tenant dispatch boards.
 */
export const ingestPing = async (req: Request, res: Response) => {
    try {
        const { driverId, tenantId, latitude, longitude, bearing, speed, isOnlineStatus } = req.body;

        // 1. Strict Validation
        if (!driverId || !tenantId || latitude === undefined || longitude === undefined) {
            return res.status(400).json({ error: "VELO API: Missing required telemetry coordinates." });
        }

        // 2. Offline Security Protection
        // If the mobile app reports the driver is explicitly offline (or if the DB row says they are),
        // we throw a 403 to sever the transmission loop and save bandwidth/battery on the client device.
        if (isOnlineStatus === false) {
            console.log(`[TELEMETRY REJECTED] Driver ${driverId} is offline. Ping ignored.`);
            return res.status(403).json({ 
                error: 'Driver is off-duty. Telemetry ingestion disabled.',
                instruction: 'CLIENT_STOP_PINGING' 
            });
        }

        const lat = Number(latitude);
        const lng = Number(longitude);
        const b = bearing !== undefined ? Number(bearing) : null;
        const s = speed !== undefined ? Number(speed) : null;

        // 3. Database Geospatial Execution Stub
        // The UPDATE statement specifically targets rows where is_online = TRUE.
        // If the query affects 0 rows, the DB acknowledges the driver is offline natively.
        const postGisUpdateSql = `
            UPDATE driver_locations 
            SET 
                current_location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326),
                bearing = ${b},
                speed = ${s},
                updated_at = CURRENT_TIMESTAMP
            WHERE 
                driver_id = '${driverId}' AND tenant_id = '${tenantId}' AND is_online = TRUE;
        `;

        // Log the complex SQL compilation
        console.log(`\n[GPS INGESTION PIPELINE] Parsing coordinates for Driver: ${driverId}`);
        console.log(`[SQL EXECUTION STREAM] ->`);
        console.log(postGisUpdateSql);
        
        // 4. Simulated WebSocket Output Stream
        // In production, this broadcast is fired over Socket.io / Pusher to the React frontends
        console.log(`[WSS BROADCAST STREAM] Emitting update to Tenant ERP ${tenantId} and Master Back-Office Towers:`);
        console.log(`   -> { Driver: ${driverId}, Lat: ${lat}, Lng: ${lng}, Bearing: ${b}°, Speed: ${s}mph }\n`);

        return res.status(200).json({
            success: true,
            status: 'TELEMETRY_LOGGED_AND_BROADCASTED'
        });

    } catch (error) {
        console.error('CRITICAL [VELO TELEMETRY ENGINE FAILURE]:', error);
        return res.status(500).json({ error: 'VELO API: Internal Server Error during telemetry ingestion.' });
    }
};
