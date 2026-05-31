import React, { useState } from 'react';
import './DispatchModal.css';

const DispatchModal = ({ onClose }) => {
  const [routeType, setRouteType] = useState('in-house'); // 'in-house' | 'b2b'
  const [vehicleClass, setVehicleClass] = useState('executive');
  
  return (
    <div className="modal-overlay">
      <div className="dispatch-modal surface-panel">
        <div className="modal-header">
          <h2>Create New Job</h2>
          <button className="btn-icon close-btn" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Top Section: Route & Tier */}
          <div className="routing-block">
            <div className="input-group">
              <label>Pickup Address</label>
              <input type="text" placeholder="e.g. Heathrow Terminal 5" />
            </div>
            <div className="input-group">
              <label>Dropoff Address</label>
              <input type="text" placeholder="e.g. The Savoy Hotel" />
            </div>
          </div>

          <div className="tier-selector">
            {['executive', 'premium', 'first-class', 'ultra'].map(tier => (
              <button 
                key={tier}
                className={`tier-btn ${vehicleClass === tier ? 'active' : ''}`}
                onClick={() => setVehicleClass(tier)}
              >
                {tier.replace('-', ' ').toUpperCase()}
              </button>
            ))}
          </div>

          <div className="assignment-controller">
            <div className="routing-tabs">
              <button 
                className={routeType === 'in-house' ? 'active' : ''} 
                onClick={() => setRouteType('in-house')}
              >
                Assign In-House Fleet
              </button>
              <button 
                className={routeType === 'b2b' ? 'active' : ''} 
                onClick={() => setRouteType('b2b')}
              >
                Push to B2B Pool
              </button>
            </div>

            <div className="routing-content">
              {routeType === 'in-house' ? (
                <div className="in-house-assign">
                  <label>Available Chauffeurs (Online & Qualified)</label>
                  <select className="dropdown-select">
                    <option>Select Chauffeur...</option>
                    <option>David K. (Mercedes S-Class)</option>
                    <option>Sarah M. (BMW 7 Series)</option>
                  </select>
                </div>
              ) : (
                <div className="b2b-assign">
                  <div className="price-input-wrapper">
                    <span className="currency">£</span>
                    <input type="number" defaultValue="90.00" className="numeric-keypad" />
                  </div>
                  <div className="safety-text">
                    *Ecosystem Floor for this {vehicleClass.toUpperCase()} Route is £85.00*
                  </div>
                  
                  <label className="toggle-switch-label mt-4">
                    <input type="checkbox" defaultChecked />
                    <span className="toggle-slider"></span>
                    <span className="ml-2">Allow Price Counter-Offers / Negotiation</span>
                  </label>
                </div>
              )}
            </div>
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn-outline" onClick={onClose}>Cancel</button>
          <button className="btn-primary">
            {routeType === 'in-house' ? 'Dispatch Job' : 'Broadcast to Network'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DispatchModal;
