import React, { useState } from 'react';
import './BookingSheet.css';

const BookingSheet = () => {
  const [selectedVehicle, setSelectedVehicle] = useState('premium');
  const [personalCardEnabled, setPersonalCardEnabled] = useState(false);
  const [showCardEntry, setShowCardEntry] = useState(false);

  const vehicles = [
    { id: 'executive', name: 'Executive Tier', model: 'BMW 5' },
    { id: 'premium', name: 'Premium MPV Tier', model: 'Mercedes V-Class' },
    { id: 'first', name: 'First-Class Luxury', model: 'Mercedes S-Class' },
    { id: 'ultra', name: 'Ultra-Luxury Tier', model: 'Rolls-Royce' }
  ];

  return (
    <div className="bottom-sheet booking-sheet">
      
      {/* Address Inputs */}
      <div className="address-block">
        <div className="address-row">
          <span className="icon">📍</span>
          <input type="text" placeholder="Pickup Address" className="address-input" defaultValue="Goldman Sachs, Plumtree Court" />
        </div>
        <div className="address-divider"></div>
        <div className="address-row">
          <span className="icon">🏳️</span>
          <input type="text" placeholder="Dropoff Address" className="address-input" />
        </div>
      </div>

      {/* Vehicle Selector */}
      <div className="vehicle-selector">
        {vehicles.map(v => (
          <div 
            key={v.id} 
            className={`vehicle-card ${selectedVehicle === v.id ? 'selected' : ''}`}
            onClick={() => setSelectedVehicle(v.id)}
          >
            <div className="vehicle-name">{v.name}</div>
            <div className="vehicle-model">{v.model}</div>
          </div>
        ))}
      </div>

      {/* Payment Masking Dev Toggle (hidden in real app, driven by profile config) */}
      <div className="dev-toggle">
        <label>
          <input 
            type="checkbox" 
            checked={personalCardEnabled} 
            onChange={(e) => {
              setPersonalCardEnabled(e.target.checked);
              setShowCardEntry(false);
            }} 
          />
          <span className="text-muted text-xs ml-sm">Dev: Enable Personal Card Config</span>
        </label>
      </div>

      {/* Intelligent Payment Masking Workflow */}
      <div className="payment-workflow">
        {!personalCardEnabled ? (
          // Scenario Alpha: Locked to Corporate
          <button className="btn-primary flex-col centered">
            <span>🚀 REQUEST VEHICLE</span>
            <span className="btn-subtext">(BILLED TO CORPORATE CREDIT)</span>
          </button>
        ) : (
          // Scenario Beta: Personal Card Allowed
          <div className="personal-billing-container">
            {!showCardEntry ? (
              <button 
                className="add-card-btn"
                onClick={() => setShowCardEntry(true)}
              >
                ➕ Add Personal Card (For Private Bookings)
              </button>
            ) : (
              <div className="card-entry-pane fade-in">
                <div className="card-input-mock">
                  <span>Card Number</span>
                  <span>MM/YY</span>
                  <span>CVC</span>
                </div>
                <button className="btn-primary mt-md">
                  🚀 REQUEST (BILLED TO PERSONAL)
                </button>
              </div>
            )}
          </div>
        )}
      </div>

    </div>
  );
};

export default BookingSheet;
