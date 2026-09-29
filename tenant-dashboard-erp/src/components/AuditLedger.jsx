import React, { useCallback, useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import './AuditLedger.css';
import { fetchAuditLogs, usePolling } from '../utils/api';

/**
 * GLOBAL AUDIT LEDGER — fully live (final-mile pass).
 * Reads the persisted audit_logs table via /api/fm/audit-logs. Key platform
 * mutations (booking created, trip phase advanced, vehicle assigned,
 * cancellation approved, defects reported, Stripe onboarding) write rows
 * server-side. Severity filters and search run against real data.
 */
const AuditLedger = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [severities, setSeverities] = useState({ info: true, warning: true, critical: true });
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(searchTerm), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  const load = useCallback(() => fetchAuditLogs({ search: debounced }), [debounced]);
  const { data: logs, error, loading } = usePolling(load, 10000);

  const filteredLogs = (logs || []).filter(log => severities[log.severity]);

  const exportCsv = async () => {
    setExporting(true);
    try {
      // Client-side CSV of the currently loaded (real) rows.
      const header = 'timestamp,actor,action,severity,entity_type,entity_id';
      const rows = filteredLogs.map(l => [
        l.created_at ? new Date(l.created_at).toISOString() : '',
        l.actor || l.actor_id || 'system',
        l.action,
        l.severity,
        l.entity_type || '',
        l.entity_id || '',
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(','));
      const blob = new Blob([[header, ...rows].join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `velo-audit-ledger-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  const toggleSeverity = (key) => setSeverities(prev => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="audit-ledger-container">
      
      <div className="ledger-header space-between flex-row">
        <div>
          <h1 className="text-gold">Global Audit Ledger</h1>
          <p className="text-muted">Immutable record of all tenant ecosystem actions.</p>
        </div>
        <button className="btn-outline flex-row align-center gap-sm" onClick={exportCsv} disabled={exporting || filteredLogs.length === 0}>
          <Download size={14} /> {exporting ? 'Exporting…' : 'Export CSV'}
        </button>
      </div>

      <div className="ledger-controls surface-panel">
        <input 
          type="text" 
          className="search-box" 
          placeholder="Search by actor, action, or booking reference..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="flex-row gap-md mt-4">
          <label className="text-sm text-muted">Filter Severity:</label>
          {['info', 'warning', 'critical'].map(s => (
            <button
              key={s}
              className={`badge-filter ${s} ${severities[s] ? 'active' : ''}`}
              onClick={() => toggleSeverity(s)}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="ledger-table-wrapper surface-panel">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Actor</th>
              <th>Action Details</th>
              <th>Entity</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr><td colSpan="5" style={{ color: 'var(--color-danger)' }} className="p-md">Live link error: {error.message}</td></tr>
            )}
            {loading && !logs && (
              <tr><td colSpan="5" className="text-center text-muted p-xl">Loading live audit trail…</td></tr>
            )}
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td className="text-muted">{log.created_at ? new Date(log.created_at).toLocaleString('en-GB', { hour12: false }) : '—'}</td>
                <td className="font-bold">{log.actor || log.actor_id || 'System'}</td>
                <td>{log.action}</td>
                <td className="font-mono text-xs">{log.entity_type ? `${log.entity_type}${log.entity_id ? ` · ${String(log.entity_id).slice(0, 8)}` : ''}` : '—'}</td>
                <td>
                  <span className={`status-badge ${log.severity}`}>{log.severity}</span>
                </td>
              </tr>
            ))}
            {!loading && filteredLogs.length === 0 && !error && (
              <tr>
                <td colSpan="5" className="text-center text-muted p-xl">
                  No audit entries yet. Platform mutations (bookings, assignments, approvals) are recorded here automatically.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AuditLedger;
