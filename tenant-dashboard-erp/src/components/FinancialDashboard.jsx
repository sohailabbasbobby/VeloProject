import React, { useState } from 'react';
import { LineChart, Download, Building, DollarSign } from 'lucide-react';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';
import { MOCK_GLOBAL_SETTINGS } from '../data/mockDatabase';
import './SystemModules.css';

const MOCK_LEDGER = [
  { id: 'TXN-9081', date: '2026-06-08', type: 'Incoming', payee: 'Goldman Sachs', amount: '$4,200', status: 'Cleared', hash: '0x9a8f...b34c', vatApplied: true, vatAmount: '$840.00' },
  { id: 'TXN-9080', date: '2026-06-07', type: 'Payout', payee: 'James Smith', amount: '$1,250', status: 'Pending', hash: '0x7b2a...d19f', vatApplied: false, vatAmount: '$0.00' },
  { id: 'TXN-9079', date: '2026-06-07', type: 'Payout', payee: 'Sarah Jenkins', amount: '$980', status: 'Pending', hash: '0x4c1e...a872', vatApplied: false, vatAmount: '$0.00' },
  { id: 'TXN-9078', date: '2026-06-06', type: 'Incoming', payee: 'J.P. Morgan', amount: '$6,500', status: 'Cleared', hash: '0x1f9d...e54b', vatApplied: true, vatAmount: '$1,300.00' },
  { id: 'TXN-9077', date: '2026-06-06', type: 'Expense', payee: 'Office Rent', amount: '$8,000', status: 'Cleared', hash: '0x8d3c...f01a', vatApplied: true, vatAmount: '$1,600.00' },
  { id: 'TXN-9076', date: '2026-06-05', type: 'Payout', payee: 'Marcus F.', amount: '$1,400', status: 'Cleared', hash: '0x3e5b...c68d', vatApplied: false, vatAmount: '$0.00' },
  { id: 'TXN-9075', date: '2026-06-05', type: 'Incoming', payee: 'Soho House', amount: '$2,800', status: 'Cleared', hash: '0x6a2f...9b4e', vatApplied: true, vatAmount: '$560.00' },
  { id: 'TXN-9074', date: '2026-06-04', type: 'Expense', payee: 'Mercedes-Benz London', amount: '$850', status: 'Cleared', hash: '0x5a2d...2f3e', vatApplied: true, vatAmount: '$170.00' },
];

const MOCK_PENDING_PAYOUTS = [
  { id: 'PAY-101', staff: 'James Smith', role: 'Driver', hours: '42h', rate: '$30/h', total: '$1,260' },
  { id: 'PAY-102', staff: 'Sarah Jenkins', role: 'Driver', hours: '38h', rate: '$30/h', total: '$1,140' },
  { id: 'PAY-103', staff: 'Julian R.', role: 'Operations', hours: '40h', rate: '$35/h', total: '$1,400' },
  { id: 'PAY-104', staff: 'Elena R.', role: 'Driver', hours: '20h', rate: '$30/h', total: '$600' },
];

const FinancialDashboard = () => {
  const { openSummaryModal } = useEntityLinker();
  const [activeTab, setActiveTab] = useState('ledger');
  const [bankSync, setBankSync] = useState(true);
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleExport = () => {
    showToast('Exporting Full Tax Summary (PDF/CSV)...');
  };

  const handleMassPayout = () => {
    showToast('Mass payout executed via Stripe Connect.');
  };

  return (
    <div className="system-module-container" style={{ position: 'relative' }}>
      <div className="system-header">
        <div>
          <h2 className="system-title">FINANCE HQ</h2>
          <div className="system-subtitle">Business Financial Command Center & Payroll</div>
        </div>
        <LineChart size={24} color="var(--color-gold)" />
      </div>

      <div className="fin-tabs">
        <div className={`fin-tab ${activeTab === 'ledger' ? 'active' : ''}`} onClick={() => setActiveTab('ledger')}>MASTER LEDGER</div>
        <div className={`fin-tab ${activeTab === 'payouts' ? 'active' : ''}`} onClick={() => setActiveTab('payouts')}>PAYOUT HUB</div>
        <div className={`fin-tab ${activeTab === 'tax' ? 'active' : ''}`} onClick={() => setActiveTab('tax')}>TAX & VAT</div>
        <div className={`fin-tab ${activeTab === 'hr' ? 'active' : ''}`} onClick={() => setActiveTab('hr')}>FINANCIAL & HR SETTINGS</div>
      </div>

      {activeTab === 'ledger' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="fin-metrics-grid">
            <div className="fin-metric-card">
              <span className="fin-metric-label">INCOMING PAYMENTS (MTD)</span>
              <span className="fin-metric-value text-active" style={{ color: '#34C759' }}>$48,500</span>
            </div>
            <div className="fin-metric-card">
              <span className="fin-metric-label">OUTGOING EXPENSES (MTD)</span>
              <span className="fin-metric-value text-danger" style={{ color: '#FF3B30' }}>$18,400</span>
            </div>
            <div className="fin-metric-card">
              <span className="fin-metric-label">NET PROFIT</span>
              <span className="fin-metric-value" style={{ color: '#ffffff' }}>$30,100</span>
            </div>
          </div>

          <div className="fin-action-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: 'auto' }}>
              <span style={{ fontSize: '11px', color: '#888', fontWeight: 'bold' }}>BANK API SYNC</span>
              <div className={`mock-toggle ${bankSync ? 'active' : ''}`} onClick={() => setBankSync(!bankSync)} style={{ cursor: 'pointer' }}>
                <div className="toggle-knob"></div>
              </div>
            </div>
            <button className="btn-secondary" onClick={() => showToast('Opening Expense Modal...')}>+ Add Office Expense</button>
            <button className="btn-outline-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExport}>
              <Download size={14} /> Export Tax Summary
            </button>
          </div>

          <div className="system-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <table className="fin-ledger-table">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Payee / Client / Staff</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Crypto Hash (Log)</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEDGER.map(txn => (
                  <tr key={txn.id} style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                    title: 'Transaction Record', subtitle: txn.id, status: txn.status, icon: 'file',
                    primaryMetric: { label: 'AMOUNT', value: txn.amount },
                    fields: [
                      { label: 'Date', value: txn.date },
                      { label: 'Type', value: txn.type },
                      { label: 'Entity', value: txn.payee },
                      { label: 'Hash Log', value: txn.hash }
                    ]
                  })}>
                    <td><span style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>{txn.id}</span></td>
                    <td>{txn.date}</td>
                    <td>
                      <span className={`badge-${txn.type === 'Incoming' ? 'active' : txn.type === 'Expense' ? 'urgent' : 'progress'}`} style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '10px' }}>
                        {txn.type}
                      </span>
                    </td>
                    <td>
                      {txn.type === 'Payout' ? (
                        <EntityLink type={txn.payee === 'Julian R.' ? 'Staff' : 'Driver'}>{txn.payee}</EntityLink>
                      ) : txn.type === 'Incoming' ? (
                        <EntityLink type="Client">{txn.payee}</EntityLink>
                      ) : (
                        <span style={{ color: '#fff' }}>{txn.payee}</span>
                      )}
                    </td>
                    <td style={{ color: txn.type === 'Incoming' ? '#34C759' : '#FF3B30' }}>{txn.amount}</td>
                    <td><span className="badge-active" style={{ background: 'transparent', color: txn.status === 'Cleared' ? '#34C759' : '#D4AF37' }}>{txn.status}</span></td>
                    <td><span className="fin-hash">{txn.hash}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'payouts' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="system-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>Pending Cycle Payouts</h3>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Review and execute batch payouts for completed shifts.</p>
            </div>
            <button className="btn-primary" style={{ padding: '12px 24px', fontWeight: 'bold' }} onClick={handleMassPayout}>
              <DollarSign size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '8px' }} />
              MASS EXECUTE PAYOUTS
            </button>
          </div>

          <div className="system-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <table className="fin-ledger-table">
              <thead>
                <tr>
                  <th>PAY ID</th>
                  <th>Staff Member</th>
                  <th>Role</th>
                  <th>Cycle Hours</th>
                  <th>Base Rate</th>
                  <th>Total Payout</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_PENDING_PAYOUTS.map(pay => (
                  <tr key={pay.id}>
                    <td><span style={{ color: 'var(--color-gold)' }}>{pay.id}</span></td>
                    <td><EntityLink type={pay.role === 'Driver' ? 'Driver' : 'Staff'}>{pay.staff}</EntityLink></td>
                    <td><span style={{ color: '#fff' }}>{pay.role}</span></td>
                    <td>{pay.hours}</td>
                    <td>{pay.rate}</td>
                    <td style={{ fontWeight: 'bold', color: '#fff' }}>{pay.total}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'tax' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div className="system-card" style={{ padding: '24px', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ color: '#fff', marginBottom: '8px' }}>VAT Filing Report</h3>
              <p style={{ color: '#888', fontSize: '12px', margin: 0 }}>Automated aggregation of all VAT-applied transactions for tax compliance.</p>
            </div>
            <div style={{ display: 'flex', gap: '16px' }}>
              <select className="wl-input" style={{ width: '180px', padding: '8px', background: '#111', color: '#fff', border: '1px solid #333' }}>
                <option>Q2 2026</option>
                <option>Q1 2026</option>
                <option>FY 2025</option>
              </select>
              <button className="btn-outline-gold" style={{ display: 'flex', alignItems: 'center', gap: '8px' }} onClick={handleExport}>
                <Download size={14} /> Export CSV
              </button>
            </div>
          </div>

          <div className="fin-metrics-grid" style={{ marginBottom: '24px' }}>
            <div className="fin-metric-card" style={{ background: '#1A1A1A' }}>
              <span className="fin-metric-label">TOTAL TAXABLE INCOME</span>
              <span className="fin-metric-value text-active" style={{ color: '#34C759' }}>$13,500.00</span>
            </div>
            <div className="fin-metric-card" style={{ background: '#1A1A1A' }}>
              <span className="fin-metric-label">TOTAL VAT COLLECTED</span>
              <span className="fin-metric-value" style={{ color: 'var(--color-gold)' }}>$2,700.00</span>
            </div>
            <div className="fin-metric-card" style={{ background: '#1A1A1A' }}>
              <span className="fin-metric-label">TOTAL VAT PAID (EXPENSES)</span>
              <span className="fin-metric-value text-danger" style={{ color: '#FF3B30' }}>$1,770.00</span>
            </div>
          </div>

          <div className="system-card" style={{ flex: 1, padding: 0, overflow: 'hidden' }}>
            <table className="fin-ledger-table">
              <thead>
                <tr>
                  <th>TXN ID</th>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Entity</th>
                  <th>Subtotal</th>
                  <th>VAT Rate</th>
                  <th>VAT Amount</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_LEDGER.filter(t => t.vatApplied).map(txn => (
                  <tr key={txn.id}>
                    <td><span style={{ color: 'var(--color-gold)' }}>{txn.id}</span></td>
                    <td>{txn.date}</td>
                    <td>
                      <span className={`badge-${txn.type === 'Incoming' ? 'active' : 'urgent'}`} style={{ padding: '2px 6px', borderRadius: '2px', fontSize: '10px' }}>
                        {txn.type}
                      </span>
                    </td>
                    <td>{txn.payee}</td>
                    <td>{txn.amount}</td>
                    <td style={{ color: '#888' }}>{MOCK_GLOBAL_SETTINGS.VAT_RATE * 100}%</td>
                    <td style={{ color: 'var(--color-gold)' }}>{txn.vatAmount}</td>
                    <td style={{ fontWeight: 'bold' }}>
                      ${(parseFloat(txn.amount.replace(/[^0-9.-]+/g,"")) + parseFloat(txn.vatAmount.replace(/[^0-9.-]+/g,""))).toLocaleString('en-US', {minimumFractionDigits: 2})}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'hr' && (
        <div className="wl-config-panel" style={{ margin: '0' }}>
          <h3 style={{ color: '#fff', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px', marginBottom: '8px' }}>Global Financial & HR Settings</h3>
          <p style={{ fontSize: '12px', color: '#888', lineHeight: 1.5 }}>Define default hourly rates, contract terms, and global tax constants. Changes made will automatically propagate to all profiles and financial reports.</p>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '24px', marginTop: '16px' }}>
            <div className="wl-field-group">
              <label className="wl-label">GLOBAL VAT RATE (%)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', right: 12, top: 12, color: '#888' }}>%</span>
                <input type="number" className="wl-input" defaultValue={MOCK_GLOBAL_SETTINGS.VAT_RATE * 100} style={{ width: '100%' }} />
              </div>
            </div>
            <div className="wl-field-group">
              <label className="wl-label">CHAUFFEUR BASE RATE (HOURLY)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: 12, color: '#888' }}>$</span>
                <input type="number" className="wl-input" defaultValue="30" style={{ width: '100%', paddingLeft: 24 }} />
              </div>
            </div>
            <div className="wl-field-group">
              <label className="wl-label">DISPATCHER BASE RATE (HOURLY)</label>
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 12, top: 12, color: '#888' }}>$</span>
                <input type="number" className="wl-input" defaultValue="35" style={{ width: '100%', paddingLeft: 24 }} />
              </div>
            </div>
          </div>

          <div className="wl-field-group" style={{ marginTop: '16px' }}>
            <label className="wl-label">DEFAULT CONTRACT TERMS</label>
            <textarea className="wl-input" rows="4" defaultValue="Standard Independent Contractor Agreement V2.1. Net-30 payout structure. Non-disclosure attached." style={{ resize: 'vertical' }} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button className="btn-outline-gold" onClick={() => showToast('HR Settings Propagated System-wide.')}>SAVE & PROPAGATE</button>
          </div>
        </div>
      )}

      <div className="security-footer" style={{ marginTop: 'auto' }}>Verified by Velo AI Security Protocol</div>

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: '#34C759', color: '#000', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {toastMessage}
        </div>
      )}
    </div>
  );
};

export default FinancialDashboard;
