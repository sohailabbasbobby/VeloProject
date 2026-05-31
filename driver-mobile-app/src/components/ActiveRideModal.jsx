import React, { useState } from 'react';
import SwipeSlider from './SwipeSlider';
import './ActiveRideModal.css';

const ActiveRideModal = ({ onLaunchPagingBoard, onCompleteTrip }) => {
  // Trip states: 0 = En route, 1 = Arrived, 2 = In transit
  const [tripPhase, setTripPhase] = useState(0);

  const phases = [
    { text: "🟦 SLIDE RIGHT: I HAVE ARRIVED", color: "var(--color-info)" },
    { text: "🟩 SLIDE RIGHT: START TRIP", color: "var(--color-success)" },
    { text: "🟥 SLIDE RIGHT: END TRIP", color: "var(--color-danger)" }
  ];

  const handlePhaseComplete = () => {
    if (tripPhase < 2) {
      setTripPhase(prev => prev + 1);
    } else {
      onCompleteTrip();
    }
  };

  const handleWazeDeepLink = () => {
    // In a real app this would use Linking or window.location with the waze:// scheme
    alert("Deep linking to Waze...");
  };

  return (
    <>
      {/* Floating Waze Button */}
      <button className="floating-waze-btn" onClick={handleWazeDeepLink}>
        [ 🚘 OPEN WAZE ]
      </button>

      <div className="bottom-sheet active-ride-modal slide-up-enter-active">
        
        <div className="passenger-row">
          <div className="passenger-avatar monogram">
            [ J ]
          </div>
          <div className="passenger-info">
            <h3 className="text-primary">Passenger: Mr. John</h3>
          </div>
        </div>

        <div className="actions-row">
          <button className="action-circle">
            <span className="icon">📞</span>
            <span className="label">CALL (MASKED)</span>
          </button>
          <button className="action-circle">
            <span className="icon">💬</span>
            <span className="label">CHAT</span>
          </button>
          <button className="btn-text add-stop-btn">
            [➕ ADD STOP ON-TRIP]
          </button>
        </div>

        <div className="slider-wrapper">
          {/* Key trick: to force remount and reset slider progress, we use the phase as a key */}
          <SwipeSlider 
            key={tripPhase}
            text={phases[tripPhase].text} 
            color={phases[tripPhase].color} 
            onComplete={handlePhaseComplete}
          />
        </div>

        <div className="paging-board-link" onClick={onLaunchPagingBoard}>
          [ 🌟 TAP TO LAUNCH DIGITAL PAGING BOARD ]
        </div>
      </div>
    </>
  );
};

export default ActiveRideModal;
