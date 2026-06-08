import React, { useState } from 'react';
import { X, Building2, Calendar, Search, FileText, Plus, ShieldCheck, PieChart, User } from 'lucide-react';
import './VehicleProfileModal.css';
import './UniversalModal.css';

const INITIAL_LOGS = [
  { id: 1, title: 'Brake Pad Warning', date: '14 OCT 2023', status: 'ACTIVE', desc: 'Front sensor indicating wear limit reached.', reportedBy: 'Julian R.', shop: 'Velo Approved Centre - Battersea', cost: '£420.00' },
  { id: 2, title: 'Annual Service A', date: '01 NOV 2023', status: 'SCHEDULED', desc: 'Scheduled at Mercedes-Benz London.', reportedBy: 'System Auto-Schedule', shop: 'Mercedes-Benz London', cost: '£850.00' },
  { id: 3, title: 'Tyre Replacement', date: '22 SEP 2023', status: 'RESOLVED', desc: 'Rear left puncture. Replaced with Michelin PS4.', reportedBy: 'Sarah W.', shop: 'Kwik Fit Mobile', cost: '£285.00' }
];

const VehicleProfileModal = ({ vehicle, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [maintenanceLogs, setMaintenanceLogs] = useState(INITIAL_LOGS);
  const [selectedLogId, setSelectedLogId] = useState(1);

  if (!vehicle) return null;

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
            <button className="u-modal-btn-edit">EDIT VEHICLE</button>
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
                  <tr>
                    <td>12 Oct 23<br/><span style={{color: '#888', fontSize: '10px'}}>14:32</span></td>
                    <td>Airport Transfer LHR-T5</td>
                    <td>
                      <div className="vp-driver-cell">
                        <div className="vp-avatar-tiny"><User size={10} color="#aaa" /></div>
                        Julian R.
                      </div>
                    </td>
                    <td style={{color: 'var(--color-gold)'}}>VEO-882</td>
                    <td>42,340</td>
                    <td>42,500</td>
                    <td style={{color: 'var(--color-gold)', fontWeight: 'bold'}}>160 mi</td>
                  </tr>
                  <tr>
                    <td>11 Oct 23<br/><span style={{color: '#888', fontSize: '10px'}}>08:15</span></td>
                    <td>Full Day Executive Hire</td>
                    <td>
                      <div className="vp-driver-cell">
                        <div className="vp-avatar-tiny"><User size={10} color="#aaa" /></div>
                        Sarah W.
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
            <div className="vp-maint-grid">
              <div>
                <div className="vp-maint-header">
                  <div className="vp-section-title" style={{margin: 0}}>MAINTENANCE HISTORY</div>
                  <button className="vp-btn-add">+ Add Maintenance Log</button>
                </div>
                <div className="vp-maint-list">
                  {['ACTIVE', 'SCHEDULED', 'RESOLVED'].map(statusGroup => {
                    const groupLogs = maintenanceLogs.filter(l => l.status === statusGroup);
                    if (groupLogs.length === 0) return null;
                    return (
                      <div key={statusGroup}>
                        <div className="vp-maint-group-title">{statusGroup === 'ACTIVE' ? 'ACTIVE ISSUES' : statusGroup}</div>
                        {groupLogs.map(log => (
                          <div 
                            key={log.id} 
                            className={`vp-maint-card ${log.status.toLowerCase()} ${selectedLogId === log.id ? 'selected' : ''}`}
                            onClick={() => setSelectedLogId(log.id)}
                            style={{ cursor: 'pointer', border: selectedLogId === log.id ? '1px solid var(--color-gold)' : '' }}
                          >
                            <div className="vp-maint-card-top">
                              <div className="vp-maint-card-title">{log.title}</div>
                              <div className="vp-maint-card-date">{log.date}</div>
                            </div>
                            <div className="vp-maint-card-desc">{log.desc}</div>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="vp-maint-detail-panel">
                {(() => {
                  const log = maintenanceLogs.find(l => l.id === selectedLogId);
                  if (!log) return null;
                  return (
                    <>
                      <div className="vp-maint-detail-title">MAINTENANCE DETAIL</div>
                      <div className="vp-detail-row">
                        <div className="vp-detail-label">REPORTED BY</div>
                        <div className="vp-detail-val">
                          {log.reportedBy} 
                          <div className="vp-avatar-tiny" style={{marginLeft: '8px'}}><User size={10} color="#aaa" /></div>
                        </div>
                      </div>
                      <div className="vp-detail-row">
                        <div className="vp-detail-label">REPAIR SHOP</div>
                        <div className="vp-detail-val">{log.shop}</div>
                      </div>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px'}}>
                        <div className="vp-detail-row">
                          <div className="vp-detail-label">EST. COST</div>
                          <div className="vp-detail-val" style={{color: 'var(--color-gold)', fontSize: '18px', fontWeight: 'bold'}}>{log.cost}</div>
                        </div>
                        <div className="vp-detail-row" style={{textAlign: 'right'}}>
                          <div className="vp-detail-label">INVOICE</div>
                          <div className="vp-detail-val" style={{justifyContent: 'flex-end', color: 'var(--color-gold)'}}><FileText size={16} /></div>
                        </div>
                      </div>
                      <div className="vp-maint-detail-actions">
                        {log.status !== 'RESOLVED' && (
                          <button 
                            className="vp-btn-action vp-btn-gold"
                            onClick={() => setMaintenanceLogs(logs => logs.map(l => l.id === log.id ? { ...l, status: 'RESOLVED' } : l))}
                          >
                            MARK AS RESOLVED
                          </button>
                        )}
                      </div>
                    </>
                  );
                })()}
              </div>
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
                  <tr>
                    <td>12 Oct 2023</td>
                    <td><span className="vp-badge-cat fuel">FUEL</span></td>
                    <td>Julian R. (VEO-882)</td>
                    <td style={{fontWeight: 'bold'}}>£85.40</td>
                    <td><button className="vp-receipt-btn"><FileText size={14} /></button></td>
                  </tr>
                  <tr>
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

          {activeTab === 'financials' && (
            <div className="vp-fin-grid">
              <div className="vp-fin-card" style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                <div style={{position: 'relative', width: '120px', height: '120px', borderRadius: '50%', background: 'conic-gradient(var(--color-gold) 68%, #333 0)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '24px'}}>
                  <div style={{width: '90px', height: '90px', backgroundColor: '#1A1A1A', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
                    <span style={{color: 'var(--color-gold)', fontSize: '24px', fontWeight: 'bold'}}>68%</span>
                    <span style={{color: '#888', fontSize: '8px', textTransform: 'uppercase', letterSpacing: '1px'}}>AMORTIZED</span>
                  </div>
                </div>
                <div style={{color: '#fff', fontSize: '14px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px'}}>LEASE PROGRESS</div>
                <div style={{color: '#aaa', fontSize: '11px'}}>28 of 36 Months Remaining</div>
              </div>
              
              <div style={{display: 'flex', flexDirection: 'column', gap: '24px'}}>
                <div style={{display: 'flex', gap: '24px'}}>
                  <div className="vp-fin-card" style={{flex: 1}}>
                    <div className="vp-fin-label">MONTHLY INSTALLMENT</div>
                    <div className="vp-fin-val">£1,850.00</div>
                    <div className="vp-fin-sub">NEXT: 01 NOV 2023</div>
                  </div>
                  <div className="vp-fin-card" style={{flex: 1}}>
                    <div className="vp-fin-label">OUTSTANDING BALANCE</div>
                    <div className="vp-fin-val">£44,200.00</div>
                    <div className="vp-fin-sub muted">Asset Valuation: £82,000</div>
                  </div>
                </div>
                <div className="vp-fin-card">
                  <div className="vp-fin-label" style={{display: 'flex', justifyContent: 'space-between', color: '#fff', fontWeight: 'bold'}}>
                    AMORTIZATION TIMELINE <span>Year 2 of 4</span>
                  </div>
                  <div className="vp-amort-timeline">
                    <div className="vp-amort-bar-bg">
                      <div className="vp-amort-bar-fill" style={{width: '68%'}}></div>
                    </div>
                    <div className="vp-amort-labels">
                      <span>JAN 2022</span>
                      <span>DEC 2025</span>
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
          )}
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
