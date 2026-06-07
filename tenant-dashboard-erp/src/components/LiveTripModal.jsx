import React from 'react';
import { X, MapPin, Navigation, CarFront, User, ShieldCheck } from 'lucide-react';
import './LiveTripModal.css';

const LiveTripModal = ({ trip, onClose }) => {
  if (!trip) return null;

  return (
    <div className="live-trip-overlay" onClick={onClose}>
      <div className="live-trip-modal" onClick={e => e.stopPropagation()}>
        
        <div className="ltm-header">
          <div className="ltm-title-block">
            <h2>{trip.id}</h2>
            <span className="ltm-status-badge">{trip.status}</span>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="ltm-body">
          {/* Mock Map Area */}
          <div className="ltm-map-container">
            <div className="ltm-map-mockup">
               <div className="ltm-route-line"></div>
               <div className="ltm-pin start"><MapPin size={24} /></div>
               <div className="ltm-pin end"><Navigation size={24} /></div>
               <div className="ltm-vehicle-marker" style={{ left: `${trip.progress}%` }}>
                  <div className="ltm-radar-pulse"></div>
                  <CarFront size={20} color="#000" />
               </div>
            </div>
            <div className="ltm-progress-bar">
               <div className="ltm-progress-fill" style={{ width: `${trip.progress}%` }}></div>
            </div>
          </div>

          {/* Details Grid */}
          <div className="ltm-details-grid">
            <div className="ltm-detail-card">
              <div className="ltm-detail-icon"><User size={18} /></div>
              <div className="ltm-detail-info">
                <span className="ltm-label">CHAUFFEUR</span>
                <span className="ltm-value text-gold link-mock">{trip.driver || 'Unassigned'}</span>
              </div>
            </div>

            <div className="ltm-detail-card">
              <div className="ltm-detail-icon"><CarFront size={18} /></div>
              <div className="ltm-detail-info">
                <span className="ltm-label">VEHICLE</span>
                <span className="ltm-value link-mock">{trip.vehicle || 'TBD'}</span>
              </div>
            </div>

            <div className="ltm-detail-card">
              <div className="ltm-detail-icon"><ShieldCheck size={18} /></div>
              <div className="ltm-detail-info">
                <span className="ltm-label">CLIENT / ACCOUNT</span>
                <span className="ltm-value link-mock">{trip.client || 'Private'}</span>
              </div>
            </div>

            <div className="ltm-detail-card full-width">
              <div className="ltm-detail-icon"><Navigation size={18} /></div>
              <div className="ltm-detail-info">
                <span className="ltm-label">ROUTE DETAIL</span>
                <span className="ltm-value">{trip.route}</span>
              </div>
            </div>
          </div>

        </div>
        
      </div>
    </div>
  );
};

export default LiveTripModal;
