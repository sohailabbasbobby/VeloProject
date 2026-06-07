import React, { useEffect, useState } from 'react';
import { X, MapPin } from 'lucide-react';
import './LiveFleetMapModal.css';

const LiveFleetMapModal = ({ isOpen, onClose, activeTasks, onTripSelect, onLinkClick }) => {
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Simulate lazy loading of a heavy map library
      const timer = setTimeout(() => setMapLoaded(true), 300);
      return () => clearTimeout(timer);
    } else {
      setMapLoaded(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="map-modal-overlay" onClick={onClose}>
      <div className="map-modal-container" onClick={e => e.stopPropagation()}>
        <div className="map-modal-header">
          <h2>LIVE FLEET MAP</h2>
          <button className="modal-close-btn" onClick={onClose}><X size={24} /></button>
        </div>
        
        <div className="map-modal-body">
          {!mapLoaded ? (
            <div className="map-loading-state">
              <div className="map-spinner"></div>
              <span>INITIALIZING SECURE MAP...</span>
            </div>
          ) : (
            <div className="mock-map-bg">
              <div className="map-grid"></div>
              {activeTasks.map((task, idx) => {
                const top = `${15 + (idx * 27) % 70}%`;
                const left = `${15 + (idx * 31) % 70}%`;
                
                let statusColor = 'var(--status-unassigned)';
                if (task.status === 'On the way to Pickup') statusColor = 'var(--status-way-to-pickup)';
                else if (task.status === 'Arrived at pickup') statusColor = 'var(--status-arrived)';
                else if (task.status === 'Waiting for customer') statusColor = 'var(--status-waiting)';
                else if (task.status === 'On Trip') statusColor = 'var(--status-on-trip)';

                return (
                  <div 
                    key={task.id} 
                    className="map-pin-container"
                    style={{ top, left }}
                  >
                    <div className="map-pin-label">
                      <span className="pin-vehicle" onClick={(e) => { e.stopPropagation(); onLinkClick(e, 'Vehicle', task.vehicle); }}>{task.vehicle}</span>
                      <span className="pin-driver" onClick={(e) => { e.stopPropagation(); onLinkClick(e, 'Driver', task.driver); }}>{task.driver}</span>
                    </div>
                    <div className="map-pin-pulse" style={{ backgroundColor: statusColor }}></div>
                    <button 
                       className="map-pin-btn" 
                       onClick={() => onTripSelect(task)}
                       style={{ color: statusColor }}
                    >
                      <MapPin size={28} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveFleetMapModal;
