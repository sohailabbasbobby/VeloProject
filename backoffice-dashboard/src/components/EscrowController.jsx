import React, { useMemo, useState } from 'react';
import './EscrowController.css';
import { fetchPlatformEscrow, freezeEscrow, arbitrateEscrow, refundEscrow, usePolling } from '../utils/api';

const gbp = (n) => Number(n || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—');

const EscrowController = () => {
  const load = React.useCallback(() => fetchPlatformEscrow(), []);
  const { data, error, loading, refresh } = usePolling(load, 15000);
  const [activeTrade, setActiveTrade] = useState(null);
  const [actionError, setActionError] = useState(null);
  const [busyTripId, setBusyTripId] = useState(null);
  const [statusFilter, setStatusFilter] = useState('ALL');

  const rows = useMemo(() => (data && data.rows) || [], [data]);
  const totals = (data && data.totals) || {};

  const filtered = useMemo(
    () => (statusFilter === 'ALL' ? rows : rows.filter((r) => r.state === statusFilter)),
    [rows, statusFilter]
  );

  const runAction = async (tripId, fn, label) => {
    setActionError(null);
    setBusyTripId(tripId);
    try {
      await fn(tripId);
      refresh();
    } catch (e) {
      setActionError(`${label} failed: ${e.message}`);
    } finally {
      setBusyTripId(null);
    }
  };

  const badgeClass = (state) => {
    switch (state) {
      case 'HELD': return 'badge-held';
      case 'RELEASED': return 'badge-released';
      case 'REFUNDED': return 'badge-refunded';
      case 'DISPUTED': return 'badge-dispute';
      case 'FROZEN': return 'badge-frozen';
      default: return 'badge-held';
    }
  };

  return (
    <div className="escrow-controller">
      <div className="view-header">
        <h2>Escrow &amp; Dispute Controller Terminal</h2>
        <p className="text-muted">
          {loading && !data
            ? 'Syncing live escrow vault…'
            : error
              ? `Live feed error: ${error.message}`
              : `${rows.length} escrow records · ${totals.held_count || 0} held · ${totals.disputed_count || 0} disputed · ${totals.frozen_count || 0} frozen`}
        </p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {['ALL', 'HELD', 'RELEASED', 'DISPUTED', 'FROZEN', 'REFUNDED'].map((s) => (
          <button
            key={s}
            className={`btn-outline ${statusFilter === s ? 'active' : ''}`}
            style={statusFilter === s ? { borderColor: 'var(--color-gold)', color: 'var(--color-gold)' } : {}}
            onClick={() => setStatusFilter(s)}
          >
            {s}
          </button>
        ))}
      </div>

      {actionError && (
        <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>{actionError}</div>
      )}

      <div className="escrow-table-wrapper surface-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking Task ID</th>
              <th>Holding Tenant</th>
              <th>Passenger</th>
              <th>Held Amount</th>
              <th>Released</th>
              <th>Escrow State</th>
              <th>Stripe Reference</th>
              <th>Action Triggers</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((trade) => (
              <tr key={trade.id} className={trade.state === 'FROZEN' ? 'row-frozen' : ''} style={{ cursor: 'pointer' }} onClick={() => setActiveTrade(trade)}>
                <td className="font-mono text-gold">{trade.task_id || trade.booking_id}</td>
                <td>{trade.holding_tenant || '—'}</td>
                <td>{trade.passenger_name || '—'}</td>
                <td className="font-mono">{gbp(trade.held_amount)}</td>
                <td className="font-mono">{gbp(trade.released_amount)}</td>
                <td>
                  <span className={`badge ${badgeClass(trade.state)}`}>{trade.state}</span>
                </td>
                <td className="font-mono" style={{ fontSize: 11, color: '#888' }}>
                  {trade.stripe_payment_intent_id
                    ? (trade.stripe_payment_intent_id === 'CONFIGURATION_PENDING' ? '⚠ CONFIG PENDING' : trade.stripe_payment_intent_id.slice(0, 18) + '…')
                    : '—'}
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    {['HELD', 'DISPUTED'].includes(trade.state) && (
                      <button
                        className="btn-danger"
                        disabled={busyTripId === trade.booking_id}
                        onClick={() => runAction(trade.booking_id, freezeEscrow, 'Freeze')}
                      >
                        ⏸ FREEZE
                      </button>
                    )}
                    {['DISPUTED', 'FROZEN'].includes(trade.state) && (
                      <button
                        className="btn-warning"
                        disabled={busyTripId === trade.booking_id}
                        onClick={() => runAction(trade.booking_id, (id) => arbitrateEscrow(id, 'RELEASE'), 'Arbitrated release')}
                      >
                        ⚠ ARBITRATE → RELEASE
                      </button>
                    )}
                    {['HELD', 'DISPUTED'].includes(trade.state) && (
                      <button
                        className="btn-outline"
                        disabled={busyTripId === trade.booking_id}
                        onClick={() => runAction(trade.booking_id, refundEscrow, 'Refund')}
                      >
                        ↩ REFUND
                      </button>
                    )}
                    {!['HELD', 'DISPUTED', 'FROZEN'].includes(trade.state) && <span style={{ color: '#555', fontSize: 11 }}>No action</span>}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filtered.length === 0 && (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', color: '#888', padding: 24 }}>
                  {error ? 'Live escrow feed unavailable.' : `No escrow records${statusFilter !== 'ALL' ? ` in state ${statusFilter}` : ''}. Escrow rows appear when bookings capture funds.`}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Arbitration Slide-Out Panel */}
      <div className={`arbitration-panel ${activeTrade ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>Escrow Record · {activeTrade ? (activeTrade.task_id || activeTrade.booking_id) : ''}</h3>
          <button className="btn-outline" onClick={() => setActiveTrade(null)}>Close</button>
        </div>

        {activeTrade && (
          <div className="panel-content">
            <div className="audit-section">
              <h4>Financials</h4>
              <p className="font-mono text-muted mt-2">
                Held: {gbp(activeTrade.held_amount)} | Released: {gbp(activeTrade.released_amount)} | State: {activeTrade.state}
              </p>
              <p className="font-mono text-muted">
                Holding tenant: {activeTrade.holding_tenant || '—'} | Passenger: {activeTrade.passenger_name || '—'}
              </p>
            </div>

            <div className="audit-section">
              <h4>Lifecycle Timestamps</h4>
              <div className="log-box font-mono text-sm">
                Created:&nbsp;{fmtDateTime(activeTrade.created_at)}<br />
                Last updated:&nbsp;{fmtDateTime(activeTrade.updated_at)}<br />
                {activeTrade.dispute_reason ? `Dispute reason: ${activeTrade.dispute_reason}` : 'No dispute recorded on this escrow row.'}
              </div>
            </div>

            <div className="audit-section">
              <h4>Stripe References</h4>
              <div className="log-box font-mono text-sm">
                Payment intent: {activeTrade.stripe_payment_intent_id || '—'}<br />
                Charge: {activeTrade.stripe_charge_id || '—'}<br />
                Transfer: {activeTrade.stripe_transfer_id || '—'}
              </div>
            </div>

            <div className="audit-section">
              <h4>Trip Lifecycle State</h4>
              <div className="log-box font-mono text-sm">Trip state: {activeTrade.trip_state || '—'}</div>
            </div>

            <div className="panel-footer">
              {['HELD', 'DISPUTED'].includes(activeTrade.state) && (
                <>
                  <button
                    className="btn-danger"
                    disabled={busyTripId === activeTrade.booking_id}
                    onClick={() => runAction(activeTrade.booking_id, refundEscrow, 'Refund')}
                  >
                    Refund Client
                  </button>
                  <button
                    className="btn-primary"
                    disabled={busyTripId === activeTrade.booking_id}
                    onClick={() => runAction(activeTrade.booking_id, (id) => arbitrateEscrow(id, 'RELEASE'), 'Arbitrated release')}
                  >
                    Arbitrate → Release to Fulfiller
                  </button>
                </>
              )}
              {activeTrade.state === 'FROZEN' && (
                <button
                  className="btn-primary"
                  disabled={busyTripId === activeTrade.booking_id}
                  onClick={() => runAction(activeTrade.booking_id, (id) => arbitrateEscrow(id, 'RELEASE'), 'Arbitrated release')}
                >
                  Arbitrate → Release to Fulfiller
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default EscrowController;
