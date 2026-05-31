import React, { useState, createContext, useContext } from 'react';
import Sidebar from './components/Sidebar';
import MainHub from './components/MainHub';
import B2BPool from './components/B2BPool';
import StaffRoster from './components/StaffRoster';
import CommHub from './components/CommHub';
import DispatchModal from './components/DispatchModal';
import FleetVault from './components/FleetVault';

// Corporate Client Components
import CorporateAnalytics from './components/CorporateAnalytics';
import CorporateTrips from './components/CorporateTrips';
import CorporateRoster from './components/CorporateRoster';
import CorporateWallet from './components/CorporateWallet';
import { TenantTaxProfilePanel } from './components/TenantTaxProfilePanel';

import './App.css';

// RBAC Context
export const RoleContext = createContext();

function App() {
  const [role, setRole] = useState('Super_Admin'); // 'Super_Admin' | 'Dispatcher'
  const [activeTab, setActiveTab] = useState('overview'); // overview, b2b, staff, expenses, comms
  const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="erp-layout">
        
        <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="erp-main-content">
          {/* Top Bar with Dev Toggle */}
          <header className="erp-header">
            <h1 className="view-title">
              {/* Internal Roles */}
              {activeTab === 'overview' && 'Overview & Live Map'}
              {activeTab === 'b2b' && 'B2B Open Pool'}
              {activeTab === 'staff' && 'Staff & Roster'}
              {activeTab === 'expenses' && 'Expense Ledger'}
              {activeTab === 'comms' && 'Comm Hub'}
              
              {/* Corporate Role */}
              {activeTab === 'corp_analytics' && 'Corporate Analytics & Booking'}
              {activeTab === 'corp_trips' && 'Trip Lifecycle Matrix'}
              {activeTab === 'corp_roster' && 'Corporate Travel Roster'}
              {activeTab === 'corp_wallet' && 'Account & Wallet'}
            </h1>
            
            <div className="header-actions">
              <button className="btn-primary" onClick={() => setDispatchModalOpen(true)}>
                ➕ Create New Job
              </button>
              
              <div className="rbac-toggle">
                <span className="text-muted text-sm mr-2">Dev Role Mask:</span>
                <select 
                  value={role} 
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value === 'Dispatcher' && ['staff', 'expenses'].includes(activeTab)) {
                      setActiveTab('overview');
                    }
                  }}
                  className="role-select"
                >
                  <option value="Super_Admin">Super Admin</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Corporate_Client">Corporate Client</option>
                </select>
              </div>
            </div>
          </header>

          <div className="erp-canvas">
            {/* Internal Routes */}
            {activeTab === 'overview' && <MainHub onOpenDispatch={() => setDispatchModalOpen(true)} />}
            {activeTab === 'b2b' && <B2BPool />}
            {activeTab === 'staff' && <StaffRoster />}
            {activeTab === 'expenses' && <div className="placeholder-view">Expense Ledger View</div>}
            {activeTab === 'tax_profile' && <TenantTaxProfilePanel />}
            {activeTab === 'fleet_vault' && <FleetVault />}
            {activeTab === 'comms' && <CommHub />}

            {/* Corporate Routes */}
            {activeTab === 'corp_analytics' && <CorporateAnalytics />}
            {activeTab === 'corp_trips' && <CorporateTrips />}
            {activeTab === 'corp_roster' && <CorporateRoster />}
            {activeTab === 'corp_wallet' && <CorporateWallet />}
          </div>
        </main>

        {isDispatchModalOpen && (
          <DispatchModal onClose={() => setDispatchModalOpen(false)} />
        )}

      </div>
    </RoleContext.Provider>
  );
}

export default App;
