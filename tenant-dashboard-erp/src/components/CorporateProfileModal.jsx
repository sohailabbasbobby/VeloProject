import React, { useState, useEffect } from 'react';
import {
  X, Building2, Wallet, Contact, ShieldCheck, FileText, User, UserCheck, UserX,
  Calendar, Receipt, ChevronLeft, Plus, Trash2,
} from 'lucide-react';
import corporateLogo from '../assets/corporate-logo-placeholder.png';
import './CorporateProfileModal.css';
import './UniversalModal.css';
import './CommandCenter.css';
import ConciergeFeed from './ConciergeFeed';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import {
  fetchCorporateAccount, updateCorporateAccount, createCorporateAccount,
  addAuthorizedUser, removeAuthorizedUser,
} from '../utils/api';

const gbp = (n) => Number(n || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—');

const STATE_LABELS = {
  PENDING_DISPATCH: 'Unassigned', OFFERING_OWN_FLEET: 'Offering to Fleet', IN_POOL: 'In B2B Pool',
  NEGOTIATION: 'Negotiating', ASSIGNED: 'Assigned', DRIVER_EN_ROUTE: 'On the way to Pickup',
  ARRIVED: 'Arrived at pickup', IN_PROGRESS: 'On Trip', COMPLETED: 'Completed', CANCELLED: 'Cancelled',
};

const CreditUtilizationGauge = ({ limit, utilized }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const pct = limit > 0 ? Math.min(1, utilized / limit) : 0;
  const offset = circumference - pct * circumference;

  return (
    <div className="u-modal-gauge-container">
      <svg width="100" height="100" viewBox="0 0 100 100" className="u-modal-gauge-svg">
        <circle cx="50" cy="50" r={radius} stroke="rgba(255, 255, 255, 0.1)" strokeWidth="6" fill="transparent" />
        <circle
          cx="50" cy="50" r={radius}
          stroke="var(--color-gold)" strokeWidth="6" fill="transparent"
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 50 50)"
        />
        <text x="50" y="55" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{Math.round(pct * 100)}%</text>
      </svg>
      <div className="u-modal-gauge-label">
        <div style={{ color: 'white', fontWeight: 'bold' }}>{gbp(utilized)}</div>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '10px' }}>of {gbp(limit)} Limit</div>
      </div>
    </div>
  );
};

/** Real spend trend from the account's trips, grouped by month of scheduled_at. */
const SpendTrendSparkline = ({ trips }) => {
  const now = new Date();
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`, label: d.toLocaleDateString('en-GB', { month: 'short' }) });
  }
  const sums = months.map((m) =>
    (trips || [])
      .filter((t) => t.scheduled_at && String(t.scheduled_at).slice(0, 7) === m.key)
      .reduce((sum, t) => sum + Number(t.custom_price || 0), 0)
  );

  if (sums.filter((s) => s > 0).length < 2) {
    return (
      <div className="u-modal-sparkline-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>
          Not enough booking history for a spend trend yet.
        </div>
      </div>
    );
  }

  const max = Math.max(...sums);
  const min = Math.min(...sums);
  const range = max - min || 1;
  const points = sums.map((val, i) => `${(i / (sums.length - 1)) * 100},${100 - ((val - min) / range) * 80 - 10}`).join(' ');

  return (
    <div className="u-modal-sparkline-container">
      <div className="u-modal-sparkline-title">Spend Trend (6 months)</div>
      <svg width="100%" height="80" viewBox="0 -10 100 120" preserveAspectRatio="none" className="u-modal-sparkline-svg">
        <polyline points={points} fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {sums.map((val, i) => (
          <circle key={i} cx={(i / (sums.length - 1)) * 100} cy={100 - ((val - min) / range) * 80 - 10} r="4" fill="var(--color-onyx)" stroke="var(--color-gold)" strokeWidth="2" />
        ))}
      </svg>
      <div className="u-modal-sparkline-labels">
        <span>{months[0].label}</span>
        <span style={{ color: 'var(--color-gold)' }}>{months[months.length - 1].label}</span>
      </div>
    </div>
  );
};

const CorporateProfileModal = ({ isOpen, onClose, isNew, client }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [live, setLive] = useState(client);
  const [selectedUser, setSelectedUser] = useState(null);
  const [addUserOpen, setAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fullName: '', email: '', phone: '', costCenter: '' });
  const [userSaving, setUserSaving] = useState(false);
  const [userError, setUserError] = useState(null);
  const { openSummaryModal, setSelectedCorporateClient } = useEntityLinker();

  useEffect(() => { setLive(client); setIsEditing(isNew || false); setActiveTab('overview'); setSelectedUser(null); }, [client, isNew]);

  if (!isOpen) return null;

  const c = live || {};
  const accountId = c.id || null;
  const name = isNew ? 'New Corporate Client' : (c.company_name || 'Corporate Account');
  const logo = corporateLogo;

  const primaryContact = (c.authorizedUsers || []).find((u) => u.is_primary_contact) || null;
  const authorizedUsers = c.authorizedUsers || [];
  const invoices = c.invoices || [];
  const trips = c.trips || [];

  // Real billing KPIs computed from the account's invoices + trips
  const year = new Date().getFullYear();
  const ytdRevenue = invoices
    .filter((i) => i.created_at && new Date(i.created_at).getFullYear() === year && i.status !== 'VOID')
    .reduce((sum, i) => sum + Number(i.customer_retail_fare || 0), 0);
  const outstanding = invoices
    .filter((i) => ['ISSUED', 'OVERDUE'].includes(i.status))
    .reduce((sum, i) => sum + Number(i.customer_retail_fare || 0), 0);
  const invoicedTripIds = new Set(invoices.map((i) => i.trip_id).filter(Boolean));
  const unbilledTrips = trips.filter((t) => !invoicedTripIds.has(t.id) && !['CANCELLED'].includes(t.state));

  const activeTrips = trips.filter((t) => ['ASSIGNED', 'DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'].includes(t.state));
  const upcomingTrips = trips.filter((t) => ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION'].includes(t.state));
  const completedTrips = trips.filter((t) => t.state === 'COMPLETED');

  const startEdit = () => {
    setForm({
      companyName: c.company_name || '',
      industry: c.industry || '',
      billingEmail: c.billing_email || '',
      billingAddress: c.billing_address || '',
      vatNumber: c.vat_number || '',
      lineOfCreditLimit: c.line_of_credit_limit != null ? String(c.line_of_credit_limit) : '',
      paymentTermsDays: c.payment_terms_days || 30,
      preferredVehicleTier: c.preferred_vehicle_tier || '',
      purchaseOrderRequired: Boolean(c.purchase_order_required),
      notes: c.notes || '',
    });
    setSaveError(null);
    setIsEditing(true);
  };

  const saveEdits = async () => {
    setSaveError(null);
    setSaving(true);
    try {
      if (isNew || !accountId) {
        const created = await createCorporateAccount({
          ...form,
          lineOfCreditLimit: form.lineOfCreditLimit ? Number(form.lineOfCreditLimit) : undefined,
          paymentTermsDays: Number(form.paymentTermsDays) || 30,
        });
        setIsEditing(false);
        onClose();
        if (created && created.reference_code) setSelectedCorporateClient(await fetchCorporateAccount(created.id));
      } else {
        await updateCorporateAccount(accountId, {
          ...form,
          lineOfCreditLimit: form.lineOfCreditLimit ? Number(form.lineOfCreditLimit) : undefined,
          paymentTermsDays: Number(form.paymentTermsDays) || 30,
        });
        const refreshed = await fetchCorporateAccount(accountId);
        setLive(refreshed);
        setSelectedCorporateClient(refreshed);
        setIsEditing(false);
      }
    } catch (e) {
      setSaveError(e.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  const submitNewUser = async () => {
    setUserError(null);
    if (!newUser.fullName.trim() || !newUser.email.trim()) {
      setUserError('Full name and email are required.');
      return;
    }
    setUserSaving(true);
    try {
      await addAuthorizedUser(accountId, {
        fullName: newUser.fullName.trim(),
        email: newUser.email.trim(),
        phone: newUser.phone.trim() || undefined,
        costCenter: newUser.costCenter.trim() || undefined,
      });
      setAddUserOpen(false);
      setNewUser({ fullName: '', email: '', phone: '', costCenter: '' });
      const refreshed = await fetchCorporateAccount(accountId);
      setLive(refreshed);
      setSelectedCorporateClient(refreshed);
    } catch (e) {
      setUserError(e.message || 'Failed to add user.');
    } finally {
      setUserSaving(false);
    }
  };

  const removeUser = async (u) => {
    setUserError(null);
    try {
      await removeAuthorizedUser(accountId, u.id);
      const refreshed = await fetchCorporateAccount(accountId);
      setLive(refreshed);
      setSelectedCorporateClient(refreshed);
    } catch (e) {
      setUserError(e.message || 'Failed to remove user.');
    }
  };

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isNew ? 'Onboard Corporate Client' : `CORPORATE ACCOUNT: ${c.reference_code || ''}`}</h2>
          </div>
          <div className="u-modal-header-actions">
            {isEditing ? (
              <button className="u-modal-btn-save" onClick={saveEdits} disabled={saving}>{saving ? 'SAVING…' : 'SAVE ACCOUNT'}</button>
            ) : (
              <button className="u-modal-btn-edit" onClick={startEdit}>EDIT ACCOUNT</button>
            )}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Hero */}
        <div className="u-modal-hero" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '0' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div className="u-modal-hero-avatar-container">
              <img src={logo} alt="Corporate Logo" className="u-modal-hero-avatar" />
            </div>
            <div className="u-modal-hero-info" style={{ flexGrow: 1 }}>
              <h1 className="u-modal-hero-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{name}</h1>
              <p className="u-modal-hero-subtitle" style={{ fontSize: '14px', letterSpacing: '1px' }}>
                {c.industry || 'Corporate'} • <span style={{ color: 'var(--color-gold)' }}>{c.preferred_vehicle_tier ? c.preferred_vehicle_tier.replace(/_/g, ' ') : 'NO TIER PREFERENCE'}</span>
              </p>
            </div>
          </div>

          <div className="u-modal-hero-persistent-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Billing Email</span>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{c.billing_email || 'Not set'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Primary Contact</span>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{primaryContact ? primaryContact.full_name : 'None designated'}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Payment Terms</span>
              <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>Net {c.payment_terms_days || 30}{c.purchase_order_required ? ' · PO Required' : ''}</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Account Status</span>
              <span style={{ fontSize: '13px', color: 'var(--status-completed)', fontWeight: 'bold' }}>{c.status || 'ACTIVE'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>BOOKINGS</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>BILLING HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>AUTHORIZED USERS</button>
          <button className={`u-modal-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>ENGAGEMENT</button>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          {saveError && (
            <div className="u-modal-section" style={{ color: '#ff6b6b', fontSize: 12 }}>Save error: {saveError}</div>
          )}

          {activeTab === 'overview' && (
            <>
              {/* Identity & Location */}
              <div className="u-modal-section">
                <div className="u-modal-section-header"><Building2 size={16} /> IDENTITY & LOCATION</div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Company Name</label>
                    <input
                      type="text" className="u-modal-input"
                      value={isEditing ? form.companyName ?? '' : (c.company_name || '')}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Reference Code</label>
                    <input type="text" className="u-modal-input" value={c.reference_code || 'Assigned on create'} readOnly />
                  </div>
                </div>
                <div className="u-modal-field" style={{ marginTop: '16px' }}>
                  <label className="u-modal-label">Billing Address</label>
                  <input
                    type="text" className="u-modal-input"
                    value={isEditing ? form.billingAddress ?? '' : (c.billing_address || 'Not set')}
                    onChange={(e) => setForm({ ...form, billingAddress: e.target.value })}
                    readOnly={!isEditing}
                  />
                </div>
                <div className="u-modal-grid-2" style={{ marginTop: '16px' }}>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Industry</label>
                    <input
                      type="text" className="u-modal-input"
                      value={isEditing ? form.industry ?? '' : (c.industry || 'Not set')}
                      onChange={(e) => setForm({ ...form, industry: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">VAT Number</label>
                    <input
                      type="text" className="u-modal-input"
                      value={isEditing ? form.vatNumber ?? '' : (c.vat_number || 'Not set')}
                      onChange={(e) => setForm({ ...form, vatNumber: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                </div>
              </div>

              {/* Contacts (from live authorized users) */}
              <div className="u-modal-section">
                <div className="u-modal-section-header"><Contact size={16} /> PRIMARY & FINANCE CONTACTS</div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Billing / Finance Email</label>
                    <input
                      type="text" className="u-modal-input"
                      value={isEditing ? form.billingEmail ?? '' : (c.billing_email || 'Not set')}
                      onChange={(e) => setForm({ ...form, billingEmail: e.target.value })}
                      readOnly={!isEditing}
                    />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Primary Contact</label>
                    <input
                      type="text" className="u-modal-input"
                      value={primaryContact ? `${primaryContact.full_name}${primaryContact.phone ? ` · ${primaryContact.phone}` : ''}` : 'None designated'}
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Authorized Personnel Summary — real counts */}
              <div className="u-modal-section">
                <div className="u-modal-section-header"><UserCheck size={16} /> AUTHORIZED PERSONNEL SUMMARY</div>
                <div className="u-modal-grid-3">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Total Users</label>
                    <input type="text" className="u-modal-input u-modal-val-gold" value={`${authorizedUsers.length} Personnel`} readOnly />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Full Booking Permission</label>
                    <input type="text" className="u-modal-input" value={`${authorizedUsers.filter((u) => u.booking_permission === 'FULL').length} Permitted`} readOnly />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Manage Personnel</label>
                    <button className="u-modal-btn-edit" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setActiveTab('users')}>VIEW DIRECTORY</button>
                  </div>
                </div>
              </div>

              {/* Financial Intelligence — real credit + spend */}
              <div className="u-modal-section">
                <div className="u-modal-section-header"><Wallet size={16} /> FINANCIAL INTELLIGENCE</div>
                <div className="u-modal-financial-dashboard">
                  <div className="u-modal-financial-card">
                    <div className="u-modal-financial-card-header">Credit Utilization</div>
                    {Number(c.line_of_credit_limit) > 0 ? (
                      <CreditUtilizationGauge limit={Number(c.line_of_credit_limit)} utilized={Number(c.outstanding_total || 0)} />
                    ) : (
                      <div style={{ color: 'var(--color-text-muted)', fontSize: '12px', padding: '12px 0' }}>
                        No credit limit set. Outstanding: <strong style={{ color: '#fff' }}>{gbp(c.outstanding_total || outstanding)}</strong>
                      </div>
                    )}
                  </div>
                  <div className="u-modal-financial-card" style={{ flexGrow: 1 }}>
                    <SpendTrendSparkline trips={trips} />
                  </div>
                  <div className="u-modal-financial-card u-modal-financial-summary">
                    <div className="u-modal-summary-item">
                      <span className="u-modal-summary-label">Payment Terms</span>
                      <span className="u-modal-summary-value">Net {c.payment_terms_days || 30}</span>
                    </div>
                    <div className="u-modal-summary-item">
                      <span className="u-modal-summary-label">Open Invoices</span>
                      <span className="u-modal-summary-value">{c.open_invoice_count ?? invoices.filter((i) => ['ISSUED', 'OVERDUE'].includes(i.status)).length}</span>
                    </div>
                    <div className="u-modal-summary-item">
                      <span className="u-modal-summary-label">VAT Number</span>
                      <span className="u-modal-summary-value">{c.vat_number || 'Not set'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="u-modal-section">
                <div className="u-modal-section-header"><Contact size={16} /> SLA & PREFERENCES</div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Preferred Vehicle Class</label>
                    {isEditing ? (
                      <select className="u-modal-input" value={form.preferredVehicleTier ?? ''} onChange={(e) => setForm({ ...form, preferredVehicleTier: e.target.value })}>
                        <option value="">No preference</option>
                        <option value="EXECUTIVE">Executive (E-Class/5-Series)</option>
                        <option value="PREMIUM_MPV">Premium MPV (V-Class/EQV)</option>
                        <option value="FIRST_CLASS">First Class (S-Class/7-Series)</option>
                        <option value="ULTRA_LUXURY">Ultra-Luxury (Maybach/Phantom)</option>
                      </select>
                    ) : (
                      <input type="text" className="u-modal-input" value={c.preferred_vehicle_tier ? c.preferred_vehicle_tier.replace(/_/g, ' ') : 'No preference'} readOnly />
                    )}
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Purchase Order Required</label>
                    {isEditing ? (
                      <select className="u-modal-input" value={form.purchaseOrderRequired ? 'yes' : 'no'} onChange={(e) => setForm({ ...form, purchaseOrderRequired: e.target.value === 'yes' })}>
                        <option value="no">No</option>
                        <option value="yes">Yes</option>
                      </select>
                    ) : (
                      <input type="text" className="u-modal-input" value={c.purchase_order_required ? 'Yes' : 'No'} readOnly />
                    )}
                  </div>
                </div>
                <div className="u-modal-field" style={{ marginTop: '16px' }}>
                  <label className="u-modal-label">Account Notes</label>
                  {isEditing ? (
                    <textarea
                      className="u-modal-input" rows={2}
                      value={form.notes ?? ''}
                      onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    />
                  ) : (
                    <input type="text" className="u-modal-input" value={c.notes || 'No notes recorded.'} readOnly />
                  )}
                </div>
              </div>
            </>
          )}

          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
              {/* KPI bar — real counts from the account's trips */}
              <div style={{ flex: '0 0 auto', display: 'flex', gap: '16px' }}>
                <div className="u-metric-massive" style={{ borderColor: 'var(--color-gold)', backgroundColor: 'rgba(212,175,55,0.05)' }}>
                  <div className="u-metric-number"><UserCheck size={28} />{activeTrips.length}</div>
                  <div className="u-metric-label">ACTIVE</div>
                </div>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><Calendar size={28} />{upcomingTrips.length}</div>
                  <div className="u-metric-label">UPCOMING</div>
                </div>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><Receipt size={28} />{completedTrips.length}</div>
                  <div className="u-metric-label">COMPLETED</div>
                </div>
              </div>
              <div className="cc-table-container">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>TASK ID</th>
                      <th style={{ width: '35%' }}>ROUTE</th>
                      <th style={{ width: '18%' }}>SCHEDULED</th>
                      <th style={{ width: '14%' }}>FARE</th>
                      <th style={{ width: '18%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {trips.map((t) => (
                      <tr key={t.id} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                        title: 'Booking Detail', subtitle: t.task_id, status: STATE_LABELS[t.state] || t.state, icon: 'file',
                        primaryMetric: { label: 'FARE', value: gbp(t.custom_price) },
                        fields: [
                          { label: 'Route', value: `${t.pickup_address} → ${t.dropoff_address}` },
                          { label: 'Scheduled', value: t.scheduled_at ? new Date(t.scheduled_at).toLocaleString('en-GB') : 'ASAP' },
                          { label: 'Passenger', value: t.passenger_name || '—' },
                        ],
                      })}>
                        <td className="text-gold font-bold">{t.task_id}</td>
                        <td className="text-white">{t.pickup_address} → {t.dropoff_address}</td>
                        <td className="text-white">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleString('en-GB') : 'ASAP'}</td>
                        <td className="text-white font-bold">{gbp(t.custom_price)}</td>
                        <td><span className="cc-status-badge status-unassigned">{STATE_LABELS[t.state] || t.state}</span></td>
                      </tr>
                    ))}
                    {trips.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No bookings recorded for this account yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="u-modal-tab-content">
              <div className="u-modal-section-header" style={{ marginBottom: '16px' }}>
                <FileText size={16} /> BILLING SUMMARY
              </div>

              {/* Finance Contact Block — real fields only */}
              <div className="u-modal-section" style={{ marginBottom: '24px' }}>
                <div className="u-modal-grid-3">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Billing Email</label>
                    <div className="u-modal-value-box">{c.billing_email || 'Not set'}</div>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">VAT Number</label>
                    <div className="u-modal-value-box">{c.vat_number || 'Not set'}</div>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Payment Terms</label>
                    <div className="u-modal-value-box">Net {c.payment_terms_days || 30}{c.purchase_order_required ? ' · PO Required' : ''}</div>
                  </div>
                </div>
              </div>

              <div className="u-metric-row" style={{ marginBottom: '32px', display: 'flex', gap: '16px' }}>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><Receipt size={32} />{gbp(ytdRevenue)}</div>
                  <div className="u-metric-label">TOTAL REVENUE (YTD)</div>
                </div>
                <div className="u-metric-massive" style={{ borderColor: 'rgba(255, 77, 77, 0.3)', backgroundColor: 'rgba(255, 77, 77, 0.05)' }}>
                  <div className="u-metric-number" style={{ color: '#ff4d4d' }}><Wallet size={32} />{gbp(outstanding)}</div>
                  <div className="u-metric-label" style={{ color: '#ff4d4d' }}>OUTSTANDING</div>
                </div>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><FileText size={32} />{unbilledTrips.length}</div>
                  <div className="u-metric-label">UNBILLED TRIPS</div>
                </div>
              </div>

              <div className="u-modal-section-header" style={{ marginBottom: '16px' }}>
                <Receipt size={16} /> UNBILLED TRIPS (NOT YET ON AN INVOICE)
              </div>
              <div className="cc-table-container" style={{ marginBottom: '32px' }}>
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>TASK ID</th>
                      <th style={{ width: '35%' }}>ROUTE</th>
                      <th style={{ width: '20%' }}>DATE</th>
                      <th style={{ width: '15%' }}>AMOUNT</th>
                      <th style={{ width: '15%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {unbilledTrips.map((t) => (
                      <tr key={t.id} className="cc-card-row">
                        <td className="text-gold font-bold">{t.task_id}</td>
                        <td className="text-white">{t.pickup_address} → {t.dropoff_address}</td>
                        <td className="text-white">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString('en-GB') : 'ASAP'}</td>
                        <td className="text-white font-bold">{gbp(t.custom_price)}</td>
                        <td><span className="cc-status-badge status-waiting">Unbilled</span></td>
                      </tr>
                    ))}
                    {unbilledTrips.length === 0 && (
                      <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Every completed trip is on an invoice.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="u-modal-section-header" style={{ marginBottom: '16px' }}>
                <Receipt size={16} /> PAST INVOICES
              </div>
              <div className="cc-table-container">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '5%' }}></th>
                      <th style={{ width: '25%' }}>INVOICE NO.</th>
                      <th style={{ width: '20%' }}>ISSUED</th>
                      <th style={{ width: '20%' }}>DUE</th>
                      <th style={{ width: '15%' }}>AMOUNT</th>
                      <th style={{ width: '15%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                        title: 'Corporate Invoice Detail', subtitle: inv.invoice_number, status: inv.status, icon: 'financial',
                        primaryMetric: { label: 'TOTAL AMOUNT', value: gbp(inv.customer_retail_fare) },
                        fields: [
                          { label: 'Issued', value: fmtDate(inv.created_at) },
                          { label: 'Due', value: fmtDate(inv.due_date) },
                          { label: 'Status', value: inv.status },
                        ],
                      })}>
                        <td style={{ textAlign: 'center' }}><Receipt size={16} color="var(--color-text-muted)" /></td>
                        <td className="text-gold font-bold">{inv.invoice_number}</td>
                        <td className="text-white">{fmtDate(inv.created_at)}</td>
                        <td className="text-white">{fmtDate(inv.due_date)}</td>
                        <td className="text-white font-bold">{gbp(inv.customer_retail_fare)}</td>
                        <td><span className={`cc-status-badge cc-status-${String(inv.status).toLowerCase()}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                    {invoices.length === 0 && (
                      <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No invoices issued to this account yet.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="u-modal-tab-content">
              {selectedUser ? (
                <div className="u-modal-user-drilldown">
                  <div className="u-modal-drilldown-header" style={{ marginBottom: '24px' }}>
                    <button
                      className="u-modal-btn-save" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', color: 'var(--color-gold)', border: '1px solid var(--color-gold)' }}
                      onClick={() => setSelectedUser(null)}
                    >
                      <ChevronLeft size={16} /> BACK TO DIRECTORY
                    </button>
                  </div>
                  <div className="u-modal-drilldown-profile" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="u-modal-drilldown-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={40} />
                    </div>
                    <div className="u-modal-drilldown-info">
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff', fontFamily: 'var(--font-family-main)' }}>{selectedUser.full_name}</h3>
                      <div className="u-modal-drilldown-role" style={{ color: 'var(--color-gold)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                        {selectedUser.booking_permission === 'FULL' ? 'Booking Permitted' : 'Restricted Booker'}{selectedUser.cost_center ? ` · ${selectedUser.cost_center}` : ''}
                      </div>
                      <div className="u-modal-drilldown-contact" style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>
                        {selectedUser.email}{selectedUser.phone ? ` • ${selectedUser.phone}` : ''}
                      </div>
                    </div>
                  </div>
                  <div className="u-modal-section-header" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> TRIPS BOOKED BY {String(selectedUser.full_name).toUpperCase()}
                    </div>
                  </div>
                  <div className="cc-table-container">
                    <table className="cc-table">
                      <thead>
                        <tr>
                          <th style={{ width: '20%' }}>TASK ID</th>
                          <th style={{ width: '40%' }}>ROUTE</th>
                          <th style={{ width: '20%' }}>DATE</th>
                          <th style={{ width: '20%' }}>AMOUNT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {trips.filter((t) => (t.corporate_booker_name || '') === selectedUser.full_name).map((t) => (
                          <tr key={t.id} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                            title: 'User Booking Detail', subtitle: t.task_id, status: STATE_LABELS[t.state] || t.state, icon: 'file',
                            primaryMetric: { label: 'FARE', value: gbp(t.custom_price) },
                            fields: [{ label: 'Route', value: `${t.pickup_address} → ${t.dropoff_address}` }, { label: 'Scheduled', value: t.scheduled_at ? new Date(t.scheduled_at).toLocaleString('en-GB') : 'ASAP' }],
                          })}>
                            <td className="text-gold font-bold">{t.task_id}</td>
                            <td className="text-white">{t.pickup_address} → {t.dropoff_address}</td>
                            <td className="text-white">{t.scheduled_at ? new Date(t.scheduled_at).toLocaleDateString('en-GB') : 'ASAP'}</td>
                            <td className="text-white font-bold">{gbp(t.custom_price)}</td>
                          </tr>
                        ))}
                        {trips.filter((t) => (t.corporate_booker_name || '') === selectedUser.full_name).length === 0 && (
                          <tr><td colSpan={4} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No trips recorded as booked by this user.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  <div className="u-modal-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <UserCheck size={16} /> AUTHORIZED PERSONNEL
                    </div>
                    {accountId && (
                      <button className="u-modal-btn-edit" style={{ padding: '6px 14px', display: 'flex', alignItems: 'center', gap: '6px' }} onClick={() => { setAddUserOpen(true); setUserError(null); }}>
                        <Plus size={12} /> ADD USER
                      </button>
                    )}
                  </div>
                  {userError && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 12 }}>{userError}</div>}
                  <div className="cpm-user-grid">
                    {authorizedUsers.map((u) => (
                      <div key={u.id} className="cpm-user-card" style={{ cursor: 'pointer', border: '1px solid var(--color-gold)' }} onClick={() => setSelectedUser(u)}>
                        <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '9px', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>Click to View Profile</div>
                        <div className="cpm-user-header" style={{ marginTop: '16px' }}>
                          <div className="cpm-user-avatar"><User size={20} /></div>
                          <div className="cpm-user-info">
                            <div className="cpm-user-name">{u.full_name}{u.is_primary_contact ? ' ★' : ''}</div>
                            <div className="cpm-user-role">{u.booking_permission === 'FULL' ? 'Booking Permitted' : 'Restricted'}{u.cost_center ? ` · ${u.cost_center}` : ''}</div>
                          </div>
                        </div>
                        <div className="cpm-user-contact">
                          <div>{u.email}</div>
                          <div>{u.phone || 'No phone on file'}</div>
                        </div>
                        <div className="cpm-user-actions" onClick={(e) => e.stopPropagation()}>
                          <span className={`cpm-user-status ${u.booking_permission === 'FULL' ? 'active' : 'inactive'}`}>
                            {u.booking_permission === 'FULL' ? 'FULL ACCESS' : 'RESTRICTED'}
                          </span>
                          {accountId && (
                            <button
                              title="Remove user"
                              style={{ background: 'transparent', border: '1px solid rgba(255,77,77,0.4)', borderRadius: 4, color: '#ff4d4d', padding: '4px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                              onClick={() => removeUser(u)}
                            >
                              <UserX size={12} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                    {authorizedUsers.length === 0 && (
                      <div style={{ color: '#888', fontSize: 12, padding: 14 }}>
                        No authorized users on this account yet{accountId ? ' — use “Add User” to add the first booker.' : '.'}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {activeTab === 'engagement' && (
          <div className="u-modal-tab-content" style={{ padding: 0 }}>
            <ConciergeFeed clientRef={c.reference_code} clientName={c.company_name} />
          </div>
        )}

        {/* Persistent Footer */}
        <div className="u-modal-footer">
          <div className="u-modal-footer-badge">
            <ShieldCheck size={14} color="var(--color-gold)" /> VERIFIED BY VELO AI SECURITY PROTOCOL
          </div>
        </div>

      </div>

      {/* Add Authorized User modal — persists via POST /api/trips/corporate/:id/users */}
      {addUserOpen && accountId && (
        <div className="u-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setAddUserOpen(false)}>
          <div className="u-modal-container" style={{ width: '520px', height: 'auto', minHeight: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="u-modal-header">
              <h3 style={{ color: 'var(--color-gold)', margin: 0 }}>ADD AUTHORIZED USER</h3>
              <button className="u-modal-btn-close" onClick={() => setAddUserOpen(false)}><X size={20} /></button>
            </div>
            <div className="u-modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>FULL NAME *</label>
                <input
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                />
              </div>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>EMAIL *</label>
                <input
                  type="email"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                />
              </div>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>PHONE</label>
                <input
                  value={newUser.phone}
                  onChange={(e) => setNewUser({ ...newUser, phone: e.target.value })}
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                />
              </div>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>COST CENTER</label>
                <input
                  value={newUser.costCenter}
                  onChange={(e) => setNewUser({ ...newUser, costCenter: e.target.value })}
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                />
              </div>
              {userError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{userError}</div>}
              <button
                className="u-modal-btn-save" style={{ padding: '12px 24px' }}
                disabled={userSaving}
                onClick={submitNewUser}
              >
                {userSaving ? 'SAVING…' : 'ADD USER'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default CorporateProfileModal;
