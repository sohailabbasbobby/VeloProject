/**
 * GOOGLE PLACES VIA OUR BACKEND (self-hosted maps swap)
 * The API key never ships inside the app — searches go through
 * backend-core's /api/maps/* proxy (Places API New + Directions), which
 * fails open: [] / null responses mean "fall back to manual entry".
 */
import { api } from './client';

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

/** Debounced autocomplete: resolves [] when the key is missing or on any error. */
export const searchPlaces = (input: string, signal?: { cancelled: boolean }): Promise<PlaceSuggestion[]> => {
    if (!input || input.trim().length < 2) return Promise.resolve([]);
    return new Promise((resolve) => {
        windowlessDebounce(() => {
            if (signal?.cancelled) return resolve([]);
            api.get(`/api/maps/autocomplete?input=${encodeURIComponent(input.trim())}`)
                .then((res: any) => resolve(res?.suggestions || []))
                .catch(() => resolve([]));
        }, 250);
    });
};

/** Resolve a selected suggestion to lat/lng + formatted address; null → manual pin. */
export const resolvePlace = (placeId: string): Promise<PlaceDetails | null> =>
    api.get(`/api/maps/places/${encodeURIComponent(placeId)}`)
        .then((res: any) => (res ? res : null))
        .catch(() => null);

// ---------------------------------------------------------------------------
let timer: ReturnType<typeof setTimeout> | null = null;
const windowlessDebounce = (fn: () => void, ms: number): void => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(fn, ms);
};
