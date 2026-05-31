import React from 'react';
import SwipeSlider from './SwipeSlider';
import './AssignmentModal.css';

const AssignmentModal = ({ onAccept }) => {
  return (
    <div className="bottom-sheet assignment-modal slide-up-enter-active">
      <div className="assignment-header pulse">
        🚨 ASSIGNMENT DETECTED
      </div>
      
      <div className="itinerary-block">
        <div className="location">Manchester Piccadilly</div>
        <div className="arrow">──►</div>
        <div className="location highlight">Manchester Airport T2</div>
      </div>
      
      <div className="manifest-block">
        <p><strong>Passenger:</strong> Mr. John (Goldman Sachs)</p>
        <p><strong>Luggage:</strong> 4 Bags</p>
        <p className="text-gold"><strong>Request:</strong> Quiet Cabin Request</p>
      </div>

      <div className="slider-wrapper">
        <SwipeSlider 
          text="🟩 SLIDE RIGHT TO ACCEPT" 
          color="var(--color-success)" 
          onComplete={onAccept}
        />
      </div>
    </div>
  );
};

export default AssignmentModal;
