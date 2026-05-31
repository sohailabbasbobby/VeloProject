import React, { useState } from 'react';
import './CorporateTrips.css';

const CorporateTrips = () => {
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, past

  return (
    <div className="corporate-trips">
      <div className="corp-header">
        <h2>Trip Lifecycle Matrix</h2>
      </div>

      <div className="trips-tabs">
        <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active Transfers</button>
        <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>Upcoming Trips</button>
        <button className={activeTab === 'past' ? 'active' : ''} onClick={() => setActiveTab('past')}>Past Trips & Invoices</button>
      </div>

      <div className="trips-content surface-panel">
        
        {activeTab === 'active' && (
          <div className="active-transfers">
            <div className="mock-map-canvas">
              <div className="radar-grid"></div>
              <div className="tracking-marker pulse">📍</div>
            </div>
            <div className="driver-card">
              <div className="avatar">D</div>
              <div className="driver-info">
                <h4>David K.</h4>
                <span className="text-muted text-sm">Mercedes S-Class [LN26 XAA]</span>
              </div>
              <div className="eta-meter text-gold">
                <h3>12 Mins</h3>
                <span className="text-sm">to Pickup</span>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'upcoming' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Route</th>
                <th>Date & Time</th>
                <th>Vehicle Tier</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sarah M. (CEO)</td>
                <td>Acme HQ → Heathrow T5</td>
                <td>Tomorrow, 09:00 AM</td>
                <td>First-Class</td>
                <td className="action-links">
                  <span className="text-action cursor-pointer">[📋 Reschedule]</span>
                  <span className="text-danger cursor-pointer ml-2">[❌ Cancel]</span>
                </td>
              </tr>
              <tr>
                <td>Guest (Investor)</td>
                <td>The Savoy → Acme HQ</td>
                <td>15 Jun 2026, 14:00 PM</td>
                <td>Executive</td>
                <td className="action-links">
                  <span className="text-action cursor-pointer">[📋 Reschedule]</span>
                  <span className="text-danger cursor-pointer ml-2">[❌ Cancel]</span>
                </td>
              </tr>
            </tbody>
          </table>
        )}

        {activeTab === 'past' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Booking ID</th>
                <th>Passenger</th>
                <th>Date</th>
                <th>Fare</th>
                <th>Invoice</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="font-mono">TRD-8801</td>
                <td>Marcus T.</td>
                <td>10 May 2026</td>
                <td className="font-mono">£120.00</td>
                <td><span className="text-action cursor-pointer">[📥 Download PDF]</span></td>
              </tr>
              <tr>
                <td className="font-mono">TRD-8742</td>
                <td>Sarah M. (CEO)</td>
                <td>08 May 2026</td>
                <td className="font-mono">£95.00</td>
                <td><span className="text-action cursor-pointer">[📥 Download PDF]</span></td>
              </tr>
            </tbody>
          </table>
        )}

      </div>
    </div>
  );
};

export default CorporateTrips;
