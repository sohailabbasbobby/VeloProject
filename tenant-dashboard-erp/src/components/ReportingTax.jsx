import React from 'react';
import './ReportingTax.css';

const ReportingTax = () => {
  return (
    <div className="reporting-tax-container">
      
      <div className="report-header">
        <div>
          <h1 className="text-gold">Reporting & Taxation</h1>
          <p className="text-muted">Generate HMRC-compliant financial exports and operational reports.</p>
        </div>
      </div>

      <div className="report-layout">
        
        {/* Export Modules */}
        <div className="export-modules surface-panel">
          <h3 className="mb-md">One-Click Exports</h3>
          
          <div className="export-card">
            <div className="flex-col">
              <span className="font-bold">HMRC VAT Return (Q2 2026)</span>
              <span className="text-xs text-muted">Includes all eligible zero-rated B2B trips.</span>
            </div>
            <button className="btn-outline">Generate CSV</button>
          </div>

          <div className="export-card">
            <div className="flex-col">
              <span className="font-bold">Driver Payout Manifest</span>
              <span className="text-xs text-muted">Weekly run for owner-driver splits.</span>
            </div>
            <button className="btn-outline">Export to Payroll</button>
          </div>

          <div className="export-card">
            <div className="flex-col">
              <span className="font-bold">Corporate Invoicing</span>
              <span className="text-xs text-muted">Consolidated end-of-month statements.</span>
            </div>
            <button className="btn-outline">Batch Generate PDFs</button>
          </div>
        </div>

        {/* Financial Visuals */}
        <div className="report-visuals">
          <div className="surface-panel flex-1 flex-col justify-center align-center">
            <h3 className="w-100 text-left mb-md">Revenue Breakdown (MTD)</h3>
            <div className="mock-donut-chart">
              <div className="donut-hole">
                <span className="font-bold text-gold">£42.5K</span>
                <span className="text-xs text-muted">Total</span>
              </div>
            </div>
            <div className="flex-row gap-md mt-4 text-sm">
              <span><span className="dot dot-gold inline-block"></span> B2B (65%)</span>
              <span><span className="dot dot-blue inline-block"></span> B2C (35%)</span>
            </div>
          </div>

          <div className="surface-panel flex-1 flex-col">
            <h3 className="mb-md">Tax Liability Forecast</h3>
            <div className="tax-item">
              <span>Estimated VAT Due</span>
              <span className="text-danger font-bold">£6,400.00</span>
            </div>
            <div className="tax-item">
              <span>Corporation Tax Provision</span>
              <span className="text-gold font-bold">£4,250.00</span>
            </div>
            <div className="mt-4 p-md" style={{borderLeft: '3px solid var(--color-electric-blue)', backgroundColor: 'rgba(52, 199, 235, 0.05)'}}>
              <p className="text-sm">Smart Suggestion: Offset £1,200 of upcoming vehicle maintenance to reduce this quarter's tax liability.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ReportingTax;
