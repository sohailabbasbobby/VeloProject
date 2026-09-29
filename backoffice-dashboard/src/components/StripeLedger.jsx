import React, { useCallback } from 'react';
import './StripeLedger.css';
import { fetchClearingLedger, usePolling } from '../utils/api';

/**
 * STRIPE CONNECT SPLIT-CLEARING LEDGER — fully live (final-mile pass).
 * Every row is a real network_clearing_ledger entry joined to its booking,
 * originating/fulfilling tenants and escrow state, via the admin-key-gated
 * /api/b2b/clearing-ledger endpoint. Totals aggregate the live table.
 */
const gbp = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const StripeLedger = () => {
  const load = useCallback(() => fetchClearingLedger(), []);
  const { data, error, loading } = usePolling(load, 20000);

  const ledgerData = (data && data.rows) || [];
  const totals = (data && data.totals) || {};

  return (
    <div className="stripe-ledger">
      
      <div className="view-header flex-row space-between">
        <div>
          <h2>Stripe Connect Split-Clearing Ledger</h2>
          <p className="text-muted">Transparent accounting view verifying post-ride revenue division.</p>
        </div>
        
        <div className="status-widget surface-panel">
          <div className="status-title">Platform Clearing Totals (live)</div>
          <div className="status-time font-mono">Wholesale {gbp(totals.total_wholesale)}</div>
          <div className="status-router">
            Fulfiller fees {gbp(totals.total_fulfiller_fees)} · Originator fees {gbp(totals.total_creator_fees)}
          </div>
        </div>
      </div>

      <div className="ledger-table-wrapper surface-panel">
        <table className="data-table ledger-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Wholesale Fare</th>
              <th>Originator Fee</th>
              <th>Fulfiller Fee</th>
              <th className="text-gold">Finder Margin</th>
              <th>Route / Tenants</th>
            </tr>
          </thead>
          <tbody>
            {error && (
              <tr><td colSpan="6" style={{ color: 'var(--color-danger)' }} className="p-md">Live link error: {error.message}</td></tr>
            )}
            {loading && !data && (
              <tr><td colSpan="6" className="text-center text-muted p-xl">Loading live clearing ledger…</td></tr>
            )}
            {ledgerData.map(row => (
              <tr key={row.id}>
                <td className="font-mono">{row.task_id}</td>
                <td className="font-mono">{gbp(row.wholesale_fare)}</td>
                <td className="font-mono text-action">{gbp(row.creator_fee_net)}</td>
                <td className="font-mono text-success">{gbp(row.fulfiller_fee_net)}</td>
                <td className="font-mono text-gold font-bold">{gbp(row.finder_margin_net)}</td>
                <td>
                  <span className="disbursal-badge">{row.disbursal_route}</span>
                  <div className="text-muted" style={{ fontSize: 10, marginTop: 4 }}>
                    {(row.originating_tenant || '—')} → {(row.fulfilling_tenant || '—')}
                  </div>
                </td>
              </tr>
            ))}
            {!loading && ledgerData.length === 0 && !error && (
              <tr><td colSpan="6" className="text-center text-muted p-xl">
                No clearing entries yet. Rows appear here as B2B pool jobs complete and revenue splits are computed.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StripeLedger;
