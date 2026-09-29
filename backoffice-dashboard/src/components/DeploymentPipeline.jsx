import React, { useState } from 'react';
import './DeploymentPipeline.css';
import { upsertTenant, fetchTenants } from '../utils/api';

/**
 * TENANT PROVISIONING PIPELINE — live onboarding through the tenants API.
 * The simulated log ticker is replaced by real provisioning state against the
 * database (tenants table + white_label_configs draft).
 */
const DeploymentPipeline = () => {
  const [showProvision, setShowProvision] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [events, setEvents] = useState([]);
  const [tenants, setTenants] = useState([]);

  const log = (line) => setEvents((prev) => [...prev, `${new Date().toLocaleTimeString()} — ${line}`]);

  const provision = async () => {
    if (!companyName) return;
    setBusy(true);
    setEvents([]);
    try {
      log('Creating tenant record in the platform database…');
      const tenant = await upsertTenant({ name: companyName, code: code || undefined, activationStatus: 'REGISTRATION' });
      log(`Tenant ${tenant.name} (${tenant.code}) created with status REGISTRATION.`);
      const all = await fetchTenants();
      setTenants(all || []);
      log('White-label draft initialized — configure branding in the Brand Identity wizard.');
      log('DONE: Provisioning complete. Activation switches to ACTIVE once Stripe Connect is linked.');
      setCompanyName('');
      setCode('');
    } catch (err) {
      log(`PROVISIONING FAILED: ${err.message}`);
    } finally {
      setBusy(false);
    }
  };

  const loadTenants = async () => {
    try {
      setTenants(await fetchTenants());
    } catch { /* unauthenticated */ }
  };

  React.useEffect(() => { loadTenants(); }, []);

  return (
    <div className="deployment-container">
      <div className="deployment-header">
        <h2>TENANT DEPLOYMENT PIPELINE</h2>
        <button className="dp-action-btn" onClick={() => setShowProvision(!showProvision)}>
          {showProvision ? 'CLOSE' : '+ PROVISION NEW TENANT'}
        </button>
      </div>

      {showProvision && (
        <div className="dp-provision-card">
          <input className="dp-input" placeholder="Company Name" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          <input className="dp-input" placeholder="Short Code (e.g. NYC-EXEC)" value={code} onChange={(e) => setCode(e.target.value)} />
          <button className="dp-action-btn" onClick={provision} disabled={busy || !companyName}>
            {busy ? 'PROVISIONING…' : 'RUN PROVISIONING'}
          </button>
        </div>
      )}

      <div className="dp-log-window">
        {events.length === 0 && <div className="dp-log-line muted">Provisioning events will stream here from the live API.</div>}
        {events.map((e, i) => (
          <div key={i} className={`dp-log-line ${e.includes('FAILED') ? 'error' : e.includes('DONE') ? 'success' : ''}`}>{e}</div>
        ))}
      </div>

      <table className="sd-table" style={{ width: '100%', marginTop: 16 }}>
        <thead><tr><th>TENANT</th><th>CODE</th><th>STATUS</th><th>PLAN</th></tr></thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id}>
              <td>{t.name}</td>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.code}</td>
              <td><span className={`fv-status ${t.activation_status === 'ACTIVE' ? 'ok' : 'warn'}`}>{t.activation_status}</span></td>
              <td>{t.plan}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DeploymentPipeline;
