import React from 'react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const sections = [
    {
      title: 'PLATFORM OVERSIGHT',
      tabs: [
        { id: 'tenants', label: 'Tenant Management', icon: '🏢' },
        { id: 'pool', label: 'Cross-Tenant Pool', icon: '🌐' },
        { id: 'financials', label: 'Platform Financials', icon: '💷' },
        { id: 'compliance', label: 'Compliance Oversight', icon: '🛡️' },
      ],
    },
    {
      title: 'CONTROL',
      tabs: [
        { id: 'settings', label: 'Global Settings', icon: '⚙️' },
        { id: 'health', label: 'Platform Health', icon: '📊' },
        { id: 'network_fees', label: 'Fee Configuration', icon: '💳' },
        { id: 'escrow', label: 'Escrow & Disputes', icon: '⚖️' },
      ],
    },
    {
      title: 'LEGACY VIEWS',
      tabs: [
        { id: 'liquidity', label: 'Liquidity Tower', icon: '🏦' },
        { id: 'stripe', label: 'Stripe Splits Ledger', icon: '💠' },
        { id: 'system_engine', label: 'System Engine', icon: '🧠' },
        { id: 'deployment', label: 'Tenant Deployment', icon: '🚀' },
      ],
    },
  ];

  return (
    <aside className="bo-sidebar">
      <div className="bo-sidebar-logo">
        <div className="logo-text">VELO</div>
        <div className="logo-subtext">MASTER CONTROL TOWER</div>
      </div>

      <nav className="bo-sidebar-nav">
        {sections.map((section) => (
          <div key={section.title}>
            <div style={{ fontSize: 9, letterSpacing: '0.18em', color: '#666', padding: '10px 16px 4px' }}>{section.title}</div>
            {section.tabs.map((tab) => (
              <button
                key={tab.id}
                className={`bo-nav-tab ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
              >
                <span className="icon">{tab.icon}</span>
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="bo-sidebar-footer text-muted">
        Velo Network v3.1.4<br />
        Auth: Platform Owner
      </div>
    </aside>
  );
};

export default Sidebar;
