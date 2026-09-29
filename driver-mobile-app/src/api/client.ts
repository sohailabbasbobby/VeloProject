/**
 * VELO DRIVER APP — LIVE API CLIENT (§5)
 * Every request carries the Firebase ID token. There are no mock fallbacks:
 * failures surface to the UI as errors.
 */
import auth, { getAuth } from '@react-native-firebase/auth';

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
};

// ------------------------------------------------------------------ Auth/profile
export const fetchMyProfile = () => api.get('/api/onboarding/drivers');
export const fetchMyOperators = () => api.get('/api/onboarding/my/operators');
export const fetchMyRoster = () => api.get('/api/onboarding/my/roster');

// ------------------------------------------------------------------ Offers & trips
export const fetchMyOffers = () => api.get('/api/trips');
export const respondToOffer = (offerId: string, action: 'ACCEPT' | 'DECLINE', opts?: { forfeitTripId?: string; acknowledgeConflict?: boolean }) =>
  api.post(`/api/trips/offers/${offerId}/respond`, { action, ...opts });
export const fetchActiveTrip = () => api.get('/api/trips/active');
export const advanceTripPhase = (tripId: string, phase: 'ARRIVED' | 'START' | 'COMPLETE', odometer?: number) =>
  api.post(`/api/trips/${tripId}/phases`, { phase, odometer });
export const requestMaskedContact = (tripId: string) => api.post(`/api/trips/${tripId}/contact`);
export const requestCancellation = (tripId: string, reason: string) => api.post(`/api/trips/${tripId}/cancel-request`, { reason });
export const submitTripRating = (tripId: string, stars: number, feedback: string, raterType = 'DRIVER') =>
  api.post(`/api/trips/${tripId}/ratings`, { stars, feedback, raterType });
export const submitGatekeeper = (body: { vehicleId: string; cleanliness: boolean; tyres: boolean; fuelBattery: boolean; rearCabinPhotoUrl: string }) =>
  api.post('/api/onboarding/gatekeeper', body);
export const goOffline = () => api.post('/api/onboarding/go-offline');

// ------------------------------------------------------------------ Money
export const fetchMyLedger = () => api.get('/api/payroll/my/ledger');
export const fetchMyPayouts = () => api.get('/api/payroll/payouts');
export const logTripExpense = (tripId: string, expenseType: string, amount: number, customLabel?: string, receiptUrl?: string) =>
  api.post(`/api/trips/${tripId}/expenses`, { expenseType, amount, customLabel, receiptUrl });

// ------------------------------------------------------------------ Vehicle & defects
export const fetchMyVehicle = () => api.get('/api/fleet/vehicles');
export const logOdometer = (vehicleId: string, reading: number, eventType: string) =>
  api.post(`/api/fleet/vehicles/${vehicleId}/odometer`, { reading, eventType });
export const reportDefect = (vehicleId: string, issueDescription: string, severity: string) =>
  api.post(`/api/fleet/vehicles/${vehicleId}/defects`, { issueDescription, severity });
export const fetchVehicleIssues = () => api.get('/api/fleet/issues');

// ------------------------------------------------------------------ Messaging & telemetry
export const fetchMessages = (threadKey: string) =>
  api.get(`/api/trips/messages?threadType=DRIVER_DISPATCH&threadKey=${encodeURIComponent(threadKey)}`);
export const sendMessage = (threadKey: string, body: string) =>
  api.post('/api/trips/messages', { threadType: 'DRIVER_DISPATCH', threadKey, senderType: 'DRIVER', body });
export const sendTelemetryPing = (lat: number, lng: number, bearing?: number, speed?: number, vehicleTier?: string) =>
  api.post('/api/telemetry/ping', { lat, lng, bearing, speed, vehicleTier, isOnline: true });
export const sendHealthSignal = (signal: string, details?: any) =>
  api.post('/api/telemetry/health-signal', { signal, details });

// ------------------------------------------------------------------ Uploads
export const uploadPhoto = async (base64: string, mime: string, category: string): Promise<string> => {
  const data = await api.post('/api/uploads/files', { fileBase64: base64, fileMime: mime, category });
  return `${API_BASE}${data.url}`;
};
