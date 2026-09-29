import React, { useState, useCallback } from 'react';
import { Plus, Building2, CreditCard } from 'lucide-react';
import { fetchTenants, upsertTenant, startTenantStripeOnboarding, usePolling } from '../utils/api';

const gbp = (n) => `£${Number(n || 0).toLocaleString('en-GB')}`;

const TenantManagement = () => {
  const load = useCallback(() => fetchTenants(), []);
  const { data: tenants, loading, error, refresh } = usePolling(load, 20000);
  const [editing, setEditing] = useState(null); // null | {} (new) | tenant
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(null);

  const startStripe = async (t) => {
    setBusy(true);
    setMessage(null);
    try {
      const origin = window.location.origin;
      const res = await startTenantStripeOnboarding(t.id, { refreshUrl: `${origin}/stripe/refresh`, returnUrl: `${origin}/stripe/return` });
      setMessage(`Stripe onboarding link created for ${t.name} — opening Stripe…`);
      window.open(res.onboardingUrl, '_blank', 'noopener');
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggleSuspend = async (t) => {
    setBusy(true);
    try {
      await upsertTenant({
        id: t.id, name: t.name, code: t.code,
        activationStatus: t.activation_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
      });
      refresh();
    } catch (err) {
      setMessage(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', marginBottom: 18 }}>
        <div>
          <h2 style={{ margin: 0, color: '#fff', letterSpacing: '0.1em' }}>TENANT MANAGEMENT</h2>
          <span style={{ fontSize: 11, color: '#888' }}>
            {loading ? 'Syncing…' : error ? `Feed error: ${error.message}` : `${(tenants || []).length} tenant companies onboarded platform-wide`}
          </span>
        </div>
        <button className="ob-btn-complete" style={{ marginLeft: 'auto' }} onClick={() => setEditing({})}>
          <Plus size={13} /> ONBOARD TENANT
        </button>
      </div>

      {message && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 10 }}>{message}</div>}

      <table className="sd-table" style={{ width: '100%' }}>
        <thead>
          <tr>
            <th>COMPANY</th><th>CODE</th><th>PLAN</th><th>STATUS</th><th>DRIVERS</th><th>VEHICLES</th><th>TRIPS</th><th>FINDER MARGIN</th><th>STRIPE PAYOUTS</th><th>WHITE-LABEL</th><th>ACTIONS</th>
          </tr>
        </thead>
        <tbody>
          {(tenants || []).map((t) => (
            <tr key={t.id}>
              <td style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Building2 size={13} style={{ color: '#D4AF37' }} /> {t.name}
              </td>
              <td style={{ fontFamily: 'monospace', fontSize: 11 }}>{t.code}</td>
              <td>{t.plan}</td>
              <td>
                <span className={`fv-status ${t.activation_status === 'ACTIVE' ? 'ok' : t.activation_status === 'SUSPENDED' ? 'warn' : 'critical'}`}>
                  {t.activation_status}
                </span>
              </td>
              <td>{t.driver_count}</td>
              <td>{t.vehicle_count}</td>
              <td>{t.trip_count}</td>
              <td>{Math.round(Number(t.finder_margin_rate || 0) * 100)}%</td>
              <td>
                {t.stripe_account_id ? (
                  <span className={`fv-status ${t.stripe_payouts_enabled ? 'ok' : 'warn'}`}>
                    {t.stripe_payouts_enabled ? 'ENABLED' : 'INCOMPLETE'}
                  </span>
                ) : (
                  <span style={{ color: '#888', fontSize: 11 }}>Not linked</span>
                )}
              </td>
              <td>{t.whitelabel_published ? <span className="fv-status ok">PUBLISHED</span> : <span style={{ color: '#888', fontSize: 11 }}>Draft</span>}</td>
              <td style={{ whiteSpace: 'nowrap' }}>
                <button className="ob-btn-outline" onClick={() => setEditing(t)}>CONFIGURE</button>{' '}
                <button className="ob-btn-outline" onClick={() => toggleSuspend(t)} disabled={busy}>
                  {t.activation_status === 'ACTIVE' ? 'SUSPEND' : 'REACTIVATE'}
                </button>{' '}
                <button
                  className="ob-btn-outline"
                  title={t.stripe_account_id ? 'Open a fresh Stripe Connect onboarding link' : 'Link this tenant\'s Stripe account'}
                  onClick={() => startStripe(t)}
                  disabled={busy}
                >
                  <CreditCard size={11} /> {t.stripe_account_id ? 'STRIPE LINK' : 'STRIPE'}
                </button>
              </td>
            </tr>
          ))}
          {!loading && (tenants || []).length === 0 && (
            <tr><td colSpan={11} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No tenants onboarded yet.</td></tr>
          )}
        </tbody>
      </table>

      {editing && (
        <TenantEditForm
          tenant={editing?.id ? editing : null}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); refresh(); }}
        />
      )}
    </div>
  );
};

const TenantEditForm = ({ tenant, onClose, onSaved }) => {
  const [name, setName] = useState(tenant?.name || '');
  const [code, setCode] = useState(tenant?.code || '');
  const [plan, setPlan] = useState(tenant?.plan || 'STANDARD');
  const [status, setStatus] = useState(tenant?.activation_status || 'REGISTRATION');
  const [finderMarginRate, setFinderMarginRate] = useState(tenant ? String(Math.round(Number(tenant.finder_margin_rate || 0.25) * 100)) : '25');
  const [poolMinPrice, setPoolMinPrice] = useState(tenant ? String(tenant.pool_min_price || 0) : '0');
  const [contactEmail, setContactEmail] = useState(tenant?.contact_email || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!name) { setError('Company name is required.'); return; }
    setSaving(true);
    try {
      await upsertTenant({
        id: tenant?.id, code: code || undefined, name, plan, activationStatus: status,
        finderMarginRate: Number(finderMarginRate) / 100,
        poolMinPrice: Number(poolMinPrice),
        contactEmail: contactEmail || undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="u-modal-header">
          <h2 className="u-modal-title">{tenant ? 'Configure Tenant' : 'Onboard Tenant Company'}</h2>
          <button className="u-modal-btn-close" onClick={onClose}>×</button>
        </div>
        <div className="u-modal-body" style={{ display: 'grid', gap: 10 }}>
          <label style={lbl}>COMPANY NAME *</label>
          <input className="ob-input" value={name} onChange={(e) => setName(e.target.value)} />
          {!tenant && (
            <>
              <label style={lbl}>SHORT CODE</label>
              <input className="ob-input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ACME-LUX" />
            </>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>PLAN</label>
              <select className="ob-input" value={plan} onChange={(e) => setPlan(e.target.value)}>
                <option value="STANDARD">Standard</option>
                <option value="PREMIUM">Premium</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div>
              <label style={lbl}>STATUS</label>
              <select className="ob-input" value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="REGISTRATION">Registration</option>
                <option value="ACTIVE">Active</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>FINDER'S MARGIN (%)</label>
              <input className="ob-input" type="number" value={finderMarginRate} onChange={(e) => setFinderMarginRate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>POOL MIN PRICE (£)</label>
              <input className="ob-input" type="number" step="0.01" value={poolMinPrice} onChange={(e) => setPoolMinPrice(e.target.value)} />
            </div>
          </div>
          <label style={lbl}>CONTACT EMAIL</label>
          <input className="ob-input" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} />
          {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}
        </div>
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>CANCEL</button>
          <button className="ob-btn-complete" onClick={submit} disabled={saving}>{saving ? 'SAVING…' : 'SAVE TENANT'}</button>
        </div>
        <div className="security-footer">Verified by Velo AI Security Protocol</div>
      </div>
    </div>
  );
};

const lbl = { fontSize: 10, color: '#888', letterSpacing: '0.08em', display: 'block', marginBottom: 4 };

export default TenantManagement;
