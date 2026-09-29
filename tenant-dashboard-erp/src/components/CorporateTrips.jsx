import React, { useCallback, useState } from 'react';
import './CorporateTrips.css';
import { fetchTrips, usePolling } from '../utils/api';
import EntityLink from './EntityLink';

/**
 * TRIP LIFECYCLE MATRIX (corporate view) — fully live (final-mile pass).
 * Active, upcoming and past tabs all read the real trips table through
 * /api/analytics/trips. No fake radar map, driver card or rows.
 */
const CorporateTrips = () => {
  const [activeTab, setActiveTab] = useState('active'); // active, upcoming, past
  const load = useCallback(() => fetchTrips(), []);
  const { data: trips, error, loading } = usePolling(load, 15000);

  const all = trips || [];
  const active = all.filter(t => ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS', 'ON_BOARD'].includes(t.state));
  const upcoming = all.filter(t => ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION'].includes(t.state));
  const past = all.filter(t => ['COMPLETED', 'CANCELLED'].includes(t.state));

  return (
    <div className="corporate-trips">
      <div className="corp-header">
        <h2>Trip Lifecycle Matrix</h2>
      </div>

      <div className="trips-tabs">
        <button className={activeTab === 'active' ? 'active' : ''} onClick={() => setActiveTab('active')}>Active Transfers ({active.length})</button>
        <button className={activeTab === 'upcoming' ? 'active' : ''} onClick={() => setActiveTab('upcoming')}>Upcoming Trips ({upcoming.length})</button>
        <button className={activeTab === 'past' ? 'active' : ''} onClick={() => setActiveTab('past')}>Past Trips & Invoices ({past.length})</button>
      </div>

      <div className="trips-content surface-panel">
        {error && <div className="p-md" style={{ color: 'var(--color-danger)' }}>Live link error: {error.message}</div>}
        {loading && !trips && <div className="p-md text-muted">Loading live trips…</div>}

        {activeTab === 'active' && (
          <div className="active-transfers">
            {active.map(t => (
              <div key={t.id} className="driver-card" style={{ marginBottom: 12 }}>
                <div className="driver-info">
                  <h4>{t.passenger_name ? <EntityLink type="Client" value={t.passenger_name} /> : 'Passenger'}</h4>
                  <span className="text-muted text-sm">{t.task_id} · {t.pickup_address} → {t.dropoff_address}</span>
                </div>
                <div className="eta-meter text-gold">
                  <h3>{(t.state || '').replace(/_/g, ' ')}</h3>
                  <span className="text-sm">{t.vehicle_code || 'Vehicle pending'}</span>
                </div>
              </div>
            ))}
            {trips && active.length === 0 && (
              <div className="p-md text-muted text-sm">No active transfers right now. Live jobs appear here the moment a driver is assigned.</div>
            )}
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {upcoming.map(t => (
                <tr key={t.id}>
                  <td>{t.passenger_name ? <EntityLink type="Client" value={t.passenger_name} /> : '—'}</td>
                  <td>{t.pickup_address} → {t.dropoff_address}</td>
                  <td>{t.scheduled_at ? new Date(t.scheduled_at).toLocaleString('en-GB') : 'ASAP'}</td>
                  <td>{(t.requested_tier || 'EXECUTIVE').replace(/_/g, ' ')}</td>
                  <td><span className="status-badge bg-gray-dim text-muted">{(t.state || '').replace(/_/g, '-')}</span></td>
                </tr>
              ))}
              {trips && upcoming.length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted p-xl">No upcoming bookings.</td></tr>
              )}
            </tbody>
          </table>
        )}

        {activeTab === 'past' && (
          <table className="data-table">
            <thead>
              <tr>
                <th>Passenger</th>
                <th>Route</th>
                <th>Completed</th>
                <th>Fare</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {past.map(t => (
                <tr key={t.id}>
                  <td>{t.passenger_name ? <EntityLink type="Client" value={t.passenger_name} /> : '—'}</td>
                  <td>{t.pickup_address} → {t.dropoff_address}</td>
                  <td>{t.completed_at ? new Date(t.completed_at).toLocaleString('en-GB') : (t.cancelled_at ? 'Cancelled' : '—')}</td>
                  <td className="font-mono">£{Number(t.custom_price || 0).toFixed(2)}</td>
                  <td><span className="status-badge bg-gray-dim text-muted">{t.state}</span></td>
                </tr>
              ))}
              {trips && past.length === 0 && (
                <tr><td colSpan="5" className="text-center text-muted p-xl">No past trips yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default CorporateTrips;
