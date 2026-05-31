import React, { useState } from 'react';
import SwipeSlider from './SwipeSlider';
import './SidebarDrawer.css';

const SidebarDrawer = ({ isOpen, onClose, onGoOffline, onReportDefect, onLogShiftExpense, onViewJobHistory, onViewRoster, onViewMessaging }) => {
  const [payMode, setPayMode] = useState('commission'); // 'commission' or 'salary'
  
  const [navEngine, setNavEngine] = useState('waze');

  if (!isOpen) return null;

  return (
    <div className="sidebar-overlay">
      <div className="sidebar-backdrop" onClick={onClose}></div>
      <div className="sidebar-panel">
        
        {/* Profile Header */}
        <div className="profile-header">
          <div className="avatar-frame"></div>
          <div className="profile-details">
            <h2 className="text-gold">Mr. Bobby</h2>
            <p className="text-muted text-sm">Chauffeur ID #V-4092</p>
            <div className="status-badge-small mt-xs">
              <span className="dot online"></span>
              <span>Online</span>
            </div>
          </div>
        </div>

        {/* Navigation Links */}
        <div className="nav-links">
          <button className="nav-item" onClick={onClose}>
            <span className="icon">🗺️</span>
            <span>Active Radar Canvas</span>
          </button>
          
          <button className="nav-item" onClick={() => { onClose(); onViewRoster(); }}>
            <span className="icon">📅</span>
            <span>My Upcoming Roster</span>
          </button>

          <button className="nav-item" onClick={() => { onClose(); onViewMessaging(); }}>
            <span className="icon">💬</span>
            <span>Live Dispatch Chat</span>
          </button>
          
          <button className="nav-item disabled">
            <span className="icon">🌐</span>
            <span>B2B Open Pool Board</span>
            <span className="padlock">🔒</span>
          </button>
          
          <div className="nav-item-group">
            <div className="nav-item-header">
              <span className="icon">🧾</span>
              <span>My Earnings & Timesheets</span>
            </div>
            
            <div className="payment-toggle">
              <button 
                className={payMode === 'commission' ? 'active' : ''} 
                onClick={() => setPayMode('commission')}
              >
                Commission
              </button>
              <button 
                className={payMode === 'salary' ? 'active' : ''} 
                onClick={() => setPayMode('salary')}
              >
                Salaried
              </button>
            </div>

            <div className="payment-view">
              {payMode === 'commission' ? (
                <div className="commission-ledger">
                  <p>Job ID #V-4923</p>
                  <p className="text-muted">Wholesale: £100 | <span className="text-success">Your Share: £70.00</span></p>
                </div>
              ) : (
                <div className="timesheet-ledger">
                  <p>Shift: 08:00 - 18:00</p>
                  <p className="text-muted">Hours: 10.0 | <span className="text-info">Overtime: 2.0</span></p>
                </div>
              )}
              <div className="tip-vault">
                <span>🎉 Uncapped Passenger Tip Vault: </span>
                <span className="text-gold font-bold">£145.00</span>
              </div>
            </div>
            
            <button className="nav-item" style={{ marginTop: '15px' }} onClick={onViewJobHistory}>
              <span className="icon">📜</span>
              <span>Retroactive Ledger & History</span>
            </button>
          </div>

          <div className="nav-item-group">
            <div className="nav-item-header">
              <span className="icon">🚘</span>
              <span>Assigned Vehicle</span>
            </div>
            <div className="meta-container">
              Mercedes-Benz S-Class (LN26 XAA)
            </div>
            <button className="nav-item" onClick={onLogShiftExpense} style={{ marginTop: '10px' }}>
              <span className="icon">⛽</span>
              <span>Log Shift Fuel & Wash</span>
            </button>
            <button className="nav-item" onClick={() => {
                onClose();
                onReportDefect();
            }} style={{ marginTop: '10px' }}>
              <span className="icon">⚠️</span>
              <span className="text-danger">Report Vehicle Issue</span>
            </button>
          </div>

          <div className="nav-item-group">
            <div className="nav-item-header">
              <span className="icon">⚙️</span>
              <span>App Navigation Settings</span>
            </div>
            <div className="radio-grid">
              <label className="radio-label">
                <input type="radio" checked={navEngine === 'waze'} onChange={() => setNavEngine('waze')} />
                <span>Waze (Default)</span>
              </label>
              <label className="radio-label">
                <input type="radio" checked={navEngine === 'google'} onChange={() => setNavEngine('google')} />
                <span>Google Maps</span>
              </label>
              <label className="radio-label">
                <input type="radio" checked={navEngine === 'apple'} onChange={() => setNavEngine('apple')} />
                <span>Apple Maps</span>
              </label>
            </div>
          </div>
        </div>

        {/* Baseline Slider */}
        <div className="sidebar-footer">
          <SwipeSlider 
            text="🟥 SLIDE TO GO OFFLINE" 
            color="var(--color-danger)" 
            onComplete={onGoOffline}
          />
        </div>

      </div>
    </div>
  );
};

export default SidebarDrawer;
