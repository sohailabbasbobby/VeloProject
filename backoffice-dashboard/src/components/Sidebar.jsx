import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'liquidity', label: 'Liquidity Tower', icon: '🏦' },
    { id: 'escrow', label: 'Escrow & Disputes', icon: '⚖️' },
    { id: 'stripe', label: 'Stripe Splits Ledger', icon: '💳' },
    { id: 'deployment', label: 'Tenant Deployment', icon: '🚀' },
  ];

  return (
    <aside className="bo-sidebar">
      <div className="bo-sidebar-logo">
        <div className="logo-text">VELO</div>
        <div className="logo-subtext">MASTER CONTROL TOWER</div>
      </div>

      <nav className="bo-sidebar-nav">
        {tabs.map(tab => (
          <button 
            key={tab.id}
            className={`bo-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="bo-sidebar-footer text-muted">
        Velo Network v3.1.4<br/>
        Auth: Super_Admin
      </div>
    </aside>
  );
};

export default Sidebar;
