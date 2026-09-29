import React, { useState, useCallback } from 'react';
import { fetchPlatformPool, overridePoolJob, usePolling } from '../utils/api';

const gbp = (n) => `£${Number(n || 0).toFixed(2)}`;

const PoolOversight = () => {
  const load = useCallback(() => fetchPlatformPool(), []);
  const { data: jobs, loading, error, refresh } = usePolling(load, 12000);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const act = async (jobId, action) => {
    setBusy(true);
    try {
      await overridePoolJob(jobId, action);
      setMessage(`Override applied: ${action.replace('_', ' ')} on ${jobId.slice(0, 8)}…`);
      refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const states = (jobs || []).reduce((acc, j) => { acc[j.state] = (acc[j.state] || 0) + 1; return acc; }, {});

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: '#fff', letterSpacing: '0.1em' }}>CROSS-TENANT POOL OVERSIGHT</h2>
        <span style={{ fontSize: 11, color: '#888' }}>
          {loading ? 'Syncing…' : error ? `Feed error: ${error.message}` : `${(jobs || []).length} pool jobs platform-wide · ${states.OPEN || 0} open · ${states.NEGOTIATION || 0} negotiating · ${states.ALLOCATED || 0} allocated`}
        </span>
      </div>

      {message && <div style={{ color: '#D4AF37', fontSize: 12, marginBottom: 10 }}>{message}</div>}

      <table className="sd-table" style={{ width: '100%' }}>
        <thead>
          <tr><th>TASK</th><th>ORIGIN</th><th>COUNTER PARTIES</th><th>ROUTE</th><th>TIER</th><th>BASE</th><th>CURRENT</th><th>STATE</th><th>DEADLINE</th><th>OVERRIDE</th></tr>
        </thead>
        <tbody>
          {(jobs || []).map((j) => (
            <tr key={j.id}>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{j.task_id}</td>
              <td>{j.originating_tenant_name}</td>
              <td>{j.countering_tenant_name || '—'}</td>
              <td style={{ maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {j.pickup_location} → {j.dropoff_location}
              </td>
              <td>{String(j.vehicle_tier || '').replace('_', ' ')}</td>
              <td>{gbp(j.base_wholesale_fare)}</td>
              <td>{gbp(j.current_wholesale_fare)}</td>
              <td>
                <span className={`fv-status ${j.state === 'OPEN' ? 'ok' : j.state === 'NEGOTIATION' ? 'warn' : ''}`}>{j.state}</span>
              </td>
              <td style={{ fontSize: 11 }}>{j.negotiation_deadline ? new Date(j.negotiation_deadline).toLocaleTimeString() : '—'}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                {j.state !== 'COMPLETED' && (
                  <>
                    <button className="ob-btn-outline" onClick={() => act(j.id, 'FORCE_OPEN')} disabled={busy} title="Reopen a stuck negotiation">REOPEN</button>{' '}
                    <button className="ob-btn-outline" onClick={() => act(j.id, 'WITHDRAW')} disabled={busy} title="Withdraw from pool back to originating tenant">WITHDRAW</button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {!loading && (jobs || []).length === 0 && (
            <tr><td colSpan={10} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No pool activity platform-wide.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default PoolOversight;
