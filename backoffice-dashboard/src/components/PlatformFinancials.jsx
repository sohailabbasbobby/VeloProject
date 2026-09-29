import React, { useState, useCallback } from 'react';
import { fetchPlatformOverview, fetchVatReport, fetchEscrowList, usePolling } from '../utils/api';

const gbp = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const PlatformFinancials = () => {
  const loadOverview = useCallback(() => fetchPlatformOverview(), []);
  const { data: overview, loading, error } = usePolling(loadOverview, 20000);
  const loadVat = useCallback(() => fetchVatReport(), []);
  const { data: vat } = usePolling(loadVat, 60000);
  const loadEscrow = useCallback(() => fetchEscrowList(), []);
  const { data: escrow } = usePolling(loadEscrow, 20000);

  const rev = overview?.revenue || {};
  const escrowHeld = (escrow || []).filter((e) => e.state === 'HELD');
  const escrowDisputed = (escrow || []).filter((e) => e.state === 'DISPUTED');

  return (
    <div style={{ padding: 24 }}>
      <div style={{ marginBottom: 18 }}>
        <h2 style={{ margin: 0, color: '#fff', letterSpacing: '0.1em' }}>PLATFORM FINANCIALS</h2>
        <span style={{ fontSize: 11, color: '#888' }}>
          {loading ? 'Syncing…' : error ? `Feed error: ${error.message}` : 'Aggregate revenue across all tenants · live from the clearing ledger'}
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        <Metric label="PLATFORM FEE REVENUE (GROSS)" value={gbp(rev.platform_fee_gross)} />
        <Metric label="PLATFORM FEE (NET)" value={gbp(rev.platform_fee_net)} />
        <Metric label={`VAT COLLECTED (20% ON FEES ONLY)`} value={gbp(rev.vat_collected)} />
        <Metric label="FINDER'S MARGINS (NETWORK)" value={gbp(rev.finder_margins)} />
        <Metric label="ESCROW HELD" value={gbp(escrowHeld.reduce((s, e) => s + Number(e.held_amount), 0))} />
        <Metric label="ESCROW DISPUTED" value={gbp(escrowDisputed.reduce((s, e) => s + Number(e.held_amount), 0))} />
        <Metric label="TOTAL TRIPS" value={overview?.trips?.total ?? '—'} />
        <Metric label="ACTIVE TENANTS" value={`${overview?.tenants?.active ?? '—'} / ${overview?.tenants?.total ?? '—'}`} />
      </div>

      {/* 30-day GMV vs fee revenue */}
      {overview?.volume && overview.volume.length > 0 && (
        <div style={{ marginBottom: 20 }}>
          <h3 style={{ color: '#D4AF37', fontSize: 12, letterSpacing: '0.15em' }}>30-DAY GMV vs PLATFORM FEE REVENUE</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 120, marginTop: 10 }}>
            {overview.volume.map((d) => {
              const maxGmv = Math.max(...overview.volume.map((x) => Number(x.gmv)), 1);
              return (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', height: '100%' }} title={`${String(d.day).slice(0, 10)}: GMV ${gbp(d.gmv)} · fees ${gbp(d.fee_revenue)}`}>
                  <div style={{ height: `${(Number(d.gmv) / maxGmv) * 100}%`, background: 'linear-gradient(180deg, rgba(212,175,55,0.8), rgba(212,175,55,0.15))', borderRadius: 2 }} />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {vat && vat.length > 0 && (
        <>
          <h3 style={{ color: '#D4AF37', fontSize: 12, letterSpacing: '0.15em' }}>VAT REPORTING (PLATFORM FEE VAT — RETAIL FARES NEVER CARRY VAT)</h3>
          <table className="sd-table" style={{ width: '100%', maxWidth: 640 }}>
            <thead><tr><th>PERIOD</th><th>FEE NET</th><th>VAT</th><th>GROSS</th></tr></thead>
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
        </>
      )}
    </div>
  );
};

const Metric = ({ label, value }) => (
  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 8, padding: '12px 14px' }}>
    <div style={{ fontSize: 9, color: '#888', letterSpacing: '0.1em' }}>{label}</div>
    <div style={{ fontSize: 18, color: '#D4AF37', fontWeight: 700, marginTop: 4 }}>{value}</div>
  </div>
);

export default PlatformFinancials;
