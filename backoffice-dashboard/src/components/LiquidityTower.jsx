import React from 'react';
import './LiquidityTower.css';

const LiquidityTower = () => {
  return (
    <div className="liquidity-tower">
      
      <div className="view-header">
        <h2>Master Network Liquidity Tower</h2>
        <p className="text-muted">Real-time aggregate escrow metrics and operational network volume.</p>
      </div>

      <div className="tower-grid">
        
        <div className="metric-block surface-panel">
          <h4>Total Vault Escrow</h4>
          <div className="metric-value font-mono">£642,850.00</div>
          <div className="metric-subtext">Cumulative passenger funds locked in execution pipeline</div>
        </div>

        <div className="metric-block surface-panel">
          <h4>Active Tenant Wallets</h4>
          <div className="metric-value font-mono">£184,310.00</div>
          <div className="metric-subtext">Combined solvent balances of prepaid tenant accounts</div>
        </div>

        <div className="metric-block surface-panel border-gold">
          <h4>Platform Fees (MTD)</h4>
          <div className="metric-value font-mono text-gold">£14,840.00</div>
          <div className="metric-subtext">Real-time accumulator tracking £1 platform transaction fees</div>
        </div>

        <div className="metric-block surface-panel">
          <h4>Open Pool Job Liquidity</h4>
          <div className="metric-value font-mono">42 Active Jobs</div>
          <div className="metric-subtext">
            ⚡ Avg Network Fill Time: <span className="text-success font-bold">3.4 Mins</span>
          </div>
        </div>

      </div>

    </div>
  );
};

export default LiquidityTower;
