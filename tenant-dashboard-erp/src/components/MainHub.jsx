import React, { useContext, useState } from 'react';
import { RoleContext } from '../App';
import './MainHub.css';

const MainHub = ({ onOpenDispatch }) => {
  const { role } = useContext(RoleContext);
  const [mapExpanded, setMapExpanded] = useState(false);

  return (
    <div className={`main-hub ${mapExpanded ? 'map-fullscreen' : ''}`}>
      
      {/* Financial Snapshots (Hidden from Dispatcher) */}
      {role === 'Super_Admin' && !mapExpanded && (
        <div className="financial-row">
          <div className="surface-panel fin-card">
            <h4>Net Profit (MTD)</h4>
            <div className="metric text-success">£14,250</div>
          </div>
          <div className="surface-panel fin-card">
            <h4>Operating Expenses</h4>
            <div className="metric text-danger">£4,820</div>
          </div>
          <div className="surface-panel fin-card">
            <h4>Escrow Clearing</h4>
            <div className="metric text-gold">£2,100</div>
          </div>
        </div>
      )}

      <div className="hub-content-split">
        {/* Alerts Column */}
        {!mapExpanded && (
          <div className="alerts-column flex-col gap-md">
            <h3>Ecosystem Warnings</h3>
            <div className="surface-panel alert-box">
              <span className="icon">⚠️</span>
              <div className="alert-text">
                <strong>Chauffeur [David K.]</strong> - Private Hire Badge expires in 12 days!
              </div>
            </div>
            <div className="surface-panel alert-box">
              <span className="icon">⚠️</span>
              <div className="alert-text">
                <strong>Vehicle [Mercedes V-Class - LN26 XCC]</strong> - Fleet Insurance due in 5 days!
              </div>
            </div>
          </div>
        )}

        {/* Fleet Radar Widget */}
        <div 
          className={`radar-widget surface-panel ${mapExpanded ? 'expanded' : ''}`}
          onClick={() => !mapExpanded && setMapExpanded(true)}
        >
          <div className="radar-header">
            <h3>Live Fleet Radar</h3>
            {mapExpanded && (
              <button className="btn-outline" onClick={(e) => { e.stopPropagation(); setMapExpanded(false); }}>
                Collapse Map
              </button>
            )}
          </div>
          <div className="radar-map-mock">
            <div className="radar-grid"></div>
            {/* Mock Targets */}
            <div className="target t1 pulse">🚘</div>
            <div className="target t2 pulse">🚘</div>
            <div className="target t3 pulse">🚘</div>
          </div>
          {!mapExpanded && (
            <div className="radar-overlay-hint">Click to expand live map</div>
          )}
        </div>
      </div>

    </div>
  );
};

export default MainHub;
