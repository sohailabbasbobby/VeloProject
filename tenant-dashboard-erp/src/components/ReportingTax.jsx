import React, { useCallback, useState } from 'react';
import './ReportingTax.css';
import { fetchVatReport, fetchMasterLedger, usePolling } from '../utils/api';

/**
 * REPORTING & TAXATION — fully live (final-mile pass).
 * Revenue breakdown, VAT forecast and the driver payout manifest come from the
 * real financial endpoints. CSV export downloads the actual VAT report rows.
 */
const gbp = (n) => `£${Number(n || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ReportingTax = () => {
  const loadVat = useCallback(() => fetchVatReport(), []);
  const { data: vat, error, loading } = usePolling(loadVat, 60000);
  const loadLedger = useCallback(() => fetchMasterLedger(), []);
  const { data: ledger } = usePolling(loadLedger, 60000);
  const [exporting, setExporting] = useState(false);

  // vatReport returns per-period rows: { period, fee_net, fee_vat, fee_gross }.
  const vatRows = Array.isArray(vat) ? vat : [];
  const current = vatRows[0] || {};
  const vatData = {
    fee_net: current.fee_net,
    fee_vat: current.fee_vat,
    fee_gross: current.fee_gross,
  };

  const payouts = (ledger && ledger.payouts) || [];
  const invoices = (ledger && ledger.invoices) || [];

  const exportCsv = (rows, filename, columns) => {
    setExporting(true);
    try {
      const header = columns.map(c => c.label).join(',');
      const body = rows.map(r => columns.map(c => `"${String(r[c.key] ?? '').replace(/"/g, '""')}"`).join(','));
      const blob = new Blob([[header, ...body].join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="reporting-tax-container">
      
      <div className="report-header">
        <div>
          <h1 className="text-gold">Reporting & Taxation</h1>
          <p className="text-muted">Generate HMRC-compliant financial exports and operational reports.</p>
        </div>
      </div>

      <div className="report-layout">
        
        {/* Export Modules — real data exports */}
        <div className="export-modules surface-panel">
          <h3 className="mb-md">One-Click Exports</h3>
          
          <div className="export-card">
            <div className="flex-col">
              <span className="font-bold">HMRC VAT Return (current period)</span>
              <span className="text-xs text-muted">{invoices.length} live invoice rows · platform-fee VAT only (UK rule §0.9).</span>
            </div>
            <button
              className="btn-outline"
              disabled={exporting || invoices.length === 0}
              onClick={() => exportCsv(invoices, `velo-vat-${new Date().toISOString().slice(0, 10)}.csv`, [
                { key: 'invoice_number', label: 'invoice_number' },
                { key: 'created_at', label: 'created_at' },
                { key: 'customer_retail_fare', label: 'customer_retail_fare' },
                { key: 'platform_fee_net', label: 'platform_fee_net' },
                { key: 'platform_fee_vat', label: 'platform_fee_vat' },
                { key: 'driver_net_payout', label: 'driver_net_payout' },
                { key: 'status', label: 'status' },
              ])}
            >
              Generate CSV
            </button>
          </div>

          <div className="export-card">
            <div className="flex-col">
              <span className="font-bold">Driver Payout Manifest</span>
              <span className="text-xs text-muted">{payouts.length} live payout rows from the ledger.</span>
            </div>
            <button
              className="btn-outline"
              disabled={exporting || payouts.length === 0}
              onClick={() => exportCsv(payouts, `velo-payouts-${new Date().toISOString().slice(0, 10)}.csv`, [
                { key: 'driver_id', label: 'driver_id' },
                { key: 'amount', label: 'amount' },
                { key: 'method', label: 'method' },
                { key: 'status', label: 'status' },
                { key: 'executed_at', label: 'executed_at' },
              ])}
            >
              Export to Payroll
            </button>
          </div>

          <div className="export-card">
            <div className="flex-col">
              <span className="font-bold">Corporate Invoicing</span>
              <span className="text-xs text-muted">Consolidated end-of-month statements from live invoices.</span>
            </div>
            <button
              className="btn-outline"
              disabled={exporting || invoices.length === 0}
              onClick={() => exportCsv(invoices.filter(i => i.corporate_account_id), `velo-corporate-invoices-${new Date().toISOString().slice(0, 10)}.csv`, [
                { key: 'invoice_number', label: 'invoice_number' },
                { key: 'corporate_account_id', label: 'corporate_account_id' },
                { key: 'customer_retail_fare', label: 'customer_retail_fare' },
                { key: 'status', label: 'status' },
              ])}
            >
              Batch Generate CSV
            </button>
          </div>
        </div>

        {/* Financial Visuals — real numbers */}
        <div className="report-visuals">
          <div className="surface-panel flex-1 flex-col justify-center align-center">
            <h3 className="w-100 text-left mb-md">Revenue Breakdown (live)</h3>
            {error && <div style={{ color: 'var(--color-danger)' }} className="text-sm p-md">Live link error: {error.message}</div>}
            {loading && !vat && <div className="text-muted p-md text-sm">Loading live financials…</div>}
            {vatData && (
              <>
                <div className="mock-donut-chart">
                  <div className="donut-hole">
                    <span className="font-bold text-gold">{gbp(vatData.fee_gross)}</span>
                    <span className="text-xs text-muted">Platform Fees (current period)</span>
                  </div>
                </div>
                <div className="flex-row gap-md mt-4 text-sm">
                  <span><span className="dot dot-gold inline-block"></span> Net: {gbp(vatData.fee_net)}</span>
                  <span><span className="dot dot-blue inline-block"></span> VAT: {gbp(vatData.fee_vat)}</span>
                </div>
              </>
            )}
          </div>

          <div className="surface-panel flex-1 flex-col">
            <h3 className="mb-md">Tax Liability Forecast (live)</h3>
            <div className="tax-item">
              <span>VAT Due on Platform Fees (20%)</span>
              <span className="text-danger font-bold">{gbp(vatData.fee_vat)}</span>
            </div>
            <div className="tax-item">
              <span>Net Platform Fees</span>
              <span className="text-gold font-bold">{gbp(vatData.fee_net)}</span>
            </div>
            <div className="mt-4 p-md" style={{borderLeft: '3px solid var(--color-electric-blue)', backgroundColor: 'rgba(52, 199, 235, 0.05)'}}>
              <p className="text-sm">VAT applies strictly to the platform's extracted fee per the locked UK financial-compliance rule — customer fares carry no direct VAT line.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default ReportingTax;
