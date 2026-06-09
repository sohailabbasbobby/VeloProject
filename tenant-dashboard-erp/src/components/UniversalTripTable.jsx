/**
 * UniversalTripTable.jsx
 * ─────────────────────────────────────────────────────────────────────────────
 * The ONE canonical trip row layout used across the entire platform:
 *   Operations Hub, ChauffeurProfileModal, CorporateProfileModal,
 *   PrivateClientProfileModal, and any future screens.
 *
 * Props:
 *  trips          – array of trip objects (see shape below)
 *  onTripClick    – (trip) => void  → opens LiveTripModal
 *  onDriverClick  – (name) => void  → opens ChauffeurProfileModal
 *  onClientClick  – (name) => void  → opens profile modal
 *  onVehicleClick – (name) => void  → opens VehicleProfileModal
 *  onMapClick     – (trip) => void  → opens LiveFleetMapModal
 *  showChannel    – bool (default true)  hide/show Channel column
 *  emptyMessage   – string shown when trips array is empty
 *
 * Trip object shape (all fields optional with sensible defaults):
 *  { id, channel, status, driver, vehicle, passenger, client,
 *    route, progress, timeToFree, date, fare, dist, duration,
 *    rating, class: tripClass }
 * ─────────────────────────────────────────────────────────────────────────────
 */
import React from 'react';
import { MapPin } from 'lucide-react';
import './CommandCenter.css'; 
import EntityLink from './EntityLink';

// ── Inline fast-car SVG (same as CommandCenter) ────────────────────────────
const FastCarIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 100 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="utt-carMask">
        <rect width="100" height="40" fill="white" />
        <path d="M53 6 L55 13 L42 13 C45 10 49 7 53 6 Z" fill="black" />
        <path d="M56 6 C63 6 72 9 77 13 L58 13 Z" fill="black" />
        <circle cx="46" cy="30" r="4" fill="black" />
        <circle cx="84" cy="30" r="4" fill="black" />
        <circle cx="46" cy="30" r="2" fill="white" />
        <circle cx="84" cy="30" r="2" fill="white" />
      </mask>
    </defs>
    <g fill="currentColor" mask="url(#utt-carMask)">
      <path d="M10 12 h 23 l -2 3 h -21 z" />
      <path d="M18 18 h 14 l -2 3 h -12 z" />
      <path d="M24 24 h 8 l -2 3 h -6 z" />
      <path d="M35 18 C33 17 34 14 36 12 C41 9 48 5 57 4 C66 3 76 6 83 12 C88 15 93 17 96 18 C98 19 99 21 99 24 C99 28 98 30 96 30 L36 30 C34 30 33 28 33 24 L35 18 Z" />
      <circle cx="46" cy="30" r="8" />
      <circle cx="84" cy="30" r="8" />
    </g>
  </svg>
);

// ── Status class mapper (mirrors CommandCenter) ────────────────────────────
const getStatusClass = (status = '') => {
  switch (status) {
    case 'Unassigned':            return 'status-unassigned';
    case 'Assigned':              return 'status-assigned';
    case 'On the way to Pickup':  return 'status-way-to-pickup';
    case 'Arrived at pickup':     return 'status-arrived';
    case 'Waiting for customer':  return 'status-waiting';
    case 'On Trip':               return 'status-on-trip';
    case 'Completed':             return 'status-completed';
    default:                      return 'status-unassigned';
  }
};

// ── Main component ─────────────────────────────────────────────────────────
const UniversalTripTable = ({
  trips = [],
  onTripClick,
  onDriverClick,
  onClientClick,
  onVehicleClick,
  onMapClick,
  showChannel = true,
  emptyMessage = 'No trips to display.',
}) => {
  if (!trips.length) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '48px 24px', color: 'var(--color-text-muted)',
        fontSize: '13px', letterSpacing: '1px', textTransform: 'uppercase',
      }}>
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="u-table-wrapper" style={{ flex: 1, minHeight: 0 }}>
      <table className="cc-table" style={{ width: '100%', tableLayout: 'fixed' }}>
        <thead>
          <tr>
            <th style={{ width: '9%'  }}>TASK ID</th>
            {showChannel && <th style={{ width: '8%'  }}>CHANNEL</th>}
            <th style={{ width: '11%' }}>STATUS</th>
            <th style={{ width: '11%' }}>DRIVER</th>
            <th style={{ width: '11%' }}>VEHICLE</th>
            <th style={{ width: '10%' }}>PASSENGER</th>
            <th style={{ width: '10%' }}>CLIENT</th>
            <th style={{ width: showChannel ? '13%' : '16%' }}>ROUTE DETAIL</th>
            <th style={{ width: '8%'  }} className="text-right">TIME-TO-FREE</th>
            {onMapClick && <th style={{ width: '6%' }} className="text-center">MAP</th>}
          </tr>
        </thead>
        <tbody>
          {trips.map((task, idx) => (
            <tr
              key={task.id || idx}
              className="cc-card-row"
              style={{ position: 'relative', display: 'table-row', cursor: onTripClick ? 'pointer' : 'default' }}
              onClick={() => onTripClick && onTripClick(task)}
            >
              {/* Task ID */}
              <td className="text-gold font-bold" style={{ fontFamily: 'SF Mono, Consolas, monospace', fontSize: '11px' }}>
                {task.id || '—'}
              </td>

              {/* Channel */}
              {showChannel && <td style={{ fontSize: '12px' }}>{task.channel || '—'}</td>}

              {/* Status badge */}
              <td>
                <span className={`cc-status-badge ${getStatusClass(task.status)}`}>
                  {task.status || 'Unknown'}
                </span>
              </td>

              {/* Driver → profile link */}
              <td>
                <EntityLink type="Driver" gold={false}>{task.driver}</EntityLink>
              </td>

              {/* Vehicle → profile link */}
              <td>
                <EntityLink type="Vehicle">{task.vehicle}</EntityLink>
              </td>

              {/* Passenger — new universal column */}
              <td style={{ fontSize: '12px', color: '#ddd' }}>
                <EntityLink type="Passenger">{task.passenger || task.client || '—'}</EntityLink>
              </td>

              {/* Client → profile link */}
              <td>
                <EntityLink type="Client">{task.client}</EntityLink>
              </td>

              {/* Route Detail */}
              <td className="text-white" style={{ fontSize: '12px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {task.route || '—'}
              </td>

              {/* Time-to-Free */}
              <td className="text-right" style={{ paddingRight: '16px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <span style={{ color: 'var(--color-gold)', fontWeight: 700, fontSize: '13px' }}>
                    {task.timeToFree || task.duration || '—'}
                  </span>
                  <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>
                    {task.date || 'Mins'}
                  </span>
                </div>
              </td>

              {/* Map button */}
              {onMapClick && (
                <td className="text-center" onClick={e => e.stopPropagation()}>
                  <button
                    className="cc-row-action-btn"
                    onClick={() => onMapClick(task)}
                    title="View on map"
                  >
                    <MapPin size={14} />
                  </button>
                </td>
              )}

              {/* Progress bar overlay (same as CommandCenter) */}
              <div className="cc-row-progress-bar">
                <div
                  className={`cc-row-progress-fill ${getStatusClass(task.status)}`}
                  style={{ width: `${task.progress ?? (task.status === 'Completed' ? 100 : 0)}%` }}
                >
                  <div className="cc-progress-content">
                    <FastCarIcon size={32} className="cc-progress-car-icon" />
                    <span className="cc-progress-text">
                      {(task.progress ?? 0) > 0 ? `${task.progress}%` : ''}
                    </span>
                  </div>
                </div>
              </div>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default UniversalTripTable;
