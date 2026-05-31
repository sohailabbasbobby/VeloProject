/**
 * VELO PLATFORM - REAL-TIME PROXIMITY MAPPING ENGINE
 * Manages geospatial queries and distance matrix calculations via PostGIS.
 */

export interface Coordinate {
    lat: number;
    lng: number;
}

export interface RouteMetrics {
    distanceMiles: number;
    estimatedDurationMinutes: number;
}

export class MapsService {

    /**
     * Executes an asynchronous server-side routing evaluation.
     * MOCKED for scaffolding: In production, this pings Google Routes API or OSRM.
     * For now, it calculates a simulated distance using a basic euclidean math mock.
     */
    public static async getRouteMetrics(pickup: Coordinate, dropoff: Coordinate): Promise<RouteMetrics> {
        console.log(`[MAPS SERVICE] Calculating exact route metrics from [${pickup.lat}, ${pickup.lng}] to [${dropoff.lat}, ${dropoff.lng}]`);
        
        // Mock Math Simulation: 
        // A very rough simulation generating ~15-30 miles based on coordinates difference for testing logic.
        const latDiff = Math.abs(pickup.lat - dropoff.lat);
        const lngDiff = Math.abs(pickup.lng - dropoff.lng);
        const roughDistanceMiles = Math.max(10, (latDiff + lngDiff) * 60); // Ensures at least a 10-mile mock
        
        // Mock Duration: Assuming roughly 2 minutes per mile in city traffic
        const roughDuration = roughDistanceMiles * 2.0;

        return {
            distanceMiles: Number(roughDistanceMiles.toFixed(1)),
            estimatedDurationMinutes: Number(roughDuration.toFixed(0))
        };
    }

    /**
     * Constructs the exact raw PostGIS spatial query required to fetch and sort online drivers.
     * Utilizes ST_DWithin for the performant bounding-box radius filter, 
     * and ST_Distance to mathematically sort the array closest-to-furthest.
     * 
     * Note: SRID 4326 uses meters for calculations when cast to geography.
     */
    public static getClosestOnlineDrivers(pickup: Coordinate, maxRadiusMiles: number, vehicleTier: string): string {
        const radiusInMeters = maxRadiusMiles * 1609.34;

        const rawSQLQuery = `
            SELECT 
                d.driver_id,
                d.vehicle_tier,
                ST_X(d.current_location::geometry) as lng,
                ST_Y(d.current_location::geometry) as lat,
                (ST_Distance(
                    d.current_location::geography, 
                    ST_SetSRID(ST_MakePoint(${pickup.lng}, ${pickup.lat}), 4326)::geography
                ) / 1609.34) AS distance_miles
            FROM 
                driver_locations d
            WHERE 
                d.is_online = TRUE
                AND d.vehicle_tier = '${vehicleTier}'
                AND ST_DWithin(
                    d.current_location::geography, 
                    ST_SetSRID(ST_MakePoint(${pickup.lng}, ${pickup.lat}), 4326)::geography, 
                    ${radiusInMeters}
                )
            ORDER BY 
                distance_miles ASC
            LIMIT 10;
        `;

        return rawSQLQuery.trim();
    }
}
