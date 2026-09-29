import React, { useContext, useState, useCallback } from 'react';
import { RoleContext } from '../App';
import { Search, RefreshCw } from 'lucide-react';
import './MainHub.css';
import { fetchCommandMetrics, fetchTrips, usePolling } from '../utils/api';
import EntityLink from './EntityLink';

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
  const loadMetrics = useCallback(() => fetchCommandMetrics(), []);
  const { data: metrics, error, loading } = usePolling(loadMetrics, 20000);
  const loadTrips = useCallback(() => fetchTrips(), []);
  const { data: liveTrips } = usePolling(loadTrips, 20000);

  const filteredTrips = (liveTrips || []).filter(t =>
    !searchTerm ||
    (t.task_id || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.passenger_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.pickup_address || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 8);

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

      {/* Live Status Meters — real counts from /api/fm/command-metrics */}
      <div className="cc-metrics-row">
        {error && <div className="surface-panel p-md" style={{ color: 'var(--color-danger)' }}>Live link error: {error.message}</div>}
        {loading && !metrics && <div className="surface-panel p-md text-muted">Loading live fleet metrics…</div>}
        {metrics && (
          <>
            <div className="surface-panel cc-metric-card">
              <div className="metric-header space-between">
                <h4>DRIVERS IN SERVICE</h4>
                <span className="text-gold font-bold text-lg">{metrics.driversInServicePct}%</span>
              </div>
              <ArcMeter percentage={metrics.driversInServicePct} value={String(metrics.drivers.total)} label1="Active" val1={String(metrics.drivers.active)} label2="On Trip" val2={String(metrics.drivers.onTrip)} />
            </div>
            
            <div className="surface-panel cc-metric-card">
              <div className="metric-header space-between">
                <h4>VEHICLE OCCUPANCY</h4>
                <span className="text-gold font-bold text-lg">{metrics.vehicleOccupancyPct}%</span>
              </div>
              <ArcMeter percentage={metrics.vehicleOccupancyPct} value={String(metrics.vehicles.total)} label1="Occupied" val1={String(metrics.vehicles.occupied)} label2="Available" val2={String(metrics.vehicles.available)} />
            </div>

            <div className="surface-panel cc-metric-card">
              <div className="metric-header space-between">
                <h4>TRIP VELOCITY</h4>
                <span className="text-gold font-bold text-lg">{metrics.trips.enRoute > 10 ? 'Peak' : metrics.trips.enRoute > 0 ? 'Active' : 'Idle'}</span>
              </div>
              <div className="velocity-stats mt-4">
                <div className="vel-row">
                  <span>En-route</span>
                  <strong>{metrics.trips.enRoute} trips</strong>
                </div>
                <div className="vel-bar"><div className="vel-fill" style={{ width: `${Math.min(100, metrics.trips.enRoute * 5)}%` }}></div></div>
                <div className="vel-row mt-4">
                  <span>Upcoming</span>
                  <strong>{metrics.trips.upcoming} bookings</strong>
                </div>
                <div className="vel-bar"><div className="vel-fill" style={{ width: `${Math.min(100, metrics.trips.upcoming * 5)}%` }}></div></div>
              </div>
            </div>
          </>
        )}
      </div>

      <div className="cc-autopilot-banner surface-panel flex-row space-between align-center">
        <div className="flex-row gap-lg align-center">
          <div className="ap-icon-box pulse">
            <RefreshCw size={28} color="var(--color-gold)" />
          </div>
          <div>
            <h3 className="text-white mb-2">Fleet Autopilot {isAutopilotActive ? 'Active' : 'Standby'}</h3>
            <p className="text-muted" style={{ maxWidth: '600px', lineHeight: 1.5 }}>
              Velo AI is currently handling all standard dispatches based on client priority and vehicle proximity. Manual intervention will pause specific routes.
            </p>
          </div>
        </div>
        <div className="ap-toggle-box flex-row align-center gap-md">
          <span className="text-gold font-bold" style={{ letterSpacing: '1px' }}>SYSTEM ENGAGED</span>
          <div className={`mock-toggle ${isAutopilotActive ? 'active' : ''}`}>
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
            {filteredTrips.map(t => (
              <tr key={t.id}>
                <td>
                  <div className="text-white font-bold">
                    {t.passenger_name ? <EntityLink type="Client" value={t.passenger_name} /> : '—'}
                  </div>
                  <div className="text-muted text-sm">{t.task_id}</div>
                </td>
                <td>
                  <div className="text-white">{(t.requested_tier || 'EXECUTIVE').replace(/_/g, ' ')}</div>
                  <div className="text-muted text-sm">{t.channel || 'DIRECT'}</div>
                </td>
                <td className="text-white">{t.pickup_address} → {t.dropoff_address}</td>
                <td><span className={`status-badge ${t.state === 'COMPLETED' ? 'bg-gray-dim text-muted' : 'bg-gold-dim text-gold'}`}>{(t.state || '').replace(/_/g, '-')}</span></td>
                <td className="text-right"><button className="btn-outline-gold" onClick={onOpenDispatch}>Manual Assign</button></td>
              </tr>
            ))}
            {!liveTrips && (
              <tr><td colSpan="5" className="text-center text-muted p-xl">Loading live bookings…</td></tr>
            )}
            {liveTrips && filteredTrips.length === 0 && (
              <tr><td colSpan="5" className="text-center text-muted p-xl">
                No bookings match. Create a dispatch to see live jobs here.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default MainHub;
