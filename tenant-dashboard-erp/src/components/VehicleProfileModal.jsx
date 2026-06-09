import React, { useState, useEffect } from 'react';
import { X, Building2, Calendar, Search, FileText, Plus, ShieldCheck, PieChart, User } from 'lucide-react';
import './VehicleProfileModal.css';
import './UniversalModal.css';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';
import { MOCK_GLOBAL_SETTINGS } from '../data/mockDatabase';
import AddVehicleModal from './modals/AddVehicleModal';

const INITIAL_LOGS = [
  { id: 1, title: 'Brake Pad Warning', date: '14 OCT 2023', status: 'ACTIVE', desc: 'Front sensor indicating wear limit reached.', reportedBy: 'Julian R.', shop: 'Velo Approved Centre - Battersea', cost: '£420.00' },
  { id: 2, title: 'Annual Service A', date: '01 NOV 2023', status: 'SCHEDULED', desc: 'Scheduled at Mercedes-Benz London.', reportedBy: 'System Auto-Schedule', shop: 'Mercedes-Benz London', cost: '£850.00' },
  { id: 3, title: 'Tyre Replacement', date: '22 SEP 2023', status: 'RESOLVED', desc: 'Rear left puncture. Replaced with Michelin PS4.', reportedBy: 'Sarah W.', shop: 'Kwik Fit Mobile', cost: '£285.00' }
];

const VehicleProfileModal = ({ vehicle, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceLogs, setMaintenanceLogs] = useState(INITIAL_LOGS);
  const [selectedLogId, setSelectedLogId] = useState(null);
  const [resolutionAmount, setResolutionAmount] = useState('');
  const [includeVat, setIncludeVat] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [liveVehicle, setLiveVehicle] = useState(vehicle);
  const { openSummaryModal } = useEntityLinker();

  // Update liveVehicle if parent prop changes
  useEffect(() => {
    setLiveVehicle(vehicle);
  }, [vehicle]);

  if (!vehicle) return null;

  if (isEditing) {
    return (
      <AddVehicleModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        data={liveVehicle} 
        isEditMode={true} 
        onSave={(updatedData) => {
          setLiveVehicle((prev) => ({
            ...prev,
            ...updatedData,
            financials: updatedData.financials
          }));
        }}
      />
    );
  }

  const imgUrl = vehicle.image || vehicle.primary_image_url || vehicle.image_url || 'https://images.unsplash.com/photo-1563720225384-9c0560e0a14f?w=400&q=80';

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Top Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">ASSET PROFILE: {vehicle.fleetNo || vehicle.id}</h2>
          </div>
          <div className="u-modal-header-actions">
            <button className="btn-primary" onClick={() => setIsEditing(true)}>EDIT VEHICLE</button>
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="u-modal-hero" style={{ flexShrink: 0 }}>
          <div className="u-modal-hero-top">
            <div className="u-modal-hero-avatar-container">
              {(() => {
                const workingImages = [
                  'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
                  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
                  'https://images.unsplash.com/photo-1542282088-fe8426682b8f'
                ];
                // Pick a deterministic image based on fleet number or ID string
                const charCode = vehicle.fleetNo ? vehicle.fleetNo.charCodeAt(vehicle.fleetNo.length - 1) : vehicle.id.charCodeAt(vehicle.id.length - 1);
                let imgUrl = workingImages[charCode % 3];
                return (
                  <img 
                    src={imgUrl} 
                    loading="eager"
                    alt={vehicle.name} 
                    className="u-modal-hero-avatar" 
                  />
                );
              })()}
            </div>
            
            <div className="u-modal-hero-info">
              <h1 className="u-modal-hero-title">{vehicle.name}</h1>
              <p className="u-modal-hero-subtitle">{vehicle.plate} • VIN: {vehicle.vin || 'VLO-7492-XJ9'}</p>
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
              <span className="u-modal-value-box">{vehicle.mileage}</span>
            </div>
            <div className="u-modal-field">
              <span className="u-modal-label">MOT EXPIRY</span>
              <span className="u-modal-value-box">{vehicle.motExpiry || '14 Nov 2024'}</span>
            </div>
            <div className="u-modal-field">
              <span className="u-modal-label" style={{color: 'var(--color-gold)'}}>TAX EXPIRY</span>
              <span className="u-modal-value-box" style={{borderColor: 'var(--color-gold)'}}>01 Jan 2025</span>
            </div>
            <div className="u-modal-field">
              <span className="u-modal-label">INSURANCE</span>
              <span className="u-modal-value-box">{vehicle.insuranceExpiry || '22 Mar 2025'}</span>
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
          {activeTab === 'overview' && (
            <div className="vp-overview-panel">
              <div className="vp-section-title">REGISTRATION & SPECIFICATIONS</div>
              <div className="vp-specs-grid">
                <div className="vp-spec-item">
                  <div className="vp-spec-label">MAKE/MODEL</div>
                  <div className="vp-spec-value">{vehicle.name}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">REGISTRATION</div>
                  <div className="vp-spec-value">{vehicle.plate}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">EXTERIOR COLOR</div>
                  <div className="vp-spec-value">{vehicle.color || 'Obsidian Black Metallic'}</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">FUEL TYPE</div>
                  <div className="vp-spec-value">Petrol Plug-in Hybrid</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">PASSENGER CAPACITY</div>
                  <div className="vp-spec-value">4 Persons (Exec Rear)</div>
                </div>
                <div className="vp-spec-item">
                  <div className="vp-spec-label">LUGGAGE CAPACITY</div>
                  <div className="vp-spec-value">3 Large Cases</div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'mileage' && (
            <div>
              <div className="vp-mileage-toolbar">
                <div className="vp-search">
                  <Search size={14} color="#888" />
                  <input type="text" placeholder="Search driver or shift..." />
                </div>
                <div className="vp-date-picker">
                  dd/mm/yyyy <Calendar size={14} color="#888" />
                </div>
                <button className="vp-btn-filter">FILTER</button>
              </div>
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>DATE/TIME</th>
                    <th>SHIFT DESCRIPTION</th>
                    <th>DRIVER</th>
                    <th>VEO ID</th>
                    <th>START</th>
                    <th>END</th>
                    <th>TOTAL</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                    title: 'Mileage Log', subtitle: 'Airport Transfer', status: 'Completed', icon: 'file',
                    primaryMetric: { label: 'TOTAL MILES', value: '160 mi' },
                    fields: [{label: 'Date', value: '12 Oct 23'}, {label: 'Driver', value: 'Julian R.'}, {label: 'Start', value: '42,340'}, {label: 'End', value: '42,500'}]
                  })}>
                    <td>12 Oct 23<br/><span style={{color: '#888', fontSize: '10px'}}>14:32</span></td>
                    <td>Airport Transfer LHR-T5</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="vp-driver-cell">
                        <div className="vp-avatar-tiny"><User size={10} color="#aaa" /></div>
                        <EntityLink type="Driver">Julian R.</EntityLink>
                      </div>
                    </td>
                    <td style={{color: 'var(--color-gold)'}}>VEO-882</td>
                    <td>42,340</td>
                    <td>42,500</td>
                    <td style={{color: 'var(--color-gold)', fontWeight: 'bold'}}>160 mi</td>
                  </tr>
                  <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                    title: 'Mileage Log', subtitle: 'Full Day Hire', status: 'Completed', icon: 'file',
                    primaryMetric: { label: 'TOTAL MILES', value: '220 mi' },
                    fields: [{label: 'Date', value: '11 Oct 23'}, {label: 'Driver', value: 'Sarah W.'}, {label: 'Start', value: '42,120'}, {label: 'End', value: '42,340'}]
                  })}>
                    <td>11 Oct 23<br/><span style={{color: '#888', fontSize: '10px'}}>08:15</span></td>
                    <td>Full Day Executive Hire</td>
                    <td onClick={e => e.stopPropagation()}>
                      <div className="vp-driver-cell">
                        <div className="vp-avatar-tiny"><User size={10} color="#aaa" /></div>
                        <EntityLink type="Driver">Sarah W.</EntityLink>
                      </div>
                    </td>
                    <td style={{color: 'var(--color-gold)'}}>VEO-421</td>
                    <td>42,120</td>
                    <td>42,340</td>
                    <td style={{color: 'var(--color-gold)', fontWeight: 'bold'}}>220 mi</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div className="vp-maint-header">
                <div className="vp-section-title" style={{margin: 0}}>MAINTENANCE HISTORY</div>
                <button className="vp-btn-add">+ Log New Issue</button>
              </div>
              <table className="vp-table">
                <thead>
                  <tr>
                    <th>ISSUE DESCRIPTION</th>
                    <th>REPORTED DATE</th>
                    <th>REPORTED BY</th>
                    <th>STATUS</th>
                    <th>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {maintenanceLogs.map(log => (
                    <tr key={log.id} className="cc-card-row">
                      <td 
                        style={{ cursor: 'pointer', fontWeight: 'bold' }} 
                        onClick={() => openSummaryModal({
                          title: 'Maintenance Issue', subtitle: log.title, status: log.status, icon: 'shield',
                          primaryMetric: { label: 'EST COST', value: log.cost },
                          fields: [
                            {label: 'Date', value: log.date}, 
                            {label: 'Reported By', value: log.reportedBy},
                            {label: 'Description', value: log.desc},
                            {label: 'Shop', value: log.shop}
                          ]
                        })}
                      >
                        {log.title}
                      </td>
                      <td style={{ color: '#aaa' }}>{log.date}</td>
                      <td>
                        <EntityLink type="Staff">{log.reportedBy}</EntityLink>
                      </td>
                      <td>
                        <span className={`vp-badge-cat ${log.status.toLowerCase() === 'active' ? 'fuel' : log.status.toLowerCase() === 'scheduled' ? 'valet' : ''}`} style={{ borderColor: log.status === 'ACTIVE' ? '#FF3B30' : log.status === 'SCHEDULED' ? 'var(--color-gold)' : '#555', color: log.status === 'ACTIVE' ? '#FF3B30' : log.status === 'SCHEDULED' ? 'var(--color-gold)' : '#888' }}>
                          {log.status}
                        </span>
                      </td>
                      <td>
                        {log.status !== 'RESOLVED' ? (
                          <button 
                            className="vp-btn-action vp-btn-gold" 
                            style={{ padding: '6px 12px', fontSize: '10px' }}
                            onClick={() => {
                              setSelectedLogId(log.id);
                              setResolutionAmount('');
                              setIncludeVat(true);
                            }}
                          >
                            ISSUE RESOLVED
                          </button>
                        ) : (
                          <span style={{ color: '#555', fontSize: '10px', fontWeight: 'bold' }}>RESOLVED</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {selectedLogId && maintenanceLogs.find(l => l.id === selectedLogId)?.status !== 'RESOLVED' && (
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
                          <textarea className="wl-input" rows="3" placeholder="e.g., Replaced front left tyre and aligned." style={{ background: '#111', color: '#fff', border: '1px solid #333', padding: '8px', borderRadius: '4px' }}></textarea>
                        </div>
                        
                        <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
                          <div className="wl-field-group" style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <label className="wl-label" style={{ color: '#888', fontSize: '10px', marginBottom: '0' }}>INCLUDE VAT ({MOCK_GLOBAL_SETTINGS.VAT_RATE * 100}%)</label>
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
                                onChange={e => setResolutionAmount(e.target.value)}
                                style={{ width: '100%', paddingLeft: '24px', background: '#111', color: '#fff', border: '1px solid #333', padding: '8px 8px 8px 24px', borderRadius: '4px' }} 
                              />
                            </div>
                          </div>
                        </div>

                        <div className="wl-field-group" style={{ marginTop: '8px' }}>
                          <label className="wl-label" style={{ color: '#888', fontSize: '10px' }}>UPLOAD RECEIPT</label>
                          <div style={{ border: '1px dashed #444', borderRadius: '4px', padding: '24px', textAlign: 'center', color: '#888', background: '#111', cursor: 'pointer' }}>
                            <FileText size={24} style={{ marginBottom: '8px' }} />
                            <div style={{ fontSize: '12px' }}>Drag and drop receipt image or PDF here</div>
                          </div>
                        </div>
                      </div>

                      {/* Financial Summary Column */}
                      <div style={{ flex: 1, backgroundColor: '#1A1A1A', borderRadius: '8px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ color: 'var(--color-gold)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', marginBottom: '24px' }}>FINANCIAL SUMMARY</div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                            <span style={{ color: '#888', fontSize: '12px' }}>Subtotal</span>
                            <span style={{ color: '#fff', fontSize: '12px' }}>£{parseFloat(resolutionAmount || 0).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
                            <span style={{ color: '#888', fontSize: '12px' }}>VAT ({MOCK_GLOBAL_SETTINGS.VAT_RATE * 100}%)</span>
                            <span style={{ color: '#fff', fontSize: '12px' }}>£{(includeVat ? parseFloat(resolutionAmount || 0) * MOCK_GLOBAL_SETTINGS.VAT_RATE : 0).toFixed(2)}</span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <span style={{ color: '#fff', fontSize: '14px', fontWeight: 'bold' }}>TOTAL</span>
                            <span style={{ color: 'var(--color-gold)', fontSize: '18px', fontWeight: 'bold' }}>£{(parseFloat(resolutionAmount || 0) + (includeVat ? parseFloat(resolutionAmount || 0) * MOCK_GLOBAL_SETTINGS.VAT_RATE : 0)).toFixed(2)}</span>
                          </div>
                        </div>

                        <button 
                          className="vp-btn-action vp-btn-gold" 
                          style={{ padding: '12px 24px', fontSize: '12px', width: '100%', marginTop: '24px' }}
                          onClick={() => {
                            // Mock logging the transaction with VAT fields
                            console.log('Resolving Maintenance with payload:', {
                              id: selectedLogId,
                              subtotal: parseFloat(resolutionAmount || 0),
                              vat_applied: includeVat,
                              vat_rate: MOCK_GLOBAL_SETTINGS.VAT_RATE,
                              total: parseFloat(resolutionAmount || 0) + (includeVat ? parseFloat(resolutionAmount || 0) * MOCK_GLOBAL_SETTINGS.VAT_RATE : 0)
                            });
                            setMaintenanceLogs(logs => logs.map(l => l.id === selectedLogId ? { ...l, status: 'RESOLVED' } : l));
                            setSelectedLogId(null);
                          }}
                        >
                          CONFIRM RESOLUTION
                        </button>
                      </div>

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
                  <div className="vp-expense-total-val">£12,450</div>
                </div>
                <div className="vp-expense-breakdown">
                  <div className="vp-expense-item">
                    <div className="vp-expense-item-label">FUEL</div>
                    <div className="vp-expense-item-val">£4.2k</div>
                  </div>
                  <div className="vp-expense-item">
                    <div className="vp-expense-item-label">REPAIRS</div>
                    <div className="vp-expense-item-val">£6.8k</div>
                  </div>
                  <div className="vp-expense-item">
                    <div className="vp-expense-item-label">VALETING</div>
                    <div className="vp-expense-item-val">£1.4k</div>
                  </div>
                </div>
                <button className="vp-btn-fab"><Plus size={24} /></button>
              </div>

              <table className="vp-table">
                <thead>
                  <tr>
                    <th>DATE</th>
                    <th>CATEGORY</th>
                    <th>LOGGED BY</th>
                    <th>AMOUNT</th>
                    <th>RECEIPT</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                    title: 'Expense Receipt', subtitle: 'FUEL', status: 'Logged', icon: 'financial',
                    primaryMetric: { label: 'AMOUNT', value: '£85.40' },
                    fields: [{label: 'Date', value: '12 Oct 2023'}, {label: 'Category', value: 'FUEL'}, {label: 'Logged By', value: 'Julian R. (VEO-882)'}]
                  })}>
                    <td>12 Oct 2023</td>
                    <td><span className="vp-badge-cat fuel">FUEL</span></td>
                    <td onClick={e => e.stopPropagation()}><EntityLink type="Driver">Julian R.</EntityLink> (VEO-882)</td>
                    <td style={{fontWeight: 'bold'}}>£85.40</td>
                    <td><button className="vp-receipt-btn"><FileText size={14} /></button></td>
                  </tr>
                  <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                    title: 'Expense Receipt', subtitle: 'VALETING', status: 'Logged', icon: 'financial',
                    primaryMetric: { label: 'AMOUNT', value: '£45.00' },
                    fields: [{label: 'Date', value: '10 Oct 2023'}, {label: 'Category', value: 'VALETING'}, {label: 'Logged By', value: 'System'}]
                  })}>
                    <td>10 Oct 2023</td>
                    <td><span className="vp-badge-cat valet">VALETING</span></td>
                    <td>System (Velo Valet)</td>
                    <td style={{fontWeight: 'bold'}}>£45.00</td>
                    <td><button className="vp-receipt-btn"><FileText size={14} /></button></td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'financials' && (() => {
            const financials = liveVehicle.financials || {};
            const monthlyInst = financials.monthlyInstallment ? parseFloat(financials.monthlyInstallment) : 1850.00;
            const outstanding = financials.outstandingBalance ? parseFloat(financials.outstandingBalance) : 44200.00;
            const valuation = financials.assetValuation ? parseFloat(financials.assetValuation) : 82000.00;
            
            // Calculate Lease Progress
            let progressPercent = 68;
            let remainingText = "28 of 36 Months Remaining";
            let timelineStart = "JAN 2022";
            let timelineEnd = "DEC 2025";
            let currentYearText = "Year 2 of 4";

            if (financials.leaseStartDate && financials.leaseEndDate && financials.totalLeaseTerm) {
              const start = new Date(financials.leaseStartDate);
              const end = new Date(financials.leaseEndDate);
              const today = new Date();
              const term = parseInt(financials.totalLeaseTerm, 10) || 36;
              
              if (today >= end) {
                progressPercent = 100;
                remainingText = `0 of ${term} Months Remaining`;
              } else if (today <= start) {
                progressPercent = 0;
                remainingText = `${term} of ${term} Months Remaining`;
              } else {
                const totalDuration = end - start;
                const elapsed = today - start;
                progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / totalDuration) * 100)));
                
                const monthsElapsed = Math.round((elapsed / (1000 * 60 * 60 * 24 * 30.44)));
                const remainingMonths = Math.max(0, term - monthsElapsed);
                remainingText = `${remainingMonths} of ${term} Months Remaining`;
              }

              const formatOptions = { month: 'short', year: 'numeric' };
              timelineStart = start.toLocaleDateString('en-GB', formatOptions).toUpperCase();
              timelineEnd = end.toLocaleDateString('en-GB', formatOptions).toUpperCase();
              
              const currentYear = Math.floor((today - start) / (1000 * 60 * 60 * 24 * 365)) + 1;
              const totalYears = Math.ceil(term / 12);
              currentYearText = `Year ${currentYear} of ${totalYears}`;
            }

            const formatCurrency = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);

            return (
              <div className="vp-fin-grid">
                <div className="vp-fin-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                  <div style={{position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: `conic-gradient(var(--color-gold) ${progressPercent}%, #333 0)`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                    <div style={{width: '90px', height: '90px', backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                      <span style={{color: 'var(--color-gold)', fontSize: '24px', fontWeight: 'bold'}}>{progressPercent}%</span>
                      <span style={{color: '#888', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px'}}>AMORTIZED</span>
                    </div>
                  </div>
                  <div style={{color: '#fff', fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px'}}>LEASE PROGRESS</div>
                  <div style={{color: '#aaa', fontSize: '11px'}}>{remainingText}</div>
                </div>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                  <div style={{display: 'flex', gap: '24px'}}>
                    <div className="vp-fin-card" style={{flex: 1}}>
                      <div className="vp-fin-label">MONTHLY INSTALLMENT</div>
                      <div className="vp-fin-val">{formatCurrency(monthlyInst)}</div>
                      <div className="vp-fin-sub">NEXT: 01 NOV 2023</div>
                    </div>
                    <div className="vp-fin-card" style={{flex: 1}}>
                      <div className="vp-fin-label">OUTSTANDING BALANCE</div>
                      <div className="vp-fin-val">{formatCurrency(outstanding)}</div>
                      <div className="vp-fin-sub muted">Asset Valuation: {formatCurrency(valuation)}</div>
                    </div>
                  </div>
                  <div className="vp-fin-card">
                    <div className="vp-fin-label" style={{display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold'}}>
                      AMORTIZATION TIMELINE <span>{currentYearText}</span>
                    </div>
                    <div className="vp-amort-timeline">
                      <div className="vp-amort-bar-bg">
                        <div className="vp-amort-bar-fill" style={{width: `${progressPercent}%`}}></div>
                      </div>
                      <div className="vp-amort-labels">
                        <span>{timelineStart}</span>
                        <span>{timelineEnd}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{marginTop: 'auto', display: 'flex', justifyContent: 'flex-end'}}>
                    <button className="vp-btn-action vp-btn-dark" style={{color: 'var(--color-gold)', borderColor: 'rgba(212, 175, 55, 0.3)'}}>
                      ↓ GENERATE FULL ASSET REPORT
                    </button>
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
    </div>
  );
};

export default VehicleProfileModal;
