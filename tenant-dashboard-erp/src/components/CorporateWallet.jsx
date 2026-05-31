import React from 'react';
import './CorporateWallet.css';

const CorporateWallet = () => {
  return (
    <div className="corporate-wallet">
      <div className="corp-header">
        <h2>Account & Wallet</h2>
        <p className="text-muted">Corporate credit allocations and billing cycle tracking.</p>
      </div>

      <div className="wallet-grid">
        
        <div className="wallet-card surface-panel">
          <h3>Line of Credit Setup</h3>
          <div className="allocation-status mt-4">
            <span className="icon text-gold">🧾</span>
            <div className="status-text">
              <strong>MONTHLY CORPORATE INVOICE</strong>
              <div className="text-muted text-sm mt-2">All trips are billed on a Net-30 cycle directly to Acme Corp Accounts Payable.</div>
            </div>
          </div>
        </div>

        <div className="wallet-card surface-panel">
          <h3>Current Cycle Usage</h3>
          <div className="usage-meter mt-4">
            <div className="usage-labels flex-row space-between">
              <span>£4,850.00 Used</span>
              <span className="text-muted">£10,000.00 Limit</span>
            </div>
            <div className="progress-bar-bg mt-2">
              <div className="progress-bar-fill" style={{ width: '48.5%' }}></div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};

export default CorporateWallet;
