import React, { useMemo, useState, useCallback } from 'react';
import { Plus, ShieldAlert, UserCircle } from 'lucide-react';
import './ChauffeurHub.css';
import OnboardChauffeurModal from './modals/OnboardChauffeurModal';
import { fetchDrivers, usePolling } from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const complianceState = (d) => {
  const expiries = [d.license_expiry, d.pco_badge_expiry].filter(Boolean).map((x) => new Date(x).getTime());
  if (!expiries.length) return { label: 'NO DOCS', cls: 'warn' };
  const soonest = Math.min(...expiries);
  const days = (soonest - Date.now()) / 86400e3;
  if (days < 0) return { label: 'EXPIRED', cls: 'critical' };
  if (days < 30) return { label: `EXPIRING ${Math.ceil(days)}d`, cls: 'warn' };
  return { label: 'VERIFIED', cls: 'ok' };
};

const ChauffeurHub = () => {
  const load = useCallback(() => fetchDrivers(), []);
  const { data: drivers, loading, error, refresh } = usePolling(load, 20000);
  const [isOnboardOpen, setIsOnboardOpen] = useState(false);
  const { openDriverProfile } = useEntityLinker();

  const alerts = useMemo(
    () => (drivers || []).filter((d) => ['EXPIRED', 'NO DOCS'].includes(complianceState(d).label) || complianceState(d).cls === 'warn'),
    [drivers]
  );

  return (
    <div className="chauffeur-hub">
      <div className="chub-header">
        <div>
          <h2>CHAUFFEUR PERSONNEL HUB</h2>
          <span className="chub-subtitle">
            {loading ? 'Syncing live personnel data…' : error ? `Live feed error: ${error.message}` : `${(drivers || []).length} active chauffeurs · live from database`}
          </span>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10 }}>
          {alerts.length > 0 && (
            <div className="chub-compliance-alert">
              <ShieldAlert size={14} /> {alerts.length} compliance alert{alerts.length > 1 ? 's' : ''}
            </div>
          )}
          <button className="chub-add-btn" onClick={() => setIsOnboardOpen(true)}>
            <Plus size={14} /> Onboard Chauffeur
          </button>
        </div>
      </div>

      <div className="chub-grid">
        {(drivers || []).map((d) => {
          const comp = complianceState(d);
          return (
            <div key={d.id} className="chub-card" onClick={() => openDriverProfile(d.reference_code || d.full_name)}>
              <div className="chub-card-avatar">
                {d.photo_url ? <img src={d.photo_url} alt={d.full_name} /> : <UserCircle size={34} />}
              </div>
              <div className="chub-card-main">
                <div className="chub-card-name">{d.full_name || `${d.first_name} ${d.last_name}`}</div>
                <div className="chub-card-meta">
                  <span className="chub-ref">{d.reference_code}</span>
                  <span className={`chub-pill ${d.status === 'ON_TRIP' ? 'active' : d.status === 'ONLINE' ? 'online' : ''}`}>
                    {d.status === 'ON_TRIP' ? 'On Shift' : d.status}
                  </span>
                </div>
              </div>
              <div className="chub-card-side">
                <span className={`chub-compliance ${comp.cls}`}>{comp.label}</span>
                <span className="chub-rating">★ {Number(d.average_rating || 5).toFixed(2)}</span>
              </div>
            </div>
          );
        })}
        {!loading && (drivers || []).length === 0 && (
          <div className="chub-empty">No chauffeurs onboarded yet. Use “Onboard Chauffeur” to create the first live profile.</div>
        )}
      </div>

      {isOnboardOpen && (
        <OnboardChauffeurModal
          onClose={() => setIsOnboardOpen(false)}
          onSaved={() => { setIsOnboardOpen(false); refresh(); }}
        />
      )}
      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default ChauffeurHub;
