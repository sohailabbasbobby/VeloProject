import React, { useState } from 'react';
import { CreditCard } from 'lucide-react';
import './CorporateBookingModal.css';

const CorporateBookingModal = ({ onClose }) => {
  const [vehicleClass, setVehicleClass] = useState('executive');

  return (
    <div className="modal-overlay">
      <div className="corp-booking-modal surface-panel">
        <div className="modal-header">
          <h2>Deploy Luxury Run</h2>
          <button className="btn-icon close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          <div className="input-group">
            <label>Passenger Name</label>
            <input type="text" placeholder="e.g. John Doe" />
          </div>
          
          <div className="input-group">
            <label>Phone Number</label>
            <input type="tel" placeholder="+44 7000 000000" />
          </div>

          <div className="route-block">
            <div className="input-group">
              <label>Pickup Location</label>
              <input type="text" placeholder="e.g. Acme HQ, London" />
            </div>
            <div className="input-group">
              <label>Dropoff Location</label>
              <input type="text" placeholder="e.g. Heathrow Terminal 5" />
            </div>
          </div>

          <div className="input-group">
            <label>Vehicle Class Tier</label>
            <div className="tier-selector">
              {['executive', 'premium', 'first-class'].map(tier => (
                <button 
                  key={tier}
                  className={`tier-btn ${vehicleClass === tier ? 'active' : ''}`}
                  onClick={() => setVehicleClass(tier)}
                >
                  {tier.replace('-', ' ').toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          
          <div className="billing-notice mt-4" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CreditCard size={18} />
            <span>This ride will be billed directly to the corporate account line of credit.</span>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary">Confirm & Deploy</button>
        </div>
      </div>
    </div>
  );
};

export default CorporateBookingModal;
