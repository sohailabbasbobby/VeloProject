import React from 'react';
import './TravelLedger.css';

const TravelLedger = ({ onTrackLive }) => {
  return (
    <div className="travel-ledger">
      <div className="ledger-header">
        <h2>Travel Portfolio</h2>
      </div>

      <div className="ledger-timeline">
        
        {/* 15-Minute Mark: Live Tracking */}
        <div className="ledger-card surface-panel active-trip">
          <div className="trip-summary">
            <h3>✈️ Heathrow Terminal 5 Arrival</h3>
            <p className="trip-time">Today, 17:30 PM</p>
          </div>
          <div className="status-badge pulsing-action" onClick={onTrackLive}>
            📍 Chauffeur is Approaching. Tap here to track live coordinates.
          </div>
        </div>

        {/* 2-Hour Mark: Allocated */}
        <div className="ledger-card surface-panel">
          <div className="trip-summary">
            <h3>🏢 London Financial Roadshow</h3>
            <p className="trip-time">Tomorrow, 09:00 AM</p>
          </div>
          <div className="status-badge allocated">
            🚘 Chauffeur Allocated: Dave (Rating: ⭐4.98) - Silver Mercedes S-Class [Reg: LN26 XAA]
          </div>
        </div>

        {/* 48-Hour Mark: Confirmed */}
        <div className="ledger-card surface-panel">
          <div className="trip-summary">
            <h3>🏢 Paris Corporate Retreat</h3>
            <p className="trip-time">04 June 2026, 14:00 PM</p>
          </div>
          <div className="status-badge confirmed">
            🟩 Confirmed
          </div>
        </div>

      </div>
    </div>
  );
};

export default TravelLedger;
