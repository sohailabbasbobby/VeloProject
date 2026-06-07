import React, { useState, createContext } from 'react';
import CommandCenter from './components/CommandCenter';
import MainHub from './components/MainHub';
import B2BPool from './components/B2BPool';
import StaffRoster from './components/StaffRoster';
import CommHub from './components/CommHub';
import DispatchModal from './components/DispatchModal';
import FleetVault from './components/FleetVault';
import AuditLedger from './components/AuditLedger';
import ReportingTax from './components/ReportingTax';
import AssignmentRota from './components/AssignmentRota';
import GeminiAIOperator from './components/GeminiAIOperator';
import { Zap, Plus, Bell, Settings, Shield, Home } from 'lucide-react';

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
  const [role, setRole] = useState('Super_Admin'); // 'Super_Admin' | 'Dispatcher' | 'Corporate_Client'
  const [activeTab, setActiveTab] = useState('command_center'); 
  const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  const handleHomeClick = () => {
    setActiveTab('command_center');
    setResetKey(prev => prev + 1);
  };

  return (
    <RoleContext.Provider value={{ role, setRole }}>
      <div className="erp-layout">
        
        <div className="erp-middle-column">
          {/* Top Command Hub */}
          <header className="erp-header">
            
            <div className="header-left flex-row align-center gap-md">
              <button className="btn-icon" onClick={handleHomeClick} title="Home Dashboard" style={{ padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none' }}>
                <Home size={24} color="#ffffff" className="hover-gold transition-all" />
              </button>
              <div className="brand-logo" style={{ cursor: 'pointer', marginLeft: '12px' }} onClick={handleHomeClick}>
                <Shield size={24} color="var(--color-gold)" />
                <span>VELO EXECUTIVE</span>
              </div>
            </div>
            
            <div className="header-actions">
              <button 
                className="btn-primary flex-row align-center gap-sm" 
                onClick={() => setDispatchModalOpen(true)}
              >
                <Plus size={16} /> New Dispatch
              </button>

              {role !== 'Corporate_Client' && (
                <button 
                  className={`btn-autopilot ${isAutopilotActive ? 'active' : ''}`} 
                  onClick={() => setIsAutopilotActive(!isAutopilotActive)}
                >
                  <Zap size={16} /> Autopilot {isAutopilotActive ? 'ON' : 'OFF'}
                </button>
              )}
              
              <div className="header-icons">
                <Bell size={20} className="hover-gold cursor-pointer" />
                <Settings size={20} className="hover-gold cursor-pointer" />
              </div>
              
              <div className="rbac-toggle">
                <select 
                  value={role} 
                  onChange={(e) => {
                    setRole(e.target.value);
                    if (e.target.value === 'Corporate_Client') {
                      setActiveTab('corp_analytics');
                    } else {
                      setActiveTab('command_center');
                    }
                  }}
                  className="role-select"
                >
                  <option value="Super_Admin">Super Admin</option>
                  <option value="Dispatcher">Dispatcher</option>
                  <option value="Corporate_Client">Corporate Client</option>
                </select>
                <div className="avatar-mock ml-2">
                   <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" />
                </div>
              </div>
            </div>
          </header>

          <main className="erp-main-content">
            <div className="erp-canvas">
              {/* Internal Routes */}
              {activeTab === 'command_center' && <CommandCenter key={resetKey} />}
              {activeTab === 'overview' && <MainHub onOpenDispatch={() => setDispatchModalOpen(true)} isAutopilotActive={isAutopilotActive} />}
              {activeTab === 'b2b' && <B2BPool />}
              {activeTab === 'tax_profile' && <TenantTaxProfilePanel />}
              {activeTab === 'comms' && <CommHub />}
              {activeTab === 'audit_ledger' && <AuditLedger />}
              {activeTab === 'reporting' && <ReportingTax />}
              {activeTab === 'rota' && <AssignmentRota />}

              {/* Corporate Routes */}
              {activeTab === 'corp_analytics' && <CorporateAnalytics />}
              {activeTab === 'corp_trips' && <CorporateTrips />}
              {activeTab === 'corp_roster' && <CorporateRoster />}
              {activeTab === 'corp_wallet' && <CorporateWallet />}
            </div>
          </main>
        </div>

        {/* Floating Gemini AI Operator Overlay */}
        <GeminiAIOperator />

        {isDispatchModalOpen && (
          <DispatchModal onClose={() => setDispatchModalOpen(false)} />
        )}

      </div>
    </RoleContext.Provider>
  );
}

export default App;
