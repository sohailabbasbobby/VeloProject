import React, { useState, useCallback, useMemo } from 'react';
import { Landmark, Wallet, Users, RefreshCw, Play } from 'lucide-react';
import './CommandCenter.css';
import {
  fetchMasterLedger, fetchVatReport, fetchPayouts, generatePendingPayouts,
  massExecutePayouts, fetchPayrollPreview, usePolling,
} from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const gbp = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const TABS = [
  { id: 'ledger', label: 'MASTER LEDGER', icon: <Landmark size={13} /> },
  { id: 'payouts', label: 'PAYOUT HUB', icon: <Wallet size={13} /> },
  { id: 'payroll', label: 'HR & PAYROLL BASELINE', icon: <Users size={13} /> },
];

const FinancialDashboard = () => {
  const [activeTab, setActiveTab] = useState('ledger');
  const { openDriverProfile } = useEntityLinker();

  const loadLedger = useCallback(() => fetchMasterLedger(), []);
  const { data: ledger } = usePolling(loadLedger, 20000);
  const loadVat = useCallback(() => fetchVatReport(), []);
  const { data: vat } = usePolling(loadVat, 60000);
  const loadPayouts = useCallback(() => fetchPayouts(), []);
  const { data: payouts, refresh: refreshPayouts } = usePolling(loadPayouts, 15000);

  return (
    <div className="system-module">
      <div className="sm-header">
        <div>
          <h2>FINANCIAL INTELLIGENCE & COMMAND CENTER</h2>
          <span className="sm-subtitle">Live master ledger · escrow state · payout execution · VAT on platform fees only (never on retail fares)</span>
        </div>
      </div>

      <div className="sm-tabs">
        {TABS.map((t) => (
          <button key={t.id} className={`sm-tab ${activeTab === t.id ? 'active' : ''}`} onClick={() => setActiveTab(t.id)}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {activeTab === 'ledger' && (
        <MasterLedgerTab ledger={ledger} vat={vat} openDriverProfile={openDriverProfile} />
      )}
      {activeTab === 'payouts' && (
        <PayoutHubTab payouts={payouts} refreshPayouts={refreshPayouts} openDriverProfile={openDriverProfile} />
      )}
      {activeTab === 'payroll' && <PayrollBaselineTab openDriverProfile={openDriverProfile} />}

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

// ----------------------------------------------------------------------------------
const MasterLedgerTab = ({ ledger, vat, openDriverProfile }) => {
  const totals = ledger?.networkTotals || {};
  return (
    <>
      <div className="sm-metric-row">
        <div className="sm-metric">
          <div className="sm-metric-label">PLATFORM FEES (GROSS, INCL. VAT)</div>
          <div className="sm-metric-value">{gbp(totals.platform_fee_gross_total)}</div>
        </div>
        <div className="sm-metric">
          <div className="sm-metric-label">FINDER'S MARGINS EARNED</div>
          <div className="sm-metric-value">{gbp(totals.finder_margin_total)}</div>
        </div>
        <div className="sm-metric">
          <div className="sm-metric-label">ESCROW HELD</div>
          <div className="sm-metric-value">
            {gbp((ledger?.escrow || []).filter((e) => e.state === 'HELD').reduce((s, e) => s + Number(e.held_amount), 0))}
          </div>
        </div>
        <div className="sm-metric">
          <div className="sm-metric-label">ESCROW DISPUTED</div>
          <div className="sm-metric-value">
            {gbp((ledger?.escrow || []).filter((e) => e.state === 'DISPUTED').reduce((s, e) => s + Number(e.held_amount), 0))}
          </div>
        </div>
      </div>

      <table className="sd-table">
        <thead>
          <tr><th>DATE</th><th>DRIVER</th><th>TRIP</th><th>ENTRY</th><th>DIRECTION</th><th>AMOUNT</th></tr>
        </thead>
        <tbody>
          {(ledger?.ledger || []).slice(0, 100).map((l) => (
            <tr key={l.id}>
              <td>{new Date(l.created_at).toLocaleString()}</td>
              <td>
                {l.driver_name ? (
                  <a className="entity-link" onClick={() => openDriverProfile(l.driver_code || l.driver_name)}>{l.driver_name}</a>
                ) : '—'}
              </td>
              <td>{l.task_id || '—'}</td>
              <td>{String(l.entry_type).replace(/_/g, ' ')}</td>
              <td className={l.direction === 'CREDIT' ? 'text-success' : 'text-danger'}>{l.direction}</td>
              <td className={l.direction === 'CREDIT' ? 'text-success' : 'text-danger'}>{gbp(l.amount)}</td>
            </tr>
          ))}
          {(ledger?.ledger || []).length === 0 && (
            <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Ledger is empty — entries land here as trips complete.</td></tr>
          )}
        </tbody>
      </table>

      {vat && vat.length > 0 && (
        <div className="sm-section">
          <h3>VAT REPORT (PLATFORM FEE VAT ONLY — NO RETAIL VAT)</h3>
          <table className="sd-table">
            <thead><tr><th>PERIOD</th><th>FEE NET</th><th>VAT (20%)</th><th>FEE GROSS</th></tr></thead>
            <tbody>
              {vat.map((v, i) => (
                <tr key={i}>
                  <td>{String(v.period).slice(0, 7)}</td>
                  <td>{gbp(v.fee_net)}</td>
                  <td>{gbp(v.fee_vat)}</td>
                  <td>{gbp(v.fee_gross)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

// ----------------------------------------------------------------------------------
const PayoutHubTab = ({ payouts, refreshPayouts, openDriverProfile }) => {
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);
  const [selected, setSelected] = useState(new Set());

  const pending = (payouts || []).filter((p) => p.status === 'PENDING');

  const toggle = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const generate = async () => {
    setBusy(true);
    try {
      await generatePendingPayouts();
      refreshPayouts();
      setMessage('Pending payouts generated from live ledger balances.');
    } catch (err) {
      setMessage(`Generation failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const massExecute = async () => {
    if (selected.size === 0) return;
    setBusy(true);
    try {
      const results = await massExecutePayouts([...selected]);
      const failed = results.filter((r) => r.status === 'FAILED');
      setMessage(
        failed.length
          ? `Executed ${results.length - failed.length}; ${failed.length} failed (${failed[0].error}).`
          : `Mass payout executed for ${results.length} driver(s) via Stripe Connect.`
      );
      setSelected(new Set());
      refreshPayouts();
    } catch (err) {
      setMessage(`Mass execution failed: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sm-metric-row">
        <div className="sm-metric">
          <div className="sm-metric-label">PENDING</div>
          <div className="sm-metric-value">{pending.length}</div>
        </div>
        <div className="sm-metric">
          <div className="sm-metric-label">PENDING VALUE</div>
          <div className="sm-metric-value">{gbp(pending.reduce((s, p) => s + Number(p.amount), 0))}</div>
        </div>
        <div className="sm-metric">
          <div className="sm-metric-label">PAID (LIFETIME)</div>
          <div className="sm-metric-value">{gbp((payouts || []).filter((p) => p.status === 'PAID').reduce((s, p) => s + Number(p.amount), 0))}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button className="ob-btn-outline" onClick={generate} disabled={busy}><RefreshCw size={13} /> GENERATE FROM LEDGERS</button>
          <button className="ob-btn-complete" onClick={massExecute} disabled={busy || selected.size === 0}>
            <Play size={13} /> MASS EXECUTE PAYOUTS {selected.size ? `(${selected.size})` : ''}
          </button>
        </div>
      </div>

      {message && <div className="sm-toast" style={{ position: 'static', marginBottom: 10 }}>{message}</div>}

      <table className="sd-table">
        <thead>
          <tr><th></th><th>DRIVER</th><th>AMOUNT</th><th>METHOD</th><th>STATUS</th><th>STRIPE TRANSFER</th><th>EXECUTED</th></tr>
        </thead>
        <tbody>
          {(payouts || []).map((p) => (
            <tr key={p.id}>
              <td>
                <input
                  type="checkbox"
                  disabled={p.status !== 'PENDING'}
                  checked={selected.has(p.id)}
                  onChange={() => toggle(p.id)}
                  style={{ accentColor: 'var(--color-gold)' }}
                />
              </td>
              <td>
                {p.driver_name ? (
                  <a className="entity-link" onClick={() => openDriverProfile(p.driver_code || p.driver_name)}>{p.driver_name}</a>
                ) : '—'}
              </td>
              <td>{gbp(p.amount)}</td>
              <td>{String(p.method).replace('_', ' ')}</td>
              <td><span className={`fv-status ${p.status === 'PAID' ? 'ok' : p.status === 'FAILED' ? 'critical' : 'warn'}`}>{p.status}</span></td>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{p.stripe_transfer_id || '—'}</td>
              <td>{p.executed_at ? new Date(p.executed_at).toLocaleString() : '—'}</td>
            </tr>
          ))}
          {(payouts || []).length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No payouts yet. Generate from ledgers to stage the first run.</td></tr>
          )}
        </tbody>
      </table>
    </>
  );
};

// ----------------------------------------------------------------------------------
const PayrollBaselineTab = ({ openDriverProfile }) => {
  const [periodStart, setPeriodStart] = useState(new Date(Date.now() - 7 * 86400e3).toISOString().slice(0, 10));
  const [periodEnd, setPeriodEnd] = useState(new Date().toISOString().slice(0, 10));
  const [preview, setPreview] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const run = async () => {
    setBusy(true);
    setError(null);
    try {
      setPreview(await fetchPayrollPreview({ periodStart, periodEnd }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="sm-metric-row" style={{ alignItems: 'end' }}>
        <div>
          <div className="sm-metric-label">PERIOD START</div>
          <input type="date" className="ob-input" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
        </div>
        <div>
          <div className="sm-metric-label">PERIOD END</div>
          <input type="date" className="ob-input" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>
        <button className="ob-btn-complete" onClick={run} disabled={busy}>{busy ? 'COMPUTING…' : 'RUN LIVE COMPUTATION'}</button>
        {preview && (
          <div className="sm-metric" style={{ marginLeft: 'auto' }}>
            <div className="sm-metric-label">TOTAL NET ESTIMATE</div>
            <div className="sm-metric-value">{gbp(preview.lines.reduce((s, l) => s + Number(l.netPayEstimate), 0))}</div>
          </div>
        )}
      </div>
      {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}
      {preview && (
        <table className="sd-table">
          <thead>
            <tr><th>DRIVER</th><th>MODEL</th><th>GROSS</th><th>HOURS</th><th>TRIPS</th><th>PENSION</th><th>STUDENT LOAN</th><th>NET ESTIMATE</th></tr>
          </thead>
          <tbody>
            {preview.lines.map((l) => (
              <tr key={l.driverId}>
                <td><a className="entity-link" onClick={() => openDriverProfile(l.driverId)}>{l.driverId.slice(0, 8)}…</a></td>
                <td>{l.breakdown?.model || '—'}</td>
                <td>{gbp(l.grossPay)}</td>
                <td>{Number(l.hoursWorked).toFixed(1)}</td>
                <td>{l.tripsCompleted}</td>
                <td>{gbp(l.pension)}</td>
                <td>{gbp(l.studentLoan)}</td>
                <td className="text-success">{gbp(l.netPayEstimate)}</td>
              </tr>
            ))}
            {preview.lines.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No active drivers to compute.</td></tr>
            )}
          </tbody>
        </table>
      )}
      {!preview && !busy && (
        <div style={{ color: '#888', fontSize: 12, padding: 12 }}>
          Computation reads each driver's real assigned pay framework and live trip/shift ledger data — never hardcoded rates.
        </div>
      )}
    </>
  );
};

export default FinancialDashboard;
