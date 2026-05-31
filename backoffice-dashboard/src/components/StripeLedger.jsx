import React from 'react';
import './StripeLedger.css';

const StripeLedger = () => {
  const ledgerData = [
    { id: 'TRD-901', total: 850.00, originSplit: 85.00, fulfillSplit: 763.00, platform: 2.00, route: 'Stripe Connect Intent' },
    { id: 'TRD-902', total: 120.00, originSplit: 120.00, fulfillSplit: 0.00, platform: 2.00, route: 'Stripe Connect Intent' },
    { id: 'TRD-904', total: 340.00, originSplit: 51.00, fulfillSplit: 287.00, platform: 2.00, route: 'Prepaid Wallet Subtraction' },
  ];

  return (
    <div className="stripe-ledger">
      
      <div className="view-header flex-row space-between">
        <div>
          <h2>Stripe Connect Split-Clearing Ledger</h2>
          <p className="text-muted">Transparent accounting view verifying post-ride revenue division.</p>
        </div>
        
        <div className="status-widget surface-panel">
          <div className="status-title">Next Network Automated Clearing ACH Cycle</div>
          <div className="status-time font-mono">Sunday at 23:59 GMT</div>
          <div className="status-router">ACH Router: <span className="text-success font-bold">ACTIVE 🟢</span></div>
        </div>
      </div>

      <div className="ledger-table-wrapper surface-panel">
        <table className="data-table ledger-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Total Retail Fare</th>
              <th>Originator Split</th>
              <th>Fulfiller Payout</th>
              <th className="text-gold">Platform Fee Captured</th>
              <th>Disbursal Route</th>
            </tr>
          </thead>
          <tbody>
            {ledgerData.map(row => (
              <tr key={row.id}>
                <td className="font-mono">{row.id}</td>
                <td className="font-mono">£{row.total.toFixed(2)}</td>
                <td className="font-mono text-action">£{row.originSplit.toFixed(2)}</td>
                <td className="font-mono text-success">£{row.fulfillSplit.toFixed(2)}</td>
                <td className="font-mono text-gold font-bold">£{row.platform.toFixed(2)}</td>
                <td>
                  <span className="disbursal-badge">{row.route}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default StripeLedger;
