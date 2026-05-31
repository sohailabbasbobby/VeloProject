import React, { useState } from 'react';
import OnboardingCanvas from './components/OnboardingCanvas';
import HomeScreen from './components/HomeScreen';
import TravelLedger from './components/TravelLedger';
import MessagingVault from './components/MessagingVault';
import './App.css';

function App() {
  const [appState, setAppState] = useState('ONBOARDING'); // ONBOARDING, HOME, LEDGER, MESSAGING
  const [isTripActive, setIsTripActive] = useState(false);

  return (
    <div className="app-container" data-tenant="velo-master">
      {/* Dynamic White-Label Engine hook (in a real app, this would be a ThemeProvider) */}
      
      {appState === 'ONBOARDING' && (
        <OnboardingCanvas onComplete={() => setAppState('HOME')} />
      )}

      {appState === 'HOME' && (
        <HomeScreen 
          isTripActive={isTripActive} 
          onOpenProfile={() => alert('Opening Executive Profile Settings')}
        />
      )}

      {appState === 'LEDGER' && (
        <TravelLedger 
          onTrackLive={() => {
            setIsTripActive(true);
            setAppState('HOME');
          }}
        />
      )}

      {appState === 'MESSAGING' && (
        <MessagingVault />
      )}

      {/* Global Bottom Navigation (hidden during onboarding) */}
      {appState !== 'ONBOARDING' && (
        <nav className="bottom-nav">
          <button 
            className={`nav-btn ${appState === 'HOME' ? 'active' : ''}`}
            onClick={() => setAppState('HOME')}
          >
            <span className="icon">🗺️</span>
            <span className="label">Dashboard</span>
          </button>
          
          <button 
            className={`nav-btn ${appState === 'LEDGER' ? 'active' : ''}`}
            onClick={() => setAppState('LEDGER')}
          >
            <span className="icon">🧾</span>
            <span className="label">Ledger</span>
          </button>
          
          <button 
            className={`nav-btn ${appState === 'MESSAGING' ? 'active' : ''}`}
            onClick={() => setAppState('MESSAGING')}
          >
            <span className="icon">💬</span>
            <span className="label">Vault</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
