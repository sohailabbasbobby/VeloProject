import React from 'react';
import BookingSheet from './BookingSheet';
import './HomeScreen.css';

const HomeScreen = ({ onOpenProfile, isTripActive = false }) => {
  return (
    <div className="home-screen">
      {/* Background Map layer */}
      <div className="map-layer">
        <div className="map-grid"></div>
        
        {/* Mocking the user's location */}
        <div className="user-dot"></div>

        {isTripActive && (
          <>
            <svg className="trip-line" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 50 60 Q 60 30 70 40" stroke="var(--brand-primary)" strokeWidth="2" fill="none" />
            </svg>
            <div className="vehicle-marker pulse">
              <span className="car-icon">🚘</span>
            </div>
          </>
        )}
      </div>

      {/* Top Navigation */}
      <div className="top-bar">
        <button className="profile-trigger" onClick={onOpenProfile}>
          <div className="monogram">[ J ]</div>
        </button>
      </div>

      <BookingSheet />
    </div>
  );
};

export default HomeScreen;
