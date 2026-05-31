import React from 'react';
import './StaffRoster.css';

const StaffRoster = () => {
  return (
    <div className="staff-roster">
      <div className="roster-header">
        <h2>Staff Rostering & Fleet Log</h2>
        <p className="text-muted">Drag and drop personnel onto fleet assets.</p>
      </div>

      <div className="roster-grid">
        
        {/* Drag-and-Drop Fleet Grid */}
        <div className="fleet-column surface-panel">
          <h3>Fleet Allocations</h3>
          
          <div className="fleet-slot">
            <div className="car-profile">
              <span className="car-icon">🚘</span>
              <div className="car-info">
                <strong>Mercedes S-Class</strong>
                <span className="car-tag">Tier: First-Class</span>
                <span className="car-reg">LN26 XAA</span>
              </div>
            </div>
            <div className="drop-zone occupied">
              <div className="avatar-chip status-online" draggable>
                <div className="avatar">D</div>
                <span>David K.</span>
              </div>
            </div>
          </div>

          <div className="fleet-slot">
            <div className="car-profile">
              <span className="car-icon">🚐</span>
              <div className="car-info">
                <strong>Mercedes V-Class</strong>
                <span className="car-tag">Tier: Premium MPV</span>
                <span className="car-reg">LN26 XBB</span>
              </div>
            </div>
            <div className="drop-zone empty">
              <span>Drop Driver Here</span>
            </div>
          </div>
        </div>

        {/* Personnel Bench */}
        <div className="personnel-column surface-panel">
          <h3>Available Personnel</h3>
          <div className="personnel-bench">
            <div className="avatar-chip status-break" draggable>
              <div className="avatar">S</div>
              <span>Sarah M.</span>
            </div>
            <div className="avatar-chip status-offline" draggable>
              <div className="avatar">M</div>
              <span>Marcus T.</span>
            </div>
          </div>
        </div>

        {/* Rota Calendar Matrix */}
        <div className="calendar-column surface-panel">
          <h3>Weekly Rota Matrix</h3>
          <div className="calendar-grid">
            <div className="cal-day">
              <strong>Mon</strong>
              <div className="shift">09:00 - 18:00<br/>(D.K)</div>
            </div>
            <div className="cal-day">
              <strong>Tue</strong>
              <div className="shift empty">+ Add Shift</div>
            </div>
            <div className="cal-day">
              <strong>Wed</strong>
              <div className="shift">12:00 - 22:00<br/>(S.M)</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default StaffRoster;
