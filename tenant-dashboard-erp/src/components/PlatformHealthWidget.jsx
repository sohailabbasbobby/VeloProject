import React, { useState, useEffect } from 'react';
import { Activity, Database, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import './PlatformHealthWidget.css';
import { fetchHealth, fetchDiagnostics } from '../utils/api';

/**
 * PLATFORM HEALTH WIDGET (§2 System Admin) — live diagnostics from the real
 * /api/v1/health/full endpoint: PostgreSQL pool status, third-party service
 * configuration, route availability, memory pressure, write latency.
 */
const PlatformHealthWidget = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedService, setExpandedService] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);

  const loadHealth = async () => {
    setLoading(true);
    try {
      const data = await fetchHealth();
      setHealthData(data);
    } catch (error) {
      setHealthData({ overall: 'UNREACHABLE', database: { status: 'FAILING' }, services: [], routeAvailability: [] });
    }
    setLoading(false);
  };

  useEffect(() => {
    loadHealth();
    const interval = setInterval(loadHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadDiagnostics = async () => {
    try {
      setDiagnostics(await fetchDiagnostics());
    } catch {
      setDiagnostics(null);
    }
  };

  const copyDiagnostics = async () => {
    if (!diagnostics) await loadDiagnostics();
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
    try {
      await navigator.clipboard.writeText(JSON.stringify(diagnostics || {}, null, 2));
    } catch { /* clipboard unavailable */ }
  };

  const getStatusColor = (status) => {
    if (status === 'OPERATIONAL') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (status === 'UNCONFIGURED') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (status === 'DEGRADED') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const db = healthData?.database;
  const services = healthData?.services || [];
  const healthy = services.filter((s) => s.status === 'OPERATIONAL').length;

  return (
    <>
      <button
        className="cc-toolbar-btn"
        onClick={() => { setShowModal(true); if (!diagnostics) loadDiagnostics(); }}
        style={db?.status === 'OPERATIONAL' ? {} : { borderColor: 'rgba(255,107,107,0.5)' }}
      >
        <span className="cc-toolbar-icon"><Activity size={14} /></span>
        <span className="cc-toolbar-label">
          {loading ? 'HEALTH…' : db?.status === 'OPERATIONAL' ? `${db.writeLatencyMs ?? '—'}ms · HEALTHY` : 'DEGRADED'}
        </span>
      </button>

      {showModal && (
        <div className="u-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="u-modal-container" style={{ maxWidth: 720, maxHeight: '80vh' }} onClick={(e) => e.stopPropagation()}>
            <div className="u-modal-header">
              <h2 className="u-modal-title">PLATFORM HEALTH & DIAGNOSTICS</h2>
              <button className="u-modal-btn-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <div className="u-modal-body" style={{ overflowY: 'auto' }}>
              {/* Database pool */}
              <div className="sm-section">
                <h3><Database size={13} /> POSTGRESQL POOL</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8, margin: '10px 0' }}>
                  <Stat label="STATUS" value={db?.status || '—'} />
                  <Stat label="ACTIVE" value={db?.total ?? '—'} />
                  <Stat label="IDLE" value={db?.idle ?? '—'} />
                  <Stat label="QUERY" value={db?.queryLatencyMs != null ? `${db.queryLatencyMs}ms` : '—'} />
                  <Stat label="WRITE" value={db?.writeLatencyMs != null ? `${db.writeLatencyMs}ms` : '—'} />
                </div>
              </div>

              {/* Third-party services */}
              <div className="sm-section">
                <h3><Activity size={13} /> THIRD-PARTY SERVICES ({healthy}/{services.length} OPERATIONAL)</h3>
                {(services || []).map((s) => (
                  <div
                    key={s.name}
                    className={`ph-service-row ${getStatusColor(s.status)}`}
                    style={{ border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: '8px 12px', marginBottom: 6, cursor: 'pointer' }}
                    onClick={() => setExpandedService(expandedService === s.name ? null : s.name)}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 600 }}>{s.name}</span>
                      <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        {s.latencyMs != null && <span style={{ fontSize: 11 }}>{s.latencyMs}ms</span>}
                        <span style={{ fontSize: 11 }}>{s.status}</span>
                        {expandedService === s.name ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </span>
                    </div>
                    {expandedService === s.name && (
                      <div style={{ fontSize: 11, marginTop: 6, opacity: 0.85 }}>{s.detail}</div>
                    )}
                  </div>
                ))}
              </div>

              {/* Resource pressure */}
              {healthData?.resourcePressure && (
                <div className="sm-section">
                  <h3>RESOURCE PRESSURE</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, margin: '10px 0' }}>
                    <Stat label="RSS" value={`${healthData.resourcePressure.processRssMb}MB`} />
                    <Stat label="HEAP" value={`${healthData.resourcePressure.heapUsedMb}MB`} />
                    <Stat label="SYS FREE" value={`${healthData.resourcePressure.systemFreeMemPct}%`} />
                    <Stat label="UPTIME" value={`${Math.floor(healthData.resourcePressure.uptimeSeconds / 60)}m`} />
                  </div>
                </div>
              )}

              {/* AI-ready diagnostic export */}
              <div className="sm-section">
                <h3>AI DIAGNOSTIC EXPORT</h3>
                <div style={{ display: 'flex', gap: 8, margin: '10px 0' }}>
                  <button className="ob-btn-outline" onClick={loadDiagnostics}>REFRESH EXPORT</button>
                  <button className="ob-btn-complete" onClick={copyDiagnostics}>
                    {copiedPrompt ? <Check size={13} /> : <Copy size={13} />} {copiedPrompt ? 'COPIED' : 'COPY JSON'}
                  </button>
                </div>
                {diagnostics?.remediation?.length > 0 && (
                  <ul style={{ fontSize: 11, color: '#ffb347', margin: '6px 0', paddingLeft: 18 }}>
                    {diagnostics.remediation.map((r, i) => <li key={i}>{r}</li>)}
                  </ul>
                )}
              </div>
            </div>
            <div className="security-footer">Verified by Velo AI Security Protocol</div>
          </div>
        </div>
      )}
    </>
  );
};

const Stat = ({ label, value }) => (
  <div style={{ backgroundColor: 'rgba(255,255,255,0.03)', borderRadius: 6, padding: '8px 10px' }}>
    <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.08em' }}>{label}</div>
    <div style={{ fontSize: 13, color: '#fff', fontWeight: 600 }}>{value}</div>
  </div>
);

export default PlatformHealthWidget;
