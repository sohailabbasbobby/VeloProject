import React, { useCallback } from 'react';
import './CorporateRoster.css';
import { fetchCorporateUsers, usePolling } from '../utils/api';

/**
 * COMPANY TRAVEL ROSTER — fully live (final-mile pass).
 * Lists the real corporate_authorized_users joined to their accounts via
 * /api/fm/corporate-users. The Add Employee action routes managers to the
 * Corporate Accounts & Billing hub where the authorized-user CRUD lives.
 */
const CorporateRoster = () => {
  const load = useCallback(() => fetchCorporateUsers(), []);
  const { data: users, error, loading } = usePolling(load, 30000);

  return (
    <div className="corporate-roster">
      <div className="corp-header flex-row space-between">
        <div>
          <h2>Company Travel Roster</h2>
          <p className="text-muted">Authorized personnel across all corporate accounts.</p>
        </div>
        <a className="btn-outline" href="#" onClick={(e) => { e.preventDefault(); window.dispatchEvent(new CustomEvent('velo:navigate', { detail: { tab: 'accounts' } })); }}>
          ＋ Add Employee (Accounts & Billing)
        </a>
      </div>

      <div className="roster-table-wrapper surface-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Name</th>
              <th>Corporate Account</th>
              <th>Booking Permission</th>
              <th>Cost Center</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            {error && <tr><td colSpan="5" style={{ color: 'var(--color-danger)' }} className="p-md">Live link error: {error.message}</td></tr>}
            {loading && !users && <tr><td colSpan="5" className="text-center text-muted p-xl">Loading live roster…</td></tr>}
            {(users || []).map(u => (
              <tr key={u.id}>
                <td className="font-bold">{u.full_name}{u.is_primary_contact ? <span className="text-gold text-xs"> · PRIMARY</span> : null}</td>
                <td>{u.company_name} <span className="text-muted text-xs">({u.account_code})</span></td>
                <td>{(u.booking_permission || 'BOOKING').replace(/_/g, ' ')}</td>
                <td>{u.cost_center || '—'}</td>
                <td className="text-muted text-sm">{u.email || u.phone || '—'}</td>
              </tr>
            ))}
            {!loading && users && users.length === 0 && !error && (
              <tr><td colSpan="5" className="text-center text-muted p-xl">
                No authorized users yet. Add bookers from a corporate account profile in Accounts & Billing.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default CorporateRoster;
