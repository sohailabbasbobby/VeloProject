import React from 'react';
import { X, MapPin, Navigation, CarFront, User, ShieldCheck } from 'lucide-react';
import './LiveTripModal.css';

// Universal profile-link style (gold underline, pointer cursor)
const profileLinkStyle = {
  cursor: 'pointer',
  color: 'var(--color-gold, #D4AF37)',
  textDecoration: 'underline',
  textDecorationColor: 'rgba(212,175,55,0.4)',
  textUnderlineOffset: '3px',
  transition: 'text-decoration-color 0.2s, opacity 0.2s',
  fontWeight: 600,
};

const ProfileLink = ({ children, onClick, style = {} }) => (
  <span
    style={{ ...profileLinkStyle, ...style }}
    onClick={(e) => { e.stopPropagation(); if (onClick) onClick(); }}
    onMouseEnter={e => e.currentTarget.style.textDecorationColor = 'var(--color-gold)'}
    onMouseLeave={e => e.currentTarget.style.textDecorationColor = 'rgba(212,175,55,0.4)'}
    title="Click to open profile"
  >
    {children}
  </span>
);

const LiveTripModal = ({ trip, onClose, onDriverClick, onClientClick, onVehicleClick }) => {
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
                {onDriverClick && trip.driver && trip.driver !== 'Unassigned' && trip.driver !== 'TBD' ? (
                  <ProfileLink onClick={() => onDriverClick(trip.driver)}>{trip.driver}</ProfileLink>
                ) : (
                  <span className="ltm-value text-gold">{trip.driver || 'Unassigned'}</span>
                )}
              </div>
            </div>

            <div className="ltm-detail-card">
              <div className="ltm-detail-icon"><CarFront size={18} /></div>
              <div className="ltm-detail-info">
                <span className="ltm-label">VEHICLE</span>
                {onVehicleClick && trip.vehicle && trip.vehicle !== 'TBD' ? (
                  <ProfileLink onClick={() => onVehicleClick(trip.vehicle)} style={{ color: '#fff' }}>{trip.vehicle}</ProfileLink>
                ) : (
                  <span className="ltm-value">{trip.vehicle || 'TBD'}</span>
                )}
              </div>
            </div>

            <div className="ltm-detail-card">
              <div className="ltm-detail-icon"><ShieldCheck size={18} /></div>
              <div className="ltm-detail-info">
                <span className="ltm-label">CLIENT / ACCOUNT</span>
                {onClientClick && trip.client && trip.client !== 'Private' ? (
                  <ProfileLink onClick={() => onClientClick(trip.client)} style={{ color: '#fff' }}>{trip.client}</ProfileLink>
                ) : (
                  <span className="ltm-value">{trip.client || 'Private'}</span>
                )}
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
