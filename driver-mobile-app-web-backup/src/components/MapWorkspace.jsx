import React from 'react';
import SwipeSlider from './SwipeSlider';
import './MapWorkspace.css';

const MapWorkspace = ({ children, status, onGoOnBreak, toggleSidebar }) => {
  return (
    <div className="map-workspace">
      {/* Background tracking view canvas layer */}
      <div className="vector-road-lines">
        {/* Mock map road lines */}
        <div className="line l1"></div>
        <div className="line l2"></div>
        <div className="line l3"></div>
        
        {/* Golden pulsing marker */}
        <div className="car-marker pulse">
          <div className="marker-inner"></div>
        </div>
      </div>

      {/* Floating Header/Menu Button */}
      <div className="top-nav">
        <button className="btn-icon" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      {/* Default Lower Third Modal if idle */}
      {status === 'IDLE' && (
        <div className="idle-modal surface-panel">
          <div className="status-badge flex-row centered">
            <span className="dot online"></span>
            <span>STATUS: ONLINE & TRACKING</span>
          </div>
          <div className="idle-slider-container">
            <SwipeSlider 
              text="🟨 SLIDE RIGHT TO GO ON BREAK" 
              color="var(--color-warning)" 
              onComplete={onGoOnBreak}
            />
          </div>
        </div>
      )}

      {/* Overlays for Assignment / Active Ride injected as children */}
      {children}
    </div>
  );
};

export default MapWorkspace;
