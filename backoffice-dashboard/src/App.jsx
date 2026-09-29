import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiquidityTower from './components/LiquidityTower';
import EscrowController from './components/EscrowController';
import StripeLedger from './components/StripeLedger';
import DeploymentPipeline from './components/DeploymentPipeline';
import { NetworkFeesConfigPanel } from './components/NetworkFeesConfigPanel';
import { SystemEnginePanel } from './components/SystemEnginePanel';
import TenantManagement from './components/TenantManagement';
import PoolOversight from './components/PoolOversight';
import PlatformFinancials from './components/PlatformFinancials';
import GlobalSettings from './components/GlobalSettings';
import PlatformHealth from './components/PlatformHealth';
import ComplianceOversight from './components/ComplianceOversight';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('tenants');

  return (
    <div className="backoffice-layout">

      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="backoffice-main-content">
        {/* Global Header */}
        <header className="backoffice-header">
          <div className="system-status">
            <span className="status-indicator"></span>
            Platform-Owner Master Admin · live from backend-core
          </div>

          <div className="admin-status">
            <span className="text-muted mr-4">Scope:</span>
            <strong>All Tenants · All Services</strong>
          </div>
        </header>

        <div className="backoffice-canvas">
          {activeTab === 'tenants' && <TenantManagement />}
          {activeTab === 'pool' && <PoolOversight />}
          {activeTab === 'financials' && <PlatformFinancials />}
          {activeTab === 'settings' && <GlobalSettings />}
          {activeTab === 'health' && <PlatformHealth />}
          {activeTab === 'compliance' && <ComplianceOversight />}
          {activeTab === 'liquidity' && <LiquidityTower />}
          {activeTab === 'escrow' && <EscrowController />}
          {activeTab === 'stripe' && <StripeLedger />}
          {activeTab === 'network_fees' && <NetworkFeesConfigPanel />}
          {activeTab === 'system_engine' && <SystemEnginePanel />}
          {activeTab === 'deployment' && <DeploymentPipeline />}
        </div>
        <div className="security-footer" style={{ padding: '10px 24px', textAlign: 'center', fontSize: 10, letterSpacing: '0.2em', color: '#D4AF37', borderTop: '1px solid rgba(212,175,55,0.15)' }}>
          VERIFIED BY VELO AI SECURITY PROTOCOL
        </div>
      </main>

    </div>
  );
}

export default App;
