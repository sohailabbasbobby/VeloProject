import React, { useState, useEffect, useCallback } from 'react';
import { X, Building2, FileText, Plus, ShieldCheck, User } from 'lucide-react';
import './VehicleProfileModal.css';
import './UniversalModal.css';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import { fetchVehicle, updateMaintenanceLog, createMaintenanceLog, addFleetExpense, fetchSettings } from '../utils/api';
import EntityLink from './EntityLink';
import AddVehicleModal from './modals/AddVehicleModal';

const gbp = (n) => Number(n || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP' });
const fmtDate = (d) => (d ? new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase() : '—');
const fmtDateTime = (d) => (d ? new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit' }).toUpperCase() : '—');

let VAT_RATE = 0.20;

const VehicleProfileModal = ({ vehicle, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [resolutionAmount, setResolutionAmount] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [includeVat, setIncludeVat] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [liveVehicle, setLiveVehicle] = useState(vehicle);
  const [detail, setDetail] = useState(null);
  const [detailError, setDetailError] = useState(null);
  const [mileageSearch, setMileageSearch] = useState('');
  const [expenseModalOpen, setExpenseModalOpen] = useState(false);
  const [expenseForm, setExpenseForm] = useState({ expenseType: 'FUEL', amount: '', description: '' });
  const [expenseSaving, setExpenseSaving] = useState(false);
  const [expenseError, setExpenseError] = useState(null);
  const [resolveSaving, setResolveSaving] = useState(false);
  const [resolveError, setResolveError] = useState(null);
  const [issueModalOpen, setIssueModalOpen] = useState(false);
  const [issueForm, setIssueForm] = useState({ issueDescription: '', severity: 'LOW' });
  const [issueSaving, setIssueSaving] = useState(false);
  const [issueError, setIssueError] = useState(null);
  const { openSummaryModal } = useEntityLinker();

  const vehicleId = vehicle && vehicle.id ? vehicle.id : null;

  // Live vehicle detail: maintenance logs, expenses, odometer logs, VAT setting
  const loadDetail = useCallback(() => {
    if (!vehicleId) return;
    fetchVehicle(vehicleId)
      .then((d) => { setDetail(d); setDetailError(null); })
      .catch((e) => setDetailError(e));
  }, [vehicleId]);

  useEffect(() => { setLiveVehicle(vehicle); }, [vehicle]);
  useEffect(() => {
    setActiveTab('overview'); setSelectedLogId(null); setDetail(null); setDetailError(null);
    setMileageSearch(''); setExpenseModalOpen(false); setIssueModalOpen(false);
  }, [vehicleId]);
  useEffect(() => { loadDetail(); }, [loadDetail]);
  useEffect(() => {
    fetchSettings()
      .then((s) => { if (s && s.vat_rate !== undefined && s.vat_rate !== null) VAT_RATE = Number(s.vat_rate); })
      .catch(() => undefined);
  }, []);

  const refreshDetail = () => loadDetail();

  const maintenanceLogs = (detail && detail.maintenanceLogs) || [];
  const expenses = (detail && detail.expenses) || [];

  // Odometer logs with real per-log deltas (reading minus previous reading), newest first
  const odometerRows = (() => {
    const logs = (detail && detail.odometerLogs) || [];
    const asc = [...logs].sort((a, b) => new Date(a.logged_at) - new Date(b.logged_at));
    const deltaById = new Map();
    asc.forEach((o, i) => {
      deltaById.set(o.id, i > 0 ? Number(o.reading) - Number(asc[i - 1].reading) : null);
    });
    const desc = [...logs].sort((a, b) => new Date(b.logged_at) - new Date(a.logged_at));
    const q = mileageSearch.trim().toLowerCase();
    return desc
      .map((o) => ({ ...o, delta: deltaById.get(o.id) }))
      .filter((o) => !q || `${o.driver_name || ''} ${o.driver_code || ''} ${o.event_type || ''}`.toLowerCase().includes(q));
  })();

  // Real YTD expense totals by category
  const expenseSummary = (() => {
    const year = new Date().getFullYear();
    const ytd = expenses.filter((e) => e.logged_at && new Date(e.logged_at).getFullYear() === year);
    const total = ytd.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const byCat = {};
    ytd.forEach((e) => { byCat[e.expense_type] = (byCat[e.expense_type] || 0) + Number(e.amount || 0); });
    return { total, byCat };
  })();

  if (!vehicle) return null;

  if (isEditing) {
    return (
      <AddVehicleModal
        isOpen={isEditing}
        onClose={() => setIsEditing(false)}
        data={liveVehicle}
        isEditMode={true}
        onSave={() => { setIsEditing(false); refreshDetail(); }}
      />
    );
  }

  const imgUrl = vehicle.photo_url || vehicle.image || vehicle.image_url || null;
  const displayName = vehicle.name || `${vehicle.make || ''} ${vehicle.model || ''}`.trim() || vehicle.reference_code || 'Vehicle';
  const plate = vehicle.plate || vehicle.plate_number || '—';
  const mileage = vehicle.current_odometer || vehicle.mileage || 0;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Top Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">ASSET PROFILE: {vehicle.reference_code || vehicle.fleetNo || (vehicleId ? vehicleId.slice(0, 8) : 'UNMATCHED')}</h2>
          </div>
          <div className="u-modal-header-actions">
            {vehicleId ? <button className="btn-primary" onClick={() => setIsEditing(true)}>EDIT VEHICLE</button> : null}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="u-modal-hero" style={{ flexShrink: 0 }}>
          <div className="u-modal-hero-top">
            <div className="u-modal-hero-avatar-container">
              {imgUrl ? (
                <img src={imgUrl} loading="eager" alt={displayName} className="u-modal-hero-avatar" />
              ) : (
                <div className="u-modal-hero-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#1A1A1A', color: 'var(--color-gold)', fontWeight: 'bold', fontSize: 28 }}>
                  {String(displayName).charAt(0).toUpperCase()}
                </div>
              )}
            </div>

            <div className="u-modal-hero-info">
              <h1 className="u-modal-hero-title">{displayName}</h1>
              <p className="u-modal-hero-subtitle">{plate}{vehicle.vin ? ` • VIN: ${vehicle.vin}` : ''}</p>
            </div>

            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="vp-fleet-badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', padding: '6px 12px', borderRadius: '4px', fontSize: '12px', fontWeight: 'bold', color: 'white', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Building2 size={12} /> {vehicle.ownership === 'Owner Vehicle' ? 'OWNER ASSET' : 'FLEET ASSET'}
              </div>
            </div>
          </div>

          <div className="u-modal-hero-persistent-info">
            <div className="u-modal-field">
              <span className="u-modal-label">CURRENT MILEAGE</span>
              <span className="u-modal-value-box">{Number(mileage).toLocaleString()} mi</span>
            </div>
            <div className="u-modal-field">
              <span className="u-modal-label">MOT EXPIRY</span>
              <span className="u-modal-value-box">{fmtDate(vehicle.mot_expiry || vehicle.motExpiry)}</span>
            </div>
            <div className="u-modal-field">
              <span className="u-modal-label" style={{ color: 'var(--color-gold)' }}>PHV/PCO EXPIRY</span>
              <span className="u-modal-value-box" style={{ borderColor: 'var(--color-gold)' }}>{fmtDate(vehicle.phv_expiry || vehicle.phvExpiry)}</span>
            </div>
            <div className="u-modal-field">
              <span className="u-modal-label">INSURANCE</span>
              <span className="u-modal-value-box">{fmtDate(vehicle.insurance_expiry || vehicle.insuranceExpiry)}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'mileage' ? 'active' : ''}`} onClick={() => setActiveTab('mileage')}>MILEAGE LOG</button>
          <button className={`u-modal-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>MAINTENANCE</button>
          <button className={`u-modal-tab ${activeTab === 'expenses' ? 'active' : ''}`} onClick={() => setActiveTab('expenses')}>EXPENSES</button>
          <button className={`u-modal-tab ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')}>FINANCIALS</button>
        </div>

        {/* Tab Content */}
        <div className="u-modal-body">
          {!vehicleId && (
            <div className="p-md" style={{ color: '#ff6b6b', fontSize: 12 }}>
              This vehicle could not be matched to a fleet record. Registration details only — no live history available.
            </div>
          )}
          {detailError && (
            <div className="p-md" style={{ color: '#ff6b6b', fontSize: 12 }}>
              Live vehicle data error: {detailError.message} — showing registration data only.
            </div>
          )}

          {activeTab === 'overview' && (
            <div className="vp-overview-panel">
              <div className="vp-section-title">REGISTRATION & SPECIFICATIONS</div>
              <div className="vp-specs-grid">
                <div className="vp-spec-item">
                  <div className="vp-spec-label">MAKE/MODEL</div>
                  <div className="vp-spec-value">{displayName}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">REGISTRATION</div>
                  <div className="vp-spec-value">{plate}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">EXTERIOR COLOR</div>
                  <div className="vp-spec-value">{vehicle.color || '—'}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">VEHICLE CLASS</div>
                  <div className="vp-spec-value">{vehicle.tier || '—'}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">PASSENGER CAPACITY</div>
                  <div className="vp-spec-value">{vehicle.passenger_capacity || '—'}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">BAGGAGE CAPACITY</div>
                  <div className="vp-spec-value">{vehicle.baggage_capacity || '—'}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">STATUS</div>
                  <div className="vp-spec-value">{vehicle.status || '—'}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">ROAD TAX EXPIRY</div>
                  <div className="vp-spec-value">{fmtDate(vehicle.road_tax_expiry)}</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mileage' && (
            <div>
              <div className="vp-mileage-toolbar">
                <div className="vp-search">
                  <User size={14} color="#888" />
                  <input
                    type="text"
                    placeholder="Search driver or event type..."
                    value={mileageSearch}
                    onChange={(e) => setMileageSearch(e.target.value)}
                  />
                </div>
              </div>
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>DATE/TIME</th>
                    <th>EVENT TYPE</th>
                    <th>DRIVER</th>
                    <th>DRIVER CODE</th>
                    <th>READING</th>
                    <th>DELTA (TRIP)</th>
                  </tr>
                </thead>
                <tbody>
                  {odometerRows.map((o) => (
                    <tr
                      key={o.id}
                      className="cc-card-row"
                      style={{ cursor: 'pointer' }}
                      onClick={() => openSummaryModal({
                        title: 'Odometer Log', subtitle: o.event_type, status: 'Logged', icon: 'gauge',
                        primaryMetric: { label: 'READING', value: `${Number(o.reading).toLocaleString()} mi` },
                        fields: [
                          { label: 'Date', value: fmtDateTime(o.logged_at) },
                          { label: 'Driver', value: o.driver_name || '—' },
                          { label: 'Event Type', value: o.event_type },
                        ],
                      })}
                    >
                      <td>{fmtDateTime(o.logged_at)}</td>
                      <td>{o.event_type}</td>
                      <td onClick={(e) => e.stopPropagation()}>
                        <div className="vp-driver-cell">
                          <div className="vp-avatar-tiny"><User size={10} color="#aaa" /></div>
                          <span>{o.driver_name || '—'}</span>
                        </div>
                      </td>
                      <td style={{ color: 'var(--color-gold)' }}>{o.driver_code || '—'}</td>
                      <td>{Number(o.reading).toLocaleString()}</td>
                      <td style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>
                        {o.delta !== null ? `${Number(o.delta).toLocaleString()} mi` : '—'}
                      </td>
                    </tr>
                  ))}
                  {vehicleId && odometerRows.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>
                      No odometer logs recorded for this vehicle yet.
                    </td></tr>
                  )}
                  {!vehicleId && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Unmatched vehicle record.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="vp-maint-header">
                <div className="vp-section-title" style={{ margin: 0 }}>MAINTENANCE HISTORY</div>
                {vehicleId && <button className="vp-btn-add" onClick={() => { setIssueModalOpen(true); setIssueForm({ issueDescription: '', severity: 'LOW' }); setIssueError(null); }}>+ Log New Issue</button>}
              </div>
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>ISSUE DESCRIPTION</th>
                    <th>SEVERITY</th>
                    <th>REPORTED DATE</th>
                    <th>REPORTED BY</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceLogs.map((log) => (
                    <tr key={log.id} className="cc-card-row">
                      <td
                        style={{ cursor: 'pointer', fontWeight: 'bold' }}
                        onClick={() => openSummaryModal({
                          title: 'Maintenance Issue', subtitle: log.issue_description, status: log.status, icon: 'shield',
                          primaryMetric: { label: 'RESOLUTION COST', value: log.resolution_amount ? gbp(log.resolution_amount) : '—' },
                          fields: [
                            { label: 'Reported', value: fmtDateTime(log.reported_date) },
                            { label: 'Reported By', value: log.reported_by_staff || log.reported_by_driver_code || 'Back Office' },
                            { label: 'Severity', value: log.severity },
                            { label: 'Resolution Notes', value: log.resolution_notes || '—' },
                          ],
                        })}
                      >
                        {log.issue_description}
                      </td>
                      <td>
                        <span
                          className="vp-badge-cat"
                          style={{ borderColor: '#555', color: log.severity === 'CRITICAL' || log.severity === 'HIGH' ? '#FF3B30' : '#888' }}
                        >
                          {log.severity}
                        </span>
                      </td>
                      <td style={{ color: '#aaa' }}>{fmtDateTime(log.reported_date)}</td>
                      <td>
                        <EntityLink type="Staff">{log.reported_by_staff || log.reported_by_driver_code || 'Back Office'}</EntityLink>
                      </td>
                      <td>
                        <span
                          className="vp-badge-cat"
                          style={{ borderColor: log.status === 'RESOLVED' ? '#30d158' : log.status === 'IN_PROGRESS' ? 'var(--color-gold)' : '#FF3B30', color: log.status === 'RESOLVED' ? '#30d158' : log.status === 'IN_PROGRESS' ? 'var(--color-gold)' : '#FF3B30' }}
                        >
                          {log.status}
                        </span>
                      </td>
                      <td>
                        {log.status !== 'RESOLVED' ? (
                          <button
                            className="vp-btn-action vp-btn-gold"
                            style={{ padding: '6px 12px', fontSize: '10px' }}
                            onClick={() => { setSelectedLogId(log.id); setResolutionAmount(''); setResolutionNotes(''); setIncludeVat(true); }}
                          >
                            ISSUE RESOLVED
                          </button>
                        ) : (
                          <span style={{ color: '#555', fontSize: '10px', fontWeight: 'bold' }}>RESOLVED {log.resolved_at ? fmtDate(log.resolved_at) : ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {vehicleId && maintenanceLogs.length === 0 && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>
                      No maintenance issues logged for this vehicle.
                    </td></tr>
                  )}
                  {!vehicleId && (
                    <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Unmatched vehicle record.</td></tr>
                  )}
                </tbody>
              </table>

              {selectedLogId && maintenanceLogs.find((l) => l.id === selectedLogId && l.status !== 'RESOLVED') && (
                <div className="u-modal-overlay" style={{ zIndex: 1100 }}>
                  <div className="u-modal-container" style={{ width: '800px', height: 'auto', minHeight: '400px' }}>
                    <div className="u-modal-header">
                      <h3 style={{ color: 'var(--color-gold)', margin: 0 }}>RESOLVE MAINTENANCE ISSUE</h3>
                      <button className="u-modal-btn-close" onClick={() => setSelectedLogId(null)}><X size={20} /></button>
                    </div>
                    <div className="u-modal-body" style={{ padding: '24px', display: 'flex', gap: '24px' }}>

                      <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <div className="wl-field-group">
                          <label className="wl-label" style={{ color: '#888', fontSize: '10px' }}>RESOLUTION DETAILS (FIX PERFORMED)</label>
                          <textarea
                            className="wl-input"
                            rows="3"
                            placeholder="e.g., Replaced front left tyre and aligned."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                          <div className="wl-field-group" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="wl-label" style={{ color: '#888', fontSize: '10px', marginBottom: '0' }}>INCLUDE VAT ({VAT_RATE * 100}%)</label>
                            <div className={`mock-toggle ${includeVat ? 'active' : ''}`} onClick={() => setIncludeVat(!includeVat)} style={{ cursor: 'pointer' }}>
                              <div className="toggle-knob"></div>
                            </div>
                          </div>
                          <div className="wl-field-group" style={{ flex: 1 }}>
                            <label className="wl-label" style={{ color: '#888', fontSize: '10px' }}>FINAL INVOICE AMOUNT</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 10, top: 10, color: '#888' }}>£</span>
                              <input
                                type="number"
                                className="wl-input"
                                placeholder="0.00"
                                value={resolutionAmount}
                                onChange={(e) => setResolutionAmount(e.target.value)}
                                style={{ width: '100%', paddingLeft: '24px', background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 8px 8px 24px', borderRadius: '4px' }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary Column */}
                      <div style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ color: 'var(--color-gold)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '24px' }}>FINANCIAL SUMMARY</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ color: '#888', fontSize: '12px' }}>Subtotal</span>
                            <span style={{ color: '#fff', fontSize: '12px' }}>{gbp(parseFloat(resolutionAmount || 0))}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            <span style={{ color: '#888', fontSize: '12px' }}>VAT ({VAT_RATE * 100}%)</span>
                            <span style={{ color: '#fff', fontSize: '12px' }}>{gbp(includeVat ? parseFloat(resolutionAmount || 0) * VAT_RATE : 0)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>TOTAL</span>
                            <span style={{ color: 'var(--color-gold)', fontSize: '18px', fontWeight: 'bold' }}>
                              {gbp(parseFloat(resolutionAmount || 0) + (includeVat ? parseFloat(resolutionAmount || 0) * VAT_RATE : 0))}
                            </span>
                          </div>
                        </div>

                        {resolveError && <div style={{ color: '#ff6b6b', fontSize: 12, marginBottom: 8 }}>{resolveError}</div>}
                        <button
                          className="vp-btn-action vp-btn-gold"
                          style={{ padding: '12px 24px', fontSize: '12px', width: '100%', marginTop: '24px' }}
                          disabled={resolveSaving}
                          onClick={async () => {
                            setResolveError(null);
                            setResolveSaving(true);
                            try {
                              await updateMaintenanceLog(vehicleId, selectedLogId, {
                                status: 'RESOLVED',
                                resolutionNotes: resolutionNotes || 'Resolved via Vehicle Profile',
                                resolutionAmount: parseFloat(resolutionAmount || 0),
                                resolutionVatInclusive: includeVat,
                              });
                              setSelectedLogId(null);
                              refreshDetail();
                            } catch (e) {
                              setResolveError(e.message || 'Failed to resolve issue.');
                            } finally {
                              setResolveSaving(false);
                            }
                          }}
                        >
                          {resolveSaving ? 'SAVING…' : 'CONFIRM RESOLUTION'}
                        </button>
                      </div>

                    </div>
                  </div>
                </div>
              )}

              {/* Log New Issue modal — persists via POST /api/fleet/vehicles/:id/maintenance */}
              {issueModalOpen && vehicleId && (
                <div className="u-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setIssueModalOpen(false)}>
                  <div className="u-modal-container" style={{ width: '520px', height: 'auto', minHeight: '320px' }} onClick={(e) => e.stopPropagation()}>
                    <div className="u-modal-header">
                      <h3 style={{ color: 'var(--color-gold)', margin: 0 }}>LOG NEW MAINTENANCE ISSUE</h3>
                      <button className="u-modal-btn-close" onClick={() => setIssueModalOpen(false)}><X size={20} /></button>
                    </div>
                    <div className="u-modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
                      <div className="wl-field-group">
                        <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>ISSUE DESCRIPTION</label>
                        <textarea
                          rows="3"
                          placeholder="e.g., Brake pad warning sensor triggered."
                          value={issueForm.issueDescription}
                          onChange={(e) => setIssueForm({ ...issueForm, issueDescription: e.target.value })}
                          style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                        />
                      </div>
                      <div className="wl-field-group">
                        <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>SEVERITY</label>
                        <select
                          value={issueForm.severity}
                          onChange={(e) => setIssueForm({ ...issueForm, severity: e.target.value })}
                          style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                        >
                          <option value="LOW">LOW</option>
                          <option value="MEDIUM">MEDIUM</option>
                          <option value="HIGH">HIGH</option>
                          <option value="CRITICAL">CRITICAL</option>
                        </select>
                      </div>
                      {issueError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{issueError}</div>}
                      <button
                        className="vp-btn-action vp-btn-gold"
                        style={{ padding: '12px 24px', fontSize: 12 }}
                        disabled={issueSaving}
                        onClick={async () => {
                          setIssueError(null);
                          if (!issueForm.issueDescription.trim()) {
                            setIssueError('Issue description is required.');
                            return;
                          }
                          setIssueSaving(true);
                          try {
                            await createMaintenanceLog(vehicleId, {
                              issueDescription: issueForm.issueDescription.trim(),
                              severity: issueForm.severity,
                            });
                            setIssueModalOpen(false);
                            refreshDetail();
                          } catch (e) {
                            setIssueError(e.message || 'Failed to log issue.');
                          } finally {
                            setIssueSaving(false);
                          }
                        }}
                      >
                        {issueSaving ? 'SAVING…' : 'LOG ISSUE'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'expenses' && (
            <div>
              <div className="vp-expense-summary">
                <div className="vp-expense-total-box">
                  <div className="vp-expense-total-label">YTD EXPENSE TOTAL</div>
                  <div className="vp-expense-total-val">{gbp(expenseSummary.total)}</div>
                </div>
                <div className="vp-expense-breakdown">
                  {Object.entries(expenseSummary.byCat).map(([cat, amt]) => (
                    <div className="vp-expense-item" key={cat}>
                      <div className="vp-expense-item-label">{cat}</div>
                      <div className="vp-expense-item-val">{gbp(amt)}</div>
                    </div>
                  ))}
                  {Object.keys(expenseSummary.byCat).length === 0 && (
                    <div className="vp-expense-item"><div className="vp-expense-item-label">NO YTD EXPENSES</div></div>
                  )}
                </div>
                {vehicleId && <button className="vp-btn-fab" onClick={() => setExpenseModalOpen(true)}><Plus size={24} /></button>}
              </div>

              <table className="vp-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>CATEGORY</th>
                    <th>DESCRIPTION</th>
                    <th>AMOUNT</th>
                    <th>RECEIPT</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((e) => (
                    <tr key={e.id} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                      title: 'Expense Receipt', subtitle: e.expense_type, status: 'Logged', icon: 'financial',
                      primaryMetric: { label: 'AMOUNT', value: gbp(e.amount) },
                      fields: [
                        { label: 'Date', value: fmtDateTime(e.logged_at) },
                        { label: 'Category', value: e.expense_type },
                        { label: 'Description', value: e.description || '—' },
                      ],
                    })}>
                      <td>{fmtDateTime(e.logged_at)}</td>
                      <td><span className="vp-badge-cat">{e.expense_type}</span></td>
                      <td>{e.description || '—'}</td>
                      <td style={{ fontWeight: 'bold' }}>{gbp(e.amount)}</td>
                      <td>
                        {e.receipt_url ? (
                          <a className="vp-receipt-btn" href={e.receipt_url} target="_blank" rel="noreferrer" onClick={(ev) => ev.stopPropagation()}>
                            <FileText size={14} />
                          </a>
                        ) : (
                          <span style={{ color: '#555', fontSize: 10 }}>—</span>
                        )}
                      </td>
                    </tr>
                  ))}
                  {vehicleId && expenses.length === 0 && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: 18 }}>
                      No expenses logged for this vehicle yet.
                    </td></tr>
                  )}
                  {!vehicleId && (
                    <tr><td colSpan={5} style={{ textAlign: 'center', color: '#888', padding: 18 }}>Unmatched vehicle record.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'financials' && (() => {
            const fin = detail || liveVehicle || {};
            const leaseStart = fin.lease_start_date ? new Date(fin.lease_start_date) : null;
            const leaseEnd = fin.lease_end_date ? new Date(fin.lease_end_date) : null;
            const totalCost = Number(fin.lease_total_cost || 0);
            const paidToDate = Number(fin.lease_paid_to_date || 0);
            const monthly = Number(fin.monthly_finance_cost_pence || 0) / 100;

            let progressPercent = totalCost > 0 ? Math.min(100, (paidToDate / totalCost) * 100) : 0;
            let remainingText = 'No lease recorded for this vehicle';
            let timelineStart = '—';
            let timelineEnd = '—';
            let currentYearText = '—';

            if (leaseStart && leaseEnd && !Number.isNaN(leaseStart.getTime()) && !Number.isNaN(leaseEnd.getTime())) {
              const today = new Date();
              const totalMonths = Math.max(0, Math.round((leaseEnd - leaseStart) / (1000 * 60 * 60 * 24 * 30.44)));
              if (today >= leaseEnd) {
                progressPercent = 100;
                remainingText = `0 of ${totalMonths} Months Remaining`;
              } else if (today <= leaseStart) {
                progressPercent = 0;
                remainingText = `${totalMonths} of ${totalMonths} Months Remaining`;
              } else {
                progressPercent = Math.min(100, Math.max(0, Math.round(((today - leaseStart) / (leaseEnd - leaseStart)) * 100)));
                const monthsElapsed = Math.round(((today - leaseStart) / (1000 * 60 * 60 * 24 * 30.44)));
                remainingText = `${Math.max(0, totalMonths - monthsElapsed)} of ${totalMonths} Months Remaining`;
              }
              const formatOptions = { month: 'short', year: 'numeric' };
              timelineStart = leaseStart.toLocaleDateString('en-GB', formatOptions).toUpperCase();
              timelineEnd = leaseEnd.toLocaleDateString('en-GB', formatOptions).toUpperCase();
              const currentYear = Math.floor((today - leaseStart) / (1000 * 60 * 60 * 24 * 365)) + 1;
              const totalYears = Math.max(1, Math.ceil((leaseEnd - leaseStart) / (1000 * 60 * 60 * 24 * 365)));
              currentYearText = `Year ${currentYear} of ${totalYears}`;
            }

            return (
              <div className="vp-fin-grid">
                <div className="vp-fin-card" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--color-gold) ${progressPercent}%, #333 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px' }}>
                    <div style={{ width: '90px', height: '90px', backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ color: 'var(--color-gold)', fontSize: '24px', fontWeight: 'bold' }}>{Math.round(progressPercent)}%</span>
                      <span style={{ color: '#888', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>AMORTIZED</span>
                    </div>
                  </div>
                  <div style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>LEASE PROGRESS</div>
                  <div style={{ color: '#aaa', fontSize: '11px' }}>{remainingText}</div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                  <div style={{ display: 'flex', gap: '24px' }}>
                    <div className="vp-fin-card" style={{ flex: 1 }}>
                      <div className="vp-fin-label">MONTHLY FINANCE</div>
                      <div className="vp-fin-val">{monthly > 0 ? gbp(monthly) : '—'}</div>
                      <div className="vp-fin-sub">Per lease agreement</div>
                    </div>
                    <div className="vp-fin-card" style={{ flex: 1 }}>
                      <div className="vp-fin-label">PAID TO DATE</div>
                      <div className="vp-fin-val">{gbp(paidToDate)}</div>
                      <div className="vp-fin-sub muted">Total lease cost: {totalCost > 0 ? gbp(totalCost) : '—'}</div>
                    </div>
                  </div>
                  <div className="vp-fin-card">
                    <div className="vp-fin-label" style={{ display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold' }}>
                      AMORTIZATION TIMELINE <span>{currentYearText}</span>
                    </div>
                    <div className="vp-amort-timeline">
                      <div className="vp-amort-bar-bg">
                        <div className="vp-amort-bar-fill" style={{ width: `${progressPercent}%` }}></div>
                      </div>
                      <div className="vp-amort-labels">
                        <span>{timelineStart}</span>
                        <span>{timelineEnd}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Persistent Footer */}
        <div className="u-modal-footer">
          <div className="u-modal-footer-badge">
            <ShieldCheck size={14} color="var(--color-gold)" /> VERIFIED BY VELO AI SECURITY PROTOCOL
          </div>
        </div>

      </div>

      {/* Add Expense Modal — persists via POST /api/fleet/vehicles/:id/expenses */}
      {expenseModalOpen && vehicleId && (
        <div className="u-modal-overlay" style={{ zIndex: 1100 }} onClick={() => setExpenseModalOpen(false)}>
          <div className="u-modal-container" style={{ width: '520px', height: 'auto', minHeight: '360px' }} onClick={(e) => e.stopPropagation()}>
            <div className="u-modal-header">
              <h3 style={{ color: 'var(--color-gold)', margin: 0 }}>LOG VEHICLE EXPENSE</h3>
              <button className="u-modal-btn-close" onClick={() => setExpenseModalOpen(false)}><X size={20} /></button>
            </div>
            <div className="u-modal-body" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>CATEGORY</label>
                <select
                  value={expenseForm.expenseType}
                  onChange={(e) => setExpenseForm({ ...expenseForm, expenseType: e.target.value })}
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                >
                  <option value="FUEL">FUEL</option>
                  <option value="CARWASH">CARWASH / VALET</option>
                  <option value="SERVICE">SERVICE / REPAIR</option>
                  <option value="CUSTOM">CUSTOM</option>
                </select>
              </div>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>AMOUNT (£)</label>
                <input
                  type="number"
                  step="0.01"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}
                  placeholder="0.00"
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                />
              </div>
              <div className="wl-field-group">
                <label className="wl-label" style={{ color: '#888', fontSize: 10 }}>DESCRIPTION</label>
                <textarea
                  rows="2"
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}
                  style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: 8, borderRadius: 4, width: '100%' }}
                />
              </div>
              {expenseError && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{expenseError}</div>}
              <button
                className="vp-btn-action vp-btn-gold"
                style={{ padding: '12px 24px', fontSize: 12 }}
                disabled={expenseSaving}
                onClick={async () => {
                  setExpenseError(null);
                  if (!expenseForm.amount || Number(expenseForm.amount) <= 0) {
                    setExpenseError('Amount must be greater than zero.');
                    return;
                  }
                  setExpenseSaving(true);
                  try {
                    await addFleetExpense(vehicleId, {
                      expenseType: expenseForm.expenseType,
                      amount: Number(expenseForm.amount),
                      description: expenseForm.description,
                    });
                    setExpenseModalOpen(false);
                    setExpenseForm({ expenseType: 'FUEL', amount: '', description: '' });
                    refreshDetail();
                  } catch (e) {
                    setExpenseError(e.message || 'Failed to log expense.');
                  } finally {
                    setExpenseSaving(false);
                  }
                }}
              >
                {expenseSaving ? 'SAVING…' : 'LOG EXPENSE'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default VehicleProfileModal;
