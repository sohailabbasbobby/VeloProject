import React, { useState, useEffect } from 'react';
import './OnboardingCanvas.css';

const OnboardingCanvas = ({ onComplete }) => {
  const [authPhase, setAuthPhase] = useState('authenticating');

  useEffect(() => {
    // Simulate secure passkey delay
    const timer1 = setTimeout(() => {
      setAuthPhase('success');
      
      const timer2 = setTimeout(() => {
        onComplete();
      }, 2000); // Wait 2s to read welcome message before transitioning

      return () => clearTimeout(timer2);
    }, 2500);

    return () => clearTimeout(timer1);
  }, [onComplete]);

  return (
    <div className={`onboarding-canvas ${authPhase === 'success' ? 'auth-success' : ''}`}>
      <div className="branding-engine-placeholder">
        {/* Dynamic Logo Replacement target */}
        <div className="tenant-logo"></div>
      </div>
      
      <div className="auth-content">
        {authPhase === 'authenticating' ? (
          <div className="loading-state fade-in">
            <div className="spinner pulse"></div>
            <p className="auth-text">🔒 AUTHENTICATING VIA SECURE CORPORATE PASSKEY...</p>
          </div>
        ) : (
          <div className="success-state fade-in">
            <div className="welcome-avatar">
              [ J ]
            </div>
            <h1 className="welcome-greeting">
              Welcome back,<br />
              <span className="text-primary-brand">Mr. John</span>
            </h1>
            <p className="tenant-name">(Goldman Sachs Accounts Team)</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default OnboardingCanvas;
