/**
 * VELO BACKOFFICE (Platform-Owner Master Admin) — LIVE API CLIENT
 * All platform-wide data comes from backend-core's admin-key-gated routes.
 */

export const API_BASE = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE) || 'http://localhost:8000';

const getTenantId = () => localStorage.getItem('velo_tenant_id') || '00000000-0000-0000-0000-000000000001';
const getAdminKey = () => localStorage.getItem('velo_admin_key') || '';

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
            'x-admin-key': getAdminKey(),
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
};

// Platform-wide (§4)
export const fetchPlatformOverview = () => api.get('/api/b2b/overview');
export const fetchTenants = () => api.get('/api/b2b/tenants');
export const upsertTenant = (body) => api.post('/api/b2b/tenants', body);
export const fetchPlatformPool = () => api.get('/api/b2b/pool');
export const overridePoolJob = (jobId, action) => api.post(`/api/b2b/pool/${jobId}/override`, { action });
export const fetchPlatformCompliance = () => api.get('/api/b2b/compliance');
export const fetchSettings = () => api.get('/api/system/settings');
export const updateSetting = (key, value) => api.put(`/api/system/settings/${key}`, { value });
export const fetchHealth = () => api.get('/api/v1/health/full');
export const fetchClearingLedger = () => api.get('/api/analytics/financial/master-ledger');
export const fetchEscrowList = () => api.get('/api/escrow');
export const arbitrateEscrow = (tripId, resolution) => api.post(`/api/escrow/trips/${tripId}/arbitrate`, { resolution });
export const refundEscrow = (tripId) => api.post(`/api/escrow/trips/${tripId}/refund`);
export const fetchVatReport = () => api.get('/api/analytics/financial/vat');

import { useEffect, useState } from 'react';
export const usePolling = (fetcher, intervalMs = 15000) => {
    const [data, setData] = useState(null);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(true);
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
        const t = setInterval(run, intervalMs);
        return () => { alive = false; clearInterval(t); };
    }, [fetcher, intervalMs]);
    return { data, error, loading, refresh: run };
};
