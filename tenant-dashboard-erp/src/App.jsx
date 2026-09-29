import React, { useState, useEffect, createContext } from 'react';
import CommandCenter from './components/CommandCenter';
import MainHub from './components/MainHub';
import B2BPool from './components/B2BPool';
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
import Header from './components/common/Header';
import { EntityLinkerProvider } from './contexts/EntityLinkerContext';

import './App.css';

// RBAC Context
export const RoleContext = createContext();

function App() {
  const [role, setRole] = useState('Super_Admin'); // 'Super_Admin' | 'Dispatcher' | 'Corporate_Client'
  const [activeTab, setActiveTab] = useState('command_center'); 
  const [isDispatchModalOpen, setDispatchModalOpen] = useState(false);
  const [isAutopilotActive, setIsAutopilotActive] = useState(false);
  const [resetKey, setResetKey] = useState(0);
  const [pendingSubView, setPendingSubView] = useState(null);

  // Cross-component navigation (e.g. CorporateRoster "Add Employee" → Corporate Accounts)
  useEffect(() => {
    const onVeloNavigate = (e) => {
      const tab = e.detail && e.detail.tab;
      if (!tab) return;
      if (tab === 'accounts') {
        // 'accounts' is a sub-view inside CommandCenter, not a top-level tab
        setActiveTab('command_center');
        setPendingSubView('accounts');
      } else {
        setActiveTab(tab);
      }
    };
    window.addEventListener('velo:navigate', onVeloNavigate);
    return () => window.removeEventListener('velo:navigate', onVeloNavigate);
  }, []);

  const handleHomeClick = () => {
    setActiveTab('command_center');
    setResetKey(prev => prev + 1);
  };

  return (
    <EntityLinkerProvider>
      <RoleContext.Provider value={{ role, setRole }}>
        <div className="erp-layout">
          
          <div className="erp-middle-column">
          {/* Top Command Hub */}
          <Header 
            role={role}
            setRole={setRole}
            handleHomeClick={handleHomeClick}
            setDispatchModalOpen={setDispatchModalOpen}
            isAutopilotActive={isAutopilotActive}
            setIsAutopilotActive={setIsAutopilotActive}
            setActiveTab={setActiveTab}
          />

          <main className="erp-main-content">
            <div className="erp-canvas">
              {/* Internal Routes */}
              {activeTab === 'command_center' && (
                <CommandCenter
                  key={resetKey}
                  pendingSubView={pendingSubView}
                  onConsumePendingSubView={() => setPendingSubView(null)}
                />
              )}
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
    </EntityLinkerProvider>
  );
}

export default App;
