import React from 'react';
import './LiquidityTower.css';
import { fetchPlatformOverview, fetchPlatformEscrow, usePolling } from '../utils/api';

const gbp = (n) => Number(n || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });

const LiquidityTower = () => {
  const loadOverview = React.useCallback(() => fetchPlatformOverview(), []);
  const loadEscrow = React.useCallback(() => fetchPlatformEscrow(), []);
  const { data: overview, error: overviewError, loading: overviewLoading } = usePolling(loadOverview, 20000);
  const { data: escrow, error: escrowError, loading: escrowLoading } = usePolling(loadEscrow, 20000);

  const revenue = (overview && overview.revenue) || {};
  const tripsAgg = (overview && overview.trips) || {};
  const tenantsAgg = (overview && overview.tenants) || {};
  const escrowTotals = (escrow && escrow.totals) || {};
  const escrowCount = ((escrow && escrow.rows) || []).length;

  return (
    <div className="liquidity-tower">

      <div className="view-header">
        <h2>Master Network Liquidity Tower</h2>
        <p className="text-muted">
          {overviewLoading || escrowLoading
            ? 'Syncing live liquidity metrics…'
            : overviewError || escrowError
              ? `Live feed error: ${(overviewError || escrowError).message}`
              : 'Live escrow holdings and network volume — computed from escrow_vault and network_clearing_ledger.'}
        </p>
      </div>

      <div className="tower-grid">

        <div className="metric-block surface-panel">
          <h4>Total Vault Escrow</h4>
          <div className="metric-value font-mono">{gbp(escrowTotals.held_total)}</div>
          <div className="metric-subtext">
            {escrowTotals.held_count || 0} record{(escrowTotals.held_count || 0) === 1 ? '' : 's'} in HELD state holding passenger funds
          </div>
        </div>

        <div className="metric-block surface-panel">
          <h4>Lifetime Released from Vault</h4>
          <div className="metric-value font-mono">{gbp(escrowTotals.released_total)}</div>
          <div className="metric-subtext">Cumulative funds released on verified trip completion</div>
        </div>

        <div className="metric-block surface-panel border-gold">
          <h4>Platform Fees (Lifetime, Net)</h4>
          <div className="metric-value font-mono text-gold">{gbp(revenue.platform_fee_net)}</div>
          <div className="metric-subtext">
            Fulfiller fees across {tripsAgg.total || 0} trips · VAT collected {gbp(revenue.vat_collected)}
          </div>
        </div>

        <div className="metric-block surface-panel">
          <h4>Open Pool Job Liquidity</h4>
          <div className="metric-value font-mono">{tripsAgg.in_pool || 0} In Pool</div>
          <div className="metric-subtext">
            {tripsAgg.negotiating || 0} negotiating · {escrowCount} escrow record{(escrowCount === 1) ? '' : 's'} tracked
          </div>
        </div>

        <div className="metric-block surface-panel">
          <h4>Tenants on Network</h4>
          <div className="metric-value font-mono">{tenantsAgg.active || 0} Active</div>
          <div className="metric-subtext">
            {tenantsAgg.total || 0} registered · {tenantsAgg.suspended || 0} suspended
          </div>
        </div>

        <div className="metric-block surface-panel">
          <h4>Finder's Margins Accrued</h4>
          <div className="metric-value font-mono">{gbp(revenue.finder_margins)}</div>
          <div className="metric-subtext">Originating-tenant margins across all cleared B2B trades</div>
        </div>

      </div>

    </div>
  );
};

export default LiquidityTower;
