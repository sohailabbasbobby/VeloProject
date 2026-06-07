import React, { useContext, useState } from 'react';
import { RoleContext } from '../App';
import { Search, RefreshCw } from 'lucide-react';
import './MainHub.css';

const ArcMeter = ({ percentage, value, label1, val1, label2, val2 }) => {
  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * (circumference / 2); // Half circle

  return (
    <div className="arc-meter-container">
      <div className="arc-wrapper">
        <svg viewBox="0 0 100 55" className="arc-svg">
          <path
            className="arc-bg"
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="rgba(255,255,255,0.1)"
            strokeWidth="6"
            strokeLinecap="round"
          />
          <path
            className="arc-value"
            d="M 10 50 A 40 40 0 0 1 90 50"
            fill="none"
            stroke="var(--color-gold)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
          />
        </svg>
        <div className="arc-main-val">{value}</div>
      </div>
      <div className="arc-stats">
        <div className="stat-line"><span className="dot gold"></span>{label1}: <strong>{val1}</strong></div>
        <div className="stat-line"><span className="dot gray"></span>{label2}: <strong>{val2}</strong></div>
      </div>
    </div>
  );
};

const MainHub = ({ onOpenDispatch, isAutopilotActive }) => {
  const { role } = useContext(RoleContext);
  const [searchTerm, setSearchTerm] = useState('');

  return (
    <div className="command-center">
      
      <div className="cc-header flex-row space-between align-center">
        <div>
          <h2 className="text-white">Command Center</h2>
          <p className="text-muted">Real-time luxury fleet orchestration</p>
        </div>
        <div className="live-badge pulse">
          <span className="dot gold"></span> LIVE SYSTEM
        </div>
      </div>

      {/* Live Status Meters */}
      <div className="cc-metrics-row">
        <div className="surface-panel cc-metric-card">
          <div className="metric-header space-between">
            <h4>DRIVERS IN SERVICE</h4>
            <span className="text-gold font-bold text-lg">84%</span>
          </div>
          <ArcMeter percentage={84} value="42" label1="Active" val1="38" label2="Waiting" val2="4" />
        </div>
        
        <div className="surface-panel cc-metric-card">
          <div className="metric-header space-between">
            <h4>VEHICLE OCCUPANCY</h4>
            <span className="text-gold font-bold text-lg">62%</span>
          </div>
          <ArcMeter percentage={62} value="31" label1="Occupied" val1="19" label2="Available" val2="12" />
        </div>

        <div className="surface-panel cc-metric-card">
          <div className="metric-header space-between">
            <h4>TRIP VELOCITY</h4>
            <span className="text-gold font-bold text-lg">Peak</span>
          </div>
          <div className="velocity-stats mt-4">
            <div className="vel-row">
              <span>En-route</span>
              <strong>148 trips/hr</strong>
            </div>
            <div className="vel-bar"><div className="vel-fill" style={{width: '70%'}}></div></div>
            <div className="vel-row mt-4">
              <span>Upcoming</span>
              <strong>212 bookings</strong>
            </div>
            <div className="vel-bar"><div className="vel-fill" style={{width: '90%'}}></div></div>
          </div>
        </div>
      </div>

      <div className="cc-autopilot-banner surface-panel flex-row space-between align-center">
        <div className="flex-row gap-lg align-center">
          <div className="ap-icon-box pulse">
            <RefreshCw size={28} color="var(--color-gold)" />
          </div>
          <div>
            <h3 className="text-white mb-2">Fleet Autopilot Active</h3>
            <p className="text-muted" style={{ maxWidth: '600px', lineHeight: 1.5 }}>
              Velo AI is currently handling all standard dispatches based on client priority and vehicle proximity. Manual intervention will pause specific routes.
            </p>
          </div>
        </div>
        <div className="ap-toggle-box flex-row align-center gap-md">
          <span className="text-gold font-bold" style={{ letterSpacing: '1px' }}>SYSTEM ENGAGED</span>
          <div className="mock-toggle active">
            <div className="toggle-knob"></div>
          </div>
        </div>
      </div>

      <div className="master-booking-table surface-panel">
        <div className="table-header space-between flex-row align-center">
          <h3 className="text-white" style={{ letterSpacing: '2px', fontSize: '13px' }}>MASTER BOOKING TABLE</h3>
          <div className="search-wrapper">
            <Search size={16} className="search-icon text-muted" />
            <input 
              type="text" 
              placeholder="Filter jobs..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <table className="cc-grid">
          <thead>
            <tr>
              <th>CLIENT / JOB ID</th>
              <th>VEHICLE CLASS</th>
              <th>LOCATION</th>
              <th>STATUS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                <div className="text-white font-bold">Alexander Van der Bellen</div>
                <div className="text-muted text-sm">#VELO-9921-A</div>
              </td>
              <td>
                <div className="text-white">Rolls-Royce Phantom</div>
                <div className="text-muted text-sm">Midnight Silver</div>
              </td>
              <td className="text-white">Mayfair → Heathrow T5</td>
              <td><span className="status-badge bg-gold-dim text-gold">EN-ROUTE</span></td>
              <td className="text-right"><button className="btn-outline-gold" onClick={onOpenDispatch}>Manual Assign</button></td>
            </tr>
            <tr>
              <td>
                <div className="text-white font-bold">Sofia Loren (Concierge)</div>
                <div className="text-muted text-sm">#VELO-9942-X</div>
              </td>
              <td>
                <div className="text-white">Bentley Mulsanne</div>
                <div className="text-muted text-sm">Onyx Black</div>
              </td>
              <td className="text-white">The Ritz → Knightsbridge</td>
              <td><span className="status-badge bg-gray-dim text-muted">QUEUED</span></td>
              <td className="text-right"><button className="btn-outline-gold" onClick={onOpenDispatch}>Manual Assign</button></td>
            </tr>
            <tr>
              <td>
                <div className="text-white font-bold">H.E. Sheikh Khalifa</div>
                <div className="text-muted text-sm">#VELO-9950-B</div>
              </td>
              <td>
                <div className="text-white">Mercedes-Maybach S680</div>
                <div className="text-muted text-sm">Two-tone Obsidian</div>
              </td>
              <td className="text-white">Northolt Jet Centre → Park Lane</td>
              <td><span className="status-badge bg-gold-dim text-gold">ARRIVING</span></td>
              <td className="text-right"><button className="btn-outline-gold" onClick={onOpenDispatch}>Manual Assign</button></td>
            </tr>
            <tr>
              <td>
                <div className="text-white font-bold">Julianne Moore</div>
                <div className="text-muted text-sm">#VELO-9961-C</div>
              </td>
              <td>
                <div className="text-white">Range Rover SV Autobiography</div>
                <div className="text-muted text-sm">Eiger Grey</div>
              </td>
              <td className="text-white">Savoy Hotel → Soho House</td>
              <td><span className="status-badge bg-gray-dim text-muted">PENDING</span></td>
              <td className="text-right"><button className="btn-outline-gold" onClick={onOpenDispatch}>Manual Assign</button></td>
            </tr>
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default MainHub;
