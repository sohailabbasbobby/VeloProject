import React from 'react';
import { LineChart, PieChart } from 'lucide-react';
import { MOCK_FINANCIALS } from '../data/mockDatabase';
import './SystemModules.css';

const FinancialDashboard = () => {
  const maxRev = Math.max(...MOCK_FINANCIALS.monthlyData.map(d => d.revenue));

  return (
    <div className="system-module-container">
      <div className="system-header">
        <div>
          <h2 className="system-title">FINANCIAL INTELLIGENCE & COMPLIANCE</h2>
          <div className="system-subtitle">Revenue, Tax Liability & Operational Costs</div>
        </div>
        <LineChart size={24} color="var(--color-gold)" />
      </div>

      <div className="fin-metrics-grid">
        <div className="fin-metric-card">
          <span className="fin-metric-label">REVENUE (MTD)</span>
          <span className="fin-metric-value">{MOCK_FINANCIALS.revenueThisMonth}</span>
        </div>
        <div className="fin-metric-card">
          <span className="fin-metric-label">EXPENSES (MTD)</span>
          <span className="fin-metric-value text-danger" style={{ color: '#FF3B30' }}>{MOCK_FINANCIALS.expensesThisMonth}</span>
        </div>
        <div className="fin-metric-card">
          <span className="fin-metric-label">TAX LIABILITY</span>
          <span className="fin-metric-value" style={{ color: '#ffffff' }}>{MOCK_FINANCIALS.taxLiability}</span>
        </div>
      </div>

      <div className="fin-charts">
        <div className="fin-chart-panel">
          <div className="system-card-header">
            <span className="system-card-title">6-Month Revenue vs Expenses</span>
            <span className="system-card-badge badge-progress">LIVE</span>
          </div>
          <div className="css-bar-chart">
            {MOCK_FINANCIALS.monthlyData.map((data, i) => {
              const revPercent = (data.revenue / maxRev) * 100;
              const expPercent = (data.expenses / maxRev) * 100;
              return (
                <div key={i} className="css-bar-group">
                  <div style={{ display: 'flex', width: '100%', gap: '2px', alignItems: 'flex-end', height: '150px', justifyContent: 'center' }}>
                    <div className="css-bar" style={{ height: `${revPercent}%`, maxWidth: '20px' }}></div>
                    <div className="css-bar expense" style={{ height: `${expPercent}%`, maxWidth: '20px', background: '#FF3B30' }}></div>
                  </div>
                  <span className="css-bar-label">{data.month}</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', background: 'var(--color-gold)' }}></div>
              <span style={{ fontSize: '10px', color: '#888' }}>REVENUE</span>
            </div>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <div style={{ width: '12px', height: '12px', background: '#FF3B30' }}></div>
              <span style={{ fontSize: '10px', color: '#888' }}>EXPENSES</span>
            </div>
          </div>
        </div>

        <div className="fin-chart-panel">
          <div className="system-card-header mb-md">
            <span className="system-card-title">Upcoming Compliance</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '24px' }}>
            {MOCK_FINANCIALS.complianceDeadlines.map((deadline, i) => (
              <div key={i} style={{ padding: '16px', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '8px', borderLeft: '3px solid #FF3B30' }}>
                <div style={{ color: '#FF3B30', fontSize: '12px', fontWeight: 'bold' }}>{deadline.date}</div>
                <div style={{ color: '#fff', fontSize: '14px', marginTop: '4px' }}>{deadline.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default FinancialDashboard;
