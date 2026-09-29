import React, { useState, useCallback, useMemo, useEffect } from 'react';
import './B2BPool.css';
import { fetchPoolJobs, fetchMyPoolJobs, publishToPool, submitCounterOffer, resolveCounterOffer, acceptPoolJob, fetchDrivers, usePolling } from '../utils/api';

const gbp = (n) => `£${Number(n || 0).toFixed(2)}`;

const B2BPool = () => {
  const loadOpen = useCallback(() => fetchPoolJobs(), []);
  const { data: openJobs, loading, error, refresh } = usePolling(loadOpen, 10000);
  const loadMine = useCallback(() => fetchMyPoolJobs(), []);
  const { data: myJobs, refresh: refreshMine } = usePolling(loadMine, 15000);
  const loadDrivers = useCallback(() => fetchDrivers(), []);
  const { data: drivers } = usePolling(loadDrivers, 60000);

  const [counterJob, setCounterJob] = useState(null); // { jobId, fare }
  const [proposedFare, setProposedFare] = useState('');
  const [acceptJob, setAcceptJob] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState('');
  const [message, setMessage] = useState(null);
  const [busy, setBusy] = useState(false);

  // Server-authoritative countdown: render seconds left until negotiation_deadline
  const [, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((x) => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const secondsLeft = useMemo(() => {
    if (!counterJob?.deadline && !counterJob?.negotiation_deadline) return null;
    const dl = new Date(counterJob.deadline || counterJob.negotiation_deadline).getTime();
    return Math.max(0, Math.floor((dl - Date.now()) / 1000));
  }, [counterJob]);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

  const flash = (m) => { setMessage(m); setTimeout(() => setMessage(null), 5000); };

  const startCounter = (job) => {
    setCounterJob(job);
    setProposedFare(Number(job.current_wholesale_fare).toFixed(2));
  };

  const sendCounter = async () => {
    setBusy(true);
    try {
      const res = await submitCounterOffer(counterJob.id, Number(proposedFare));
      flash(res.message || 'Counter offer submitted.');
      setCounterJob(null);
      refresh();
    } catch (err) {
      flash(err.message); // floor-price violations surface here verbatim
    } finally {
      setBusy(false);
    }
  };

  const doResolve = async (jobId, resolution) => {
    setBusy(true);
    try {
      const res = await resolveCounterOffer(jobId, resolution);
      flash(res.message);
      refreshMine();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doAccept = async () => {
    setBusy(true);
    try {
      const driver = (drivers || []).find((d) => d.id === selectedDriver);
      const res = await acceptPoolJob(acceptJob.id, selectedDriver, driver?.assigned_vehicle_code || undefined);
      flash(res.data?.message || 'Pool job accepted and assigned.');
      setAcceptJob(null);
      refresh();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="b2b-pool">
      <div className="pool-header">
        <h2>B2B Open Pool Marketplace</h2>
        <p className="text-muted">
          {loading ? 'Syncing live pool…' : error ? `Live feed error: ${error.message}` : 'Live ecosystem overflow trips · network floor pricing enforced server-side'}
        </p>
      </div>

      {message && <div className="sm-toast" style={{ position: 'static', marginBottom: 10 }}>{message}</div>}

      <div className="pool-table-container surface-panel">
        <table className="b2b-table">
          <thead>
            <tr>
              <th>JOB</th><th>ORIGIN OPERATOR</th><th>TIER</th><th>ROUTE</th><th>MILES</th><th>WHOLESALE</th><th>STATE</th><th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {(openJobs || []).map((j) => (
              <tr key={j.id}>
                <td>{j.task_id}</td>
                <td>{j.originating_tenant_name}</td>
                <td>{String(j.vehicle_tier || '').replace('_', ' ')}</td>
                <td>{j.pickup_location} → {j.dropoff_location}</td>
                <td>{Number(j.distance_miles || 0).toFixed(1)}</td>
                <td>{gbp(j.current_wholesale_fare)}</td>
                <td><span className="fv-status ok">{j.state}</span></td>
                <td>
                  <button className="ob-btn-outline" onClick={() => startCounter(j)} disabled={busy}>COUNTER</button>{' '}
                  <button className="ob-btn-complete" onClick={() => setAcceptJob(j)} disabled={busy}>ACCEPT</button>
                </td>
              </tr>
            ))}
            {!loading && (openJobs || []).length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 18 }}>The open pool is currently empty.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* My published jobs + incoming negotiations with server countdown */}
      <div className="pool-table-container surface-panel" style={{ marginTop: 14 }}>
        <table className="b2b-table">
          <thead>
            <tr><th>JOB</th><th>STATE</th><th>BASE</th><th>CURRENT</th><th>COUNTER BY</th><th>DEADLINE</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {(myJobs || []).map((j) => (
              <tr key={j.id}>
                <td>{j.task_id}</td>
                <td>{j.state}</td>
                <td>{gbp(j.base_wholesale_fare)}</td>
                <td>{gbp(j.current_wholesale_fare)}</td>
                <td>{j.countering_tenant_id ? j.countering_tenant_id.slice(0, 8) : '—'}</td>
                <td>{j.negotiation_deadline ? new Date(j.negotiation_deadline).toLocaleTimeString() : '—'}</td>
                <td>
                  {j.state === 'NEGOTIATION' && (
                    <>
                      <button className="ob-btn-complete" onClick={() => doResolve(j.id, 'ACCEPT')} disabled={busy}>ACCEPT OFFER</button>{' '}
                      <button className="ob-btn-outline" onClick={() => doResolve(j.id, 'REJECT')} disabled={busy}>REJECT</button>
                    </>
                  )}
                  {j.state === 'OPEN' && <span style={{ color: '#888', fontSize: 11 }}>Awaiting fulfilment partner…</span>}
                </td>
              </tr>
            ))}
            {(myJobs || []).length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 18 }}>
                Publish unassigned trips here from the Operations Hub (pool floor pricing applies).
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Counter-offer modal (negotiation lock countdown is server-authoritative) */}
      {counterJob && (
        <div className="u-modal-overlay" onClick={() => setCounterJob(null)}>
          <div className="u-modal-container" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="u-modal-header">
              <h2 className="u-modal-title">Counter Offer — {counterJob.task_id}</h2>
              <button className="u-modal-btn-close" onClick={() => setCounterJob(null)}>×</button>
            </div>
            <div className="u-modal-body" style={{ display: 'grid', gap: 10 }}>
              <div style={{ color: '#888', fontSize: 12 }}>
                Current wholesale: {gbp(counterJob.current_wholesale_fare)} · A 10-minute negotiation lock starts when you submit.
                Submissions below the network floor are blocked server-side.
              </div>
              <label style={{ fontSize: 10, color: '#888' }}>YOUR PROPOSED FARE (£)</label>
              <input
                className="ob-input"
                type="number"
                step="0.01"
                value={proposedFare}
                onChange={(e) => setProposedFare(e.target.value)}
              />
            </div>
            <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="ob-btn-draft" onClick={() => setCounterJob(null)}>CANCEL</button>
              <button className="ob-btn-complete" onClick={sendCounter} disabled={busy}>SUBMIT COUNTER OFFER</button>
            </div>
            <div className="security-footer">Verified by Velo AI Security Protocol</div>
          </div>
        </div>
      )}

      {/* Accept modal: pick one of your live drivers */}
      {acceptJob && (
        <div className="u-modal-overlay" onClick={() => setAcceptJob(null)}>
          <div className="u-modal-container" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="u-modal-header">
              <h2 className="u-modal-title">Accept Pool Job — {acceptJob.task_id}</h2>
              <button className="u-modal-btn-close" onClick={() => setAcceptJob(null)}>×</button>
            </div>
            <div className="u-modal-body" style={{ display: 'grid', gap: 10 }}>
              <div style={{ color: '#888', fontSize: 12 }}>
                Assigning one of your chauffeurs commits your fleet to fulfil this trip at {gbp(acceptJob.current_wholesale_fare)}.
              </div>
              <label style={{ fontSize: 10, color: '#888' }}>ASSIGN CHAUFFEUR</label>
              <select className="ob-input" value={selectedDriver} onChange={(e) => setSelectedDriver(e.target.value)}>
                <option value="">Select chauffeur…</option>
                {(drivers || []).map((d) => (
                  <option key={d.id} value={d.id}>{d.reference_code} — {d.full_name}</option>
                ))}
              </select>
            </div>
            <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
              <button className="ob-btn-draft" onClick={() => setAcceptJob(null)}>CANCEL</button>
              <button className="ob-btn-complete" onClick={doAccept} disabled={busy || !selectedDriver}>CONFIRM ACCEPTANCE</button>
            </div>
            <div className="security-footer">Verified by Velo AI Security Protocol</div>
          </div>
        </div>
      )}

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default B2BPool;
