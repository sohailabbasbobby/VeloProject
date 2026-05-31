import React, { useState, useEffect } from 'react';
import SwipeSlider from './SwipeSlider';
import './ShiftGatekeeper.css';

const ShiftGatekeeper = ({ onGoOnline }) => {
  const [checks, setChecks] = useState({
    vehicleBody: false,
    cabinVacuumed: false,
    tyrePressures: false,
    fuelLevel: false
  });
  
  const [odometerReading, setOdometerReading] = useState('');
  const [odometerVerified, setOdometerVerified] = useState(false);
  const [odometerError, setOdometerError] = useState(null);

  const [photoCaptured, setPhotoCaptured] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const allChecked = Object.values(checks).every(Boolean);
    setIsReady(allChecked && photoCaptured && odometerVerified);
  }, [checks, photoCaptured, odometerVerified]);

  const toggleCheck = (key) => {
    setChecks(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCapture = () => {
    // Mock capturing an image
    setPhotoCaptured(true);
  };

  const handleOdometerVerification = async () => {
    setOdometerError(null);
    try {
        const response = await fetch('http://localhost:8000/api/fleet/odometer', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-tenant-id': 'TENANT-CORP-001',
                'x-driver-id': 'DRV-100'
            },
            body: JSON.stringify({
                vehicleId: 'VEH-1111-2222',
                reading: odometerReading,
                eventType: 'START_SHIFT'
            })
        });

        const data = await response.json();

        if (response.ok) {
            setOdometerVerified(true);
        } else {
            setOdometerError(data.error || "Odometer validation failed.");
        }
    } catch (err) {
        setOdometerError("Network timeout. Cannot reach Dispatch.");
    }
  };

  return (
    <div className="gatekeeper-container">
      {/* Velo Logo Placeholder */}
      <div className="logo-zone">
        <div className="logo-placeholder"></div>
      </div>

      <div className="driver-header flex-row">
        <div className="portrait-placeholder"></div>
        <div className="driver-info">
          <h2 className="text-gold">Mr. Bobby</h2>
          <p className="text-muted text-sm">Mercedes-Benz S-Class • Black • Reg: LN26 XAA</p>
        </div>
      </div>

      <div className="checklist-container">
        <CheckItem 
          text="Vehicle body is pristine, washed, and free of road debris."
          checked={checks.vehicleBody}
          onClick={() => toggleCheck('vehicleBody')}
        />
        <CheckItem 
          text="Passenger cabin thoroughly vacuumed, climate control set, and fresh bottled water stocked."
          checked={checks.cabinVacuumed}
          onClick={() => toggleCheck('cabinVacuumed')}
        />
        <CheckItem 
          text="Tyre pressures and tread depths visually verified."
          checked={checks.tyrePressures}
          onClick={() => toggleCheck('tyrePressures')}
        />
        <CheckItem 
          text="Fuel level or battery charge status is at or above 75%."
          checked={checks.fuelLevel}
          onClick={() => toggleCheck('fuelLevel')}
        />
      </div>

      {/* ODOMETER GATEKEEPER */}
      <div className="odometer-block">
        <label className="text-muted text-sm" style={{textTransform: 'uppercase', marginBottom: '8px', display: 'block'}}>Odometer Reading Verification</label>
        <div style={{display: 'flex', gap: '10px'}}>
            <input 
                type="number" 
                placeholder="Enter current miles..."
                value={odometerReading}
                onChange={(e) => setOdometerReading(e.target.value)}
                disabled={odometerVerified}
                className="defect-textarea"
                style={{minHeight: '40px', padding: '10px'}}
            />
            <button 
                onClick={handleOdometerVerification} 
                disabled={odometerVerified || !odometerReading}
                style={{backgroundColor: odometerVerified ? '#4CAF50' : '#D4AF37', color: '#000', border: 'none', borderRadius: '6px', padding: '0 20px', fontWeight: 'bold'}}
            >
                {odometerVerified ? 'VERIFIED' : 'VERIFY'}
            </button>
        </div>
        {odometerError && <div className="text-danger mt-xs text-sm" style={{marginTop: '8px', color: '#F44336'}}>{odometerError}</div>}
      </div>

      <div 
        className={`photo-capture-block ${photoCaptured ? 'captured' : ''}`}
        onClick={handleCapture}
      >
        {photoCaptured ? (
          <div className="photo-thumbnail">
            <span>✅ CABIN VERIFIED</span>
          </div>
        ) : (
          <span>📸 TAP TO CAPTURE REAR CABIN PRESENTATION</span>
        )}
      </div>

      <div className="base-margin-slider">
        <SwipeSlider 
          text="🟩 SLIDE RIGHT TO GO ONLINE" 
          disabled={!isReady} 
          onComplete={onGoOnline} 
          color="var(--color-success)"
        />
      </div>
    </div>
  );
};

const CheckItem = ({ text, checked, onClick }) => (
  <div className={`checkbox-row ${checked ? 'checked' : ''}`} onClick={onClick}>
    <div className={`checkbox-box ${checked ? 'checked' : ''}`}></div>
    <div className="checkbox-text">{text}</div>
  </div>
);

export default ShiftGatekeeper;
