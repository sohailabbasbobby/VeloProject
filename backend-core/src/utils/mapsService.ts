import { db } from '../config/db';
import dotenv from 'dotenv';

dotenv.config();

/**
 * MAPS SERVICE — real Google Maps Platform integrations (§2 + self-hosted maps swap).
 *
 * - getRouteMetrics: Google Routes API (backend pricing/ETA — throws when unconfigured;
 *   floor pricing must never silently run on simulated math).
 * - placesAutocomplete / placesDetails / directionsRoute: customer-facing address search,
 *   pin placement and route estimates — FAIL-OPEN: when the key is missing or a call
 *   fails these return null/[] so the app falls back to manual entry / honest estimates.
 *   Every call is wrapped in try/catch; nothing is ever fabricated.
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

export interface PlaceSuggestion {
    placeId: string;
    description: string;
    primaryText: string;
    secondaryText: string;
}

export interface PlaceDetails {
    placeId: string;
    formattedAddress: string;
    lat: number;
    lng: number;
}

export interface DirectionsEstimate {
    distanceMiles: number;
    durationMinutes: number;
    polyline: string | null;
    source: 'GOOGLE_DIRECTIONS_API';
}

const MAPS_KEY_ENV = 'GOOGLE_MAPS_API_KEY';

export const MapsService = {
    isConfigured(): boolean {
        return Boolean(process.env[MAPS_KEY_ENV]);
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
                'X-Goog-Api-Key': process.env[MAPS_KEY_ENV] as string,
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

    // ------------------------------------------------------------------ Places API (New): autocomplete (fail-open)
    async placesAutocomplete(input: string, sessionToken?: string, near?: Coordinate): Promise<PlaceSuggestion[]> {
        if (!this.isConfigured() || !input || input.trim().length < 2) {
            return [];
        }
        try {
            const body: Record<string, unknown> = {
                input: input.trim(),
                includedPrimaryTypes: ['geocode', 'establishment'],
                languageCode: 'en-GB',
            };
            if (sessionToken) body.sessionToken = sessionToken;
            if (near) {
                body.locationBias = {
                    circle: { center: { latitude: near.lat, longitude: near.lng }, radius: 30000 },
                };
            }
            const res = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Goog-Api-Key': process.env[MAPS_KEY_ENV] as string,
                },
                body: JSON.stringify(body),
            });
            const json: any = await res.json();
            if (!res.ok || !Array.isArray(json.suggestions)) return [];
            return json.suggestions
                .filter((s: any) => s?.placePrediction?.placeId)
                .map((s: any) => ({
                    placeId: s.placePrediction.placeId,
                    description: s.placePrediction.text?.text || '',
                    primaryText: s.placePrediction.structuredFormat?.mainText?.text || s.placePrediction.text?.text || '',
                    secondaryText: s.placePrediction.structuredFormat?.secondaryText?.text || '',
                }));
        } catch (err) {
            console.error('[MapsService] autocomplete failed (fail-open):', (err as Error).message);
            return [];
        }
    },

    // ------------------------------------------------------------------ Places API (New): place details (fail-open)
    async placesDetails(placeId: string, sessionToken?: string): Promise<PlaceDetails | null> {
        if (!this.isConfigured() || !placeId) {
            return null;
        }
        try {
            const params = new URLSearchParams({
                languageCode: 'en-GB',
                fields: 'id,formattedAddress,location',
                key: process.env[MAPS_KEY_ENV] as string,
            });
            if (sessionToken) params.set('sessionToken', sessionToken);
            const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?${params.toString()}`, {
                headers: { 'X-Goog-Api-Key': process.env[MAPS_KEY_ENV] as string },
            });
            const json: any = await res.json();
            if (!res.ok || !json?.location) {
                console.error('[MapsService] place details error (fail-open):', json?.error?.message || res.status);
                return null;
            }
            return {
                placeId: json.id || placeId,
                formattedAddress: json.formattedAddress || '',
                lat: json.location.latitude,
                lng: json.location.longitude,
            };
        } catch (err) {
            console.error('[MapsService] place details failed (fail-open):', (err as Error).message);
            return null;
        }
    },

    // ------------------------------------------------------------------ Directions API (fail-open estimate)
    async directionsRoute(origin: Coordinate, destination: Coordinate): Promise<DirectionsEstimate | null> {
        if (!this.isConfigured()) {
            return null;
        }
        try {
            const params = new URLSearchParams({
                origin: `${origin.lat},${origin.lng}`,
                destination: `${destination.lat},${destination.lng}`,
                mode: 'driving',
                key: process.env[MAPS_KEY_ENV] as string,
            });
            const res = await fetch(`https://maps.googleapis.com/maps/api/directions/json?${params.toString()}`);
            const json: any = await res.json();
            if (!res.ok || json.status !== 'OK' || !json.routes?.length) {
                console.error('[MapsService] directions error (fail-open):', json?.error_message || json?.status || res.status);
                return null;
            }
            const leg = json.routes[0].legs?.[0];
            if (!leg) return null;
            return {
                distanceMiles: Math.round((leg.distance.value / 1609.344) * 100) / 100,
                durationMinutes: Math.max(1, Math.round(leg.duration.value / 60)),
                polyline: json.routes[0].overview_polyline?.points || null,
                source: 'GOOGLE_DIRECTIONS_API',
            };
        } catch (err) {
            console.error('[MapsService] directions failed (fail-open):', (err as Error).message);
            return null;
        }
    },
};
