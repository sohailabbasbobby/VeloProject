import React, { useContext } from 'react';
import { RoleContext } from '../App';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { role } = useContext(RoleContext);

  const tabs = [
    // Internal Tabs
    { id: 'overview', label: 'Overview', icon: '📊', roles: ['Super_Admin', 'Dispatcher'] },
    { id: 'b2b', label: 'B2B Open Pool', icon: '🌐', roles: ['Super_Admin', 'Dispatcher'] },
    { id: 'comms', label: 'Comm Hub', icon: '💬', roles: ['Super_Admin', 'Dispatcher'] },
    { id: 'fleet_vault', label: 'Fleet Vault', icon: '🚘', roles: ['Super_Admin', 'Dispatcher'] },
    { id: 'staff', label: 'Staff / HR', icon: '👥', roles: ['Super_Admin'] },
    { id: 'expenses', label: 'Expenses', icon: '🧾', roles: ['Super_Admin'] },
    
    // Corporate Tabs
    { id: 'corp_analytics', label: 'Analytics Hub', icon: '📈', roles: ['Corporate_Client'] },
    { id: 'corp_trips', label: 'Trip Lifecycle', icon: '🚘', roles: ['Corporate_Client'] },
    { id: 'corp_roster', label: 'Company Roster', icon: '🏢', roles: ['Corporate_Client'] },
    { id: 'corp_wallet', label: 'Wallet & Billing', icon: '💼', roles: ['Corporate_Client'] },
  ];

  return (
    <aside className="erp-sidebar">
      <div className="sidebar-logo">
        <div className="logo-placeholder">VELO</div>
      </div>

      <nav className="sidebar-nav">
        {tabs.filter(tab => tab.roles.includes(role)).map(tab => (
          <button 
            key={tab.id}
            className={`nav-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            <span className="icon">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        {role === 'Super_Admin' && (
          <button className="nav-tab settings-btn">
            <span className="icon">⚙️</span>
            <span>Settings</span>
          </button>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
