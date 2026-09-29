/**
 * VELO ERP — LIVE API CLIENT
 * Every call hits backend-core over HTTP. No mocks, no local fallback arrays.
 */

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8000';

const getTenantId = () => localStorage.getItem('velo_tenant_id') || '00000000-0000-0000-0000-000000000001';

export class ApiError extends Error {
    constructor(status, payload) {
        super((payload && (payload.error || payload.message)) || `API error ${status}`);
        this.status = status;
        this.payload = payload;
    }
}

const request = async (path, options = {}) => {
    const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'x-tenant-id': getTenantId(),
            'x-admin-key': localStorage.getItem('velo_admin_key') || '',
            ...(options.headers || {}),
        },
    });
    let payload = null;
    try {
        payload = await res.json();
    } catch {
        payload = null;
    }
    if (!res.ok || (payload && payload.success === false)) {
        throw new ApiError(res.status, payload);
    }
    return payload ? payload.data : null;
};

export const api = {
    get: (path) => request(path),
    post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body || {}) }),
    put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body || {}) }),
    del: (path) => request(path, { method: 'DELETE' }),
};

// ------------------------------------------------------------------ Operations Hub
export const fetchKpis = () => api.get('/api/analytics/kpis');
export const fetchTrips = (state) => api.get(`/api/analytics/trips${state ? `?state=${encodeURIComponent(state)}` : ''}`);
export const fetchLiveTrips = () => api.get('/api/telemetry/live-trips');
export const fetchLiveFleet = () => api.get('/api/telemetry/live-fleet');
export const fetchEscrowList = () => api.get('/api/escrow');

// ------------------------------------------------------------------ Fleet
export const fetchVehicles = () => api.get('/api/fleet/vehicles');
export const fetchVehicle = (id) => api.get(`/api/fleet/vehicles/${id}`);
export const createVehicle = (body) => api.post('/api/fleet/vehicles', body);
export const updateVehicle = (id, body) => api.put(`/api/fleet/vehicles/${id}`, body);
export const assignVehicle = (id, driverId) => api.post(`/api/fleet/vehicles/${id}/assign`, { driverId });
export const unassignVehicle = (id) => api.post(`/api/fleet/vehicles/${id}/unassign`);
export const createMaintenanceLog = (id, body) => api.post(`/api/fleet/vehicles/${id}/maintenance`, body);
export const updateMaintenanceLog = (id, logId, body) => api.put(`/api/fleet/vehicles/${id}/maintenance/${logId}`, body);
export const addFleetExpense = (id, body) => api.post(`/api/fleet/vehicles/${id}/expenses`, body);
export const fetchFleetCompliance = () => api.get('/api/fleet/compliance');

// ------------------------------------------------------------------ Chauffeurs
export const fetchDrivers = () => api.get('/api/onboarding/drivers');
export const fetchDriver = (id) => api.get(`/api/onboarding/drivers/${id}`);
export const createDriver = (body) => api.post('/api/onboarding/drivers', body);
export const updateDriver = (id, body) => api.put(`/api/onboarding/drivers/${id}`, body);
export const deactivateDriver = (id) => api.del(`/api/onboarding/drivers/${id}`);

// ------------------------------------------------------------------ Clients
export const fetchCorporateAccounts = () => api.get('/api/trips/corporate');
export const fetchCorporateAccount = (id) => api.get(`/api/trips/corporate/${id}`);
export const createCorporateAccount = (body) => api.post('/api/trips/corporate', body);
export const updateCorporateAccount = (id, body) => api.put(`/api/trips/corporate/${id}`, body);
export const addAuthorizedUser = (id, body) => api.post(`/api/trips/corporate/${id}/users`, body);
export const removeAuthorizedUser = (id, userId) => api.del(`/api/trips/corporate/${id}/users/${userId}`);
export const fetchPrivateClients = () => api.get('/api/trips/private-clients');
export const fetchPrivateClient = (id) => api.get(`/api/trips/private-clients/${id}`);
export const createPrivateClient = (body) => api.post('/api/trips/private-clients', body);
export const updatePrivateClient = (id, body) => api.put(`/api/trips/private-clients/${id}`, body);

// ------------------------------------------------------------------ Staff & Roster
export const fetchStaff = () => api.get('/api/system/staff');
export const fetchStaffMember = (id) => api.get(`/api/system/staff/${id}`);
export const createStaffMember = (body) => api.post('/api/system/staff', body);
export const updateStaffMember = (id, body) => api.put(`/api/system/staff/${id}`, body);
export const fetchRoster = (date) => api.get(`/api/system/roster?date=${encodeURIComponent(date)}`);
export const createShiftSlot = (body) => api.post('/api/system/roster', body);
export const updateShiftSlot = (slotId, body) => api.put(`/api/system/roster/${slotId}`, body);
export const deleteShiftSlot = (slotId) => api.del(`/api/system/roster/${slotId}`);

// ------------------------------------------------------------------ Financial
export const fetchMasterLedger = () => api.get('/api/analytics/financial/master-ledger');
export const fetchVatReport = () => api.get('/api/analytics/financial/vat');
export const fetchPayrollPreview = (body) => api.post('/api/payroll/preview', body);
export const fetchPayrollRuns = () => api.get('/api/payroll/runs');
export const createPayrollRun = (body) => api.post('/api/payroll/runs', body);
export const fetchPayrollRun = (id) => api.get(`/api/payroll/runs/${id}`);
export const fetchPayouts = () => api.get('/api/payroll/payouts');
export const generatePendingPayouts = () => api.post('/api/payroll/payouts/generate-pending');
export const massExecutePayouts = (payoutIds) => api.post('/api/payroll/payouts/mass-execute', { payoutIds });
export const executePayout = (driverId, amount) => api.post('/api/payroll/payouts', { driverId, amount });

// ------------------------------------------------------------------ Pool / B2B
export const fetchPoolJobs = () => api.get('/api/pool/jobs');
export const fetchMyPoolJobs = () => api.get('/api/pool/jobs/mine');
export const publishToPool = (tripId) => api.post('/api/pool/jobs', { tripId });
export const submitCounterOffer = (jobId, proposedFare) => api.post(`/api/pool/jobs/${jobId}/counter`, { proposedFare });
export const resolveCounterOffer = (jobId, resolution) => api.post(`/api/pool/jobs/${jobId}/resolve`, { resolution });
export const acceptPoolJob = (jobId, driverId, vehicleId) => api.post(`/api/pool/jobs/${jobId}/accept`, { driverId, vehicleId });

// ------------------------------------------------------------------ Settings & Health
export const fetchSettings = () => api.get('/api/system/settings');
export const updateSetting = (key, value) => api.put(`/api/system/settings/${key}`, { value });
export const fetchHealth = () => api.get('/api/v1/health/full');
export const fetchDiagnostics = () => api.get('/api/system/diagnostics/export');

// ------------------------------------------------------------------ White-label
export const fetchWhiteLabel = () => api.get('/api/system/whitelabel');
export const updateWhiteLabel = (body) => api.put('/api/system/whitelabel', body);

// ------------------------------------------------------------------ Documents / AI
export const fetchComplianceDocuments = () => api.get('/api/ai/documents');
export const verifyComplianceDocument = (body) => api.post('/api/ai/documents/verify', body);

// Uploads: base64 → persistent storage; returns { url }
export const uploadFileBytes = async (base64, mime, category = 'documents') =>
  api.post('/api/uploads/files', { fileBase64: base64, fileMime: mime, category });

// ------------------------------------------------------------------ Driver-side actions (operated from ERP on behalf of flows)
export const fetchNotifications = (unreadOnly) => api.get(`/api/notifications${unreadOnly ? '?unreadOnly=true' : ''}`);
export const dispatchNotification = (body) => api.post('/api/notifications/dispatch', body);

// ------------------------------------------------------------------ Final-mile (audit, live metrics, AI operator, Stripe Connect)
export const fetchAuditLogs = (params) => {
    const qs = new URLSearchParams();
    if (params && params.severity) qs.set('severity', params.severity);
    if (params && params.search) qs.set('search', params.search);
    return api.get(`/api/fm/audit-logs${qs.toString() ? `?${qs.toString()}` : ''}`);
};
export const fetchCommandMetrics = () => api.get('/api/fm/command-metrics');
export const aiOperatorCommand = (command) => api.post('/api/fm/ai/command', { command });
export const fetchStripeConnectStatus = () => api.get('/api/fm/stripe/connect/status');
export const startStripeConnectOnboarding = (body) => api.post('/api/fm/stripe/connect/onboard', body);
export const refreshStripeConnectStatus = () => api.post('/api/fm/stripe/connect/refresh');
export const fetchVehicleIssues = (vehicleId) => api.get(`/api/fm/issues${vehicleId ? `?vehicleId=${encodeURIComponent(vehicleId)}` : ''}`);
export const resolveVehicleIssue = (issueId) => api.post(`/api/fm/issues/${issueId}/resolve`);
export const fetchCorporateUsers = () => api.get('/api/fm/corporate-users');

// ------------------------------------------------------------------ React hook: polling loader
import { useEffect, useRef, useState } from 'react';
export const usePolling = (fetcher, intervalMs = 15000) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
    const runRef = useRef(() => {});
    useEffect(() => {
        let alive = true;
        const run = () => {
            Promise.resolve()
                .then(fetcher)
                .then((d) => { if (alive) { setData(d); setError(null); } })
                .catch((e) => { if (alive) setError(e); })
                .finally(() => { if (alive) setLoading(false); });
        };
        run();
        runRef.current = run;
        const t = setInterval(run, intervalMs);
        return () => { alive = false; clearInterval(t); };
    }, [fetcher, intervalMs]);
    return { data, error, loading, refresh: () => runRef.current() };
};
