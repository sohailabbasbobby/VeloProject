import { db } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MAPS SERVICE — real Google Routes API integration (§2).
 *
 * When GOOGLE_MAPS_API_KEY is absent the service throws: the pool floor pricing and
 * dispatch ETA logic must never silently run on simulated math. Configure the key
 * enabled for Routes API + Maps SDK (PROVIDER_GOOGLE on both mobile apps, §7.5).
 */
export interface Coordinate {
    lat: number;
    lng: number;
}

export interface RouteMetrics {
    distanceMiles: number;
    estimatedDurationMinutes: number;
    polyline: string | null;
    source: 'GOOGLE_ROUTES_API';
}

export const MapsService = {
    isConfigured(): boolean {
        return Boolean(process.env.GOOGLE_MAPS_API_KEY);
    },

    async getRouteMetrics(origin: Coordinate, destination: Coordinate): Promise<RouteMetrics> {
        if (!this.isConfigured()) {
            throw new Error('GOOGLE_MAPS_API_KEY is not configured. Route metrics require the Google Routes API — no simulated math is permitted.');
        }

        const body = {
            origin: { location: { latLng: { latitude: origin.lat, longitude: origin.lng } } },
            destination: { location: { latLng: { latitude: destination.lat, longitude: destination.lng } } },
            travelMode: 'DRIVE',
            routingPreference: 'TRAFFIC_AWARE',
        };

        const res = await fetch('https://routes.googleapis.com/directions/v2:computeRoutes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Goog-Api-Key': process.env.GOOGLE_MAPS_API_KEY as string,
                'X-Goog-FieldMask': 'routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline',
            },
            body: JSON.stringify(body),
        });

        const json: any = await res.json();
        if (!res.ok || !json.routes?.length) {
            throw new Error(`Google Routes API error: ${json.error?.message || res.status}`);
        }

        const route = json.routes[0];
        return {
            distanceMiles: Math.round((route.distanceMeters / 1609.344) * 100) / 100,
            estimatedDurationMinutes: Math.max(1, Math.round(parseInt(route.duration, 10) / 60)),
            polyline: route.polyline?.encodedPolyline || null,
            source: 'GOOGLE_ROUTES_API',
        };
    },

    /**
     * Executes the PostGIS nearest-driver query (ST_DWithin + ST_Distance) and
     * returns live online drivers for a tier. Previously this endpoint only
     * printed the SQL; it now runs it against the live database.
     */
    async getClosestOnlineDrivers(point: Coordinate, radiusMeters: number, vehicleTier: string) {
        const { rows } = await db.query(
            `SELECT d.id, d.first_name, d.last_name, d.reference_code, d.status,
                    dl.vehicle_tier, dl.bearing, dl.speed,
                    ST_Distance(dl.current_location, ST_SetSRID(ST_MakePoint($1,$2),4326)) AS meters,
                    ST_Y(dl.current_location) AS lat, ST_X(dl.current_location) AS lng
             FROM driver_locations dl
             JOIN drivers d ON d.id = dl.driver_id
             WHERE dl.is_online = TRUE
               AND dl.current_location IS NOT NULL
               AND dl.vehicle_tier = $3
               AND ST_DWithin(dl.current_location, ST_SetSRID(ST_MakePoint($1,$2),4326), $4)
             ORDER BY dl.current_location <-> ST_SetSRID(ST_MakePoint($1,$2),4326)
             LIMIT 25`,
            [point.lng, point.lat, vehicleTier, radiusMeters]
        );
        return rows;
    },
};
