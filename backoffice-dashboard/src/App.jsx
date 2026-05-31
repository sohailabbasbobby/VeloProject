import React, { useState } from 'react';
import Sidebar from './components/Sidebar';
import LiquidityTower from './components/LiquidityTower';
import EscrowController from './components/EscrowController';
import StripeLedger from './components/StripeLedger';
import DeploymentPipeline from './components/DeploymentPipeline';
import { NetworkFeesConfigPanel } from './components/NetworkFeesConfigPanel';
import { SystemEnginePanel } from './components/SystemEnginePanel';
import './App.css';

function App() {
  const [activeTab, setActiveTab] = useState('liquidity'); // liquidity, escrow, stripe, deployment

  return (
    <div className="backoffice-layout">
      
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="backoffice-main-content">
        {/* Global Header */}
        <header className="backoffice-header">
          <div className="system-status">
            <span className="status-indicator"></span>
            System Mode: <strong className="text-success ml-2">🟢 Healthy</strong>
          </div>
          
          <div className="admin-status">
            <span className="text-muted mr-4">Velo Core Admin Staff:</span>
            <strong>12 Online</strong>
          </div>
        </header>

        <div className="backoffice-canvas">
          {activeTab === 'liquidity' && <LiquidityTower />}
          {activeTab === 'escrow' && <EscrowController />}
          {activeTab === 'stripe' && <StripeLedger />}
          {activeTab === 'deployment' && <DeploymentPipeline />}
          {activeTab === 'network_fees' && <NetworkFeesConfigPanel />}
          {activeTab === 'system_engine' && <SystemEnginePanel />}
        </div>
      </main>

    </div>
  );
}

export default App;
