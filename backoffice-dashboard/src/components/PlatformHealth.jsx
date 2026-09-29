import React, { useCallback } from 'react';
import { fetchHealth, usePolling } from '../utils/api';

const PlatformHealth = () => {
    const load = useCallback(() => fetchHealth(), []);
    const { data: health, loading, error } = usePolling(load, 15000);

    const db = health?.database;
    const services = health?.services || [];
    const resources = health?.resourcePressure;

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: 0, color: '#fff', letterSpacing: '0.1em' }}>PLATFORM HEALTH & DIAGNOSTICS</h2>
                <span style={{ fontSize: 11, color: '#888' }}>
                    {loading ? 'Probing…' : error ? `Health endpoint unreachable: ${error.message}` : `Overall: ${health?.overall || '—'} · all tenants, all services · checked ${health?.checkedAt ? new Date(health.checkedAt).toLocaleTimeString() : '—'}`}
                </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 20 }}>
                <Metric label="DB STATUS" value={db?.status || '—'} tone={db?.status === 'OPERATIONAL' ? 'ok' : 'bad'} />
                <Metric label="POOL (ACTIVE/IDLE)" value={`${db?.total ?? '—'} / ${db?.idle ?? '—'}`} />
                <Metric label="QUERY LATENCY" value={db?.queryLatencyMs != null ? `${db.queryLatencyMs}ms` : '—'} />
                <Metric label="WRITE LATENCY" value={db?.writeLatencyMs != null ? `${db.writeLatencyMs}ms` : '—'} />
                <Metric label="PROCESS RSS" value={resources ? `${resources.processRssMb}MB` : '—'} />
            </div>

            <h3 style={{ color: '#D4AF37', fontSize: 12, letterSpacing: '0.15em' }}>THIRD-PARTY SERVICES</h3>
            <table className="sd-table" style={{ width: '100%', maxWidth: 900, marginBottom: 20 }}>
                <thead><tr><th>SERVICE</th><th>STATUS</th><th>DETAIL</th><th>LATENCY</th></tr></thead>
                <tbody>
                    {services.map((s) => (
                        <tr key={s.name}>
                            <td>{s.name}</td>
                            <td>
                                <span className={`fv-status ${s.status === 'OPERATIONAL' ? 'ok' : s.status === 'UNCONFIGURED' ? 'warn' : 'critical'}`}>
                                    {s.status}
                                </span>
                            </td>
                            <td style={{ fontSize: 11, color: '#999' }}>{s.detail}</td>
                            <td>{s.latencyMs != null ? `${s.latencyMs}ms` : '—'}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <h3 style={{ color: '#D4AF37', fontSize: 12, letterSpacing: '0.15em' }}>ROUTE AVAILABILITY ({health?.routeAvailability?.length || 0} registered)</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxWidth: 1000 }}>
                {(health?.routeAvailability || []).map((r, i) => (
                    <span key={i} style={{ fontSize: 10, fontFamily: 'monospace', background: 'rgba(212,175,55,0.08)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 4, padding: '3px 8px', color: '#ccc' }}>
                        {r.method} {r.route}
                    </span>
                ))}
            </div>
        </div>
    );
};

const Metric = ({ label, value, tone }) => (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 8, padding: '12px 14px' }}>
        <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em' }}>{label}</div>
        <div style={{ fontSize: 16, color: tone === 'ok' ? '#4ade80' : tone === 'bad' ? '#ff6b6b' : '#D4AF37', fontWeight: 700, marginTop: 4 }}>{value}</div>
    </div>
);

export default PlatformHealth;
