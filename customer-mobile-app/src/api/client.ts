/**
 * VELO CUSTOMER APP — LIVE API CLIENT (§6)
 * Every request carries the Firebase ID token. No mock pricing, no local-only state:
 * quotes come from the backend floor engine, bookings write to PostgreSQL.
 */
import { getAuth } from '@react-native-firebase/auth';

export const API_BASE = 'http://10.0.2.2:8000'; // Android emulator host loopback; override in production builds

const request = async (path: string, options: any = {}) => {
  const token = await getAuth().currentUser?.getIdToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  let payload: any = null;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok || (payload && payload.success === false)) {
    throw new Error((payload && (payload.error || payload.message)) || `API error ${res.status}`);
  }
  return payload ? payload.data : null;
};

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: any) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
  put: (path: string, body?: any) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
  del: (path: string) => request(path, { method: 'DELETE' }),
};

// ------------------------------------------------------------------ Profile
export const fetchMyProfile = async () => {
  const drivers = await api.get('/api/onboarding/drivers').catch(() => null);
  void drivers;
  // The authenticated private client resolves via the Firebase uid mapping
  return api.get('/api/trips/private-clients');
};

export const updateMyProfile = (clientId: string, body: { fullName?: string; email?: string; phone?: string; photoUrl?: string }) =>
  api.put(`/api/trips/private-clients/${clientId}`, body);

// ------------------------------------------------------------------ Saved addresses (server-persisted CRUD)
export const fetchSavedAddresses = () => api.get('/api/trips/addresses');
export const createSavedAddress = (body: { label: string; address: string; lat?: number; lng?: number; isDefault?: boolean }) =>
  api.post('/api/trips/addresses', body);
export const deleteSavedAddress = (addressId: string) => api.del(`/api/trips/addresses/${addressId}`);

// ------------------------------------------------------------------ Quotes & booking (live floor pricing)
export const requestQuote = (body: {
  pickupLat: number; pickupLng: number; dropoffLat: number; dropoffLng: number; tier: string;
}) => api.post('/api/trips/quote', body);

export const createBooking = (body: {
  pickupAddress: string; pickupLat?: number; pickupLng?: number;
  dropoffAddress: string; dropoffLat?: number; dropoffLng?: number;
  customPrice: number; bookingType?: 'ASAP' | 'SCHEDULED'; scheduledAt?: string;
  passengerName: string; passengerCount: number; baggageCount: number; requestedTier: string;
}) => api.post('/api/trips', body);

// ------------------------------------------------------------------ Trips
export const fetchMyTrips = () => api.get('/api/trips/mine');
export const fetchUpcomingTrips = () => api.get('/api/trips/mine?scope=upcoming');
export const fetchTripById = (tripId: string) => api.get(`/api/trips/mine/${tripId}`);
export const cancelMyTrip = (tripId: string, reason: string) => api.post(`/api/trips/${tripId}/cancel-request`, { reason });
export const rateTrip = (tripId: string, stars: number, feedback: string) =>
  api.post(`/api/trips/${tripId}/ratings`, { stars, feedback, raterType: 'PASSENGER' });

// ------------------------------------------------------------------ Vehicle capacity (real DB validation)
export const fetchVehicleClasses = () => api.get('/api/trips/vehicle-classes');
