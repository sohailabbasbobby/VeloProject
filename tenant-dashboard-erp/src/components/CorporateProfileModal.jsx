import React, { useState } from 'react';
import { X, Building2, Wallet, Contact, ShieldCheck, FileText, Copy, Shield, User, Camera, CarFront, Calendar, UserCheck, UserX, CheckCircle, MapPin, Receipt, CircleDollarSign } from 'lucide-react';
import corporateLogo from '../assets/corporate-logo-placeholder.png';
import './CorporateProfileModal.css';
import './UniversalModal.css';
import './CommandCenter.css'; // Import for cc-table styles

const FastCarIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 100 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="carMaskCorp">
        <rect width="100" height="40" fill="white" />
        <path d="M53 6 L55 13 L42 13 C45 10 49 7 53 6 Z" fill="black" />
        <path d="M56 6 C63 6 72 9 77 13 L58 13 Z" fill="black" />
        <circle cx="46" cy="30" r="4" fill="black" />
        <circle cx="84" cy="30" r="4" fill="black" />
        <circle cx="46" cy="30" r="2" fill="white" />
        <circle cx="84" cy="30" r="2" fill="white" />
      </mask>
    </defs>
    <g fill="currentColor" mask="url(#carMaskCorp)">
      <path d="M10 12 h 23 l -2 3 h -21 z" />
      <path d="M18 18 h 14 l -2 3 h -12 z" />
      <path d="M24 24 h 8 l -2 3 h -6 z" />
      <path d="M35 18 C33 17 34 14 36 12 C41 9 48 5 57 4 C66 3 76 6 83 12 C88 15 93 17 96 18 C98 19 99 21 99 24 C99 28 98 30 96 30 L36 30 C34 30 33 28 33 24 L35 18 Z" />
      <circle cx="46" cy="30" r="8" />
      <circle cx="84" cy="30" r="8" />
    </g>
  </svg>
);

const MOCK_ACTIVE_BOOKINGS = [
  { id: '#VELO-9842', channel: 'Velo Black', status: 'On Trip', driver: 'James Smith', vehicle: 'RR Phantom', route: 'Heathrow T5 to Mayfair', progress: 75, timeToFree: '12m' },
  { id: '#VELO-9844', channel: 'Velo Core', status: 'Completed', driver: 'Marcus F.', vehicle: 'S-Class', route: 'Luton to Canary Wharf', progress: 100, timeToFree: 'Now' },
  { id: '#VELO-9848', channel: 'Velo Black', status: 'On Trip', driver: 'Tom W.', vehicle: 'RR Ghost', route: 'City Airport to O2 Arena', progress: 90, timeToFree: '4m' },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-041', date: '04 Jun 2026', amount: '$4,250', status: 'Paid', trips: 14 },
  { id: 'INV-2026-042', date: '11 Jun 2026', amount: '$3,800', status: 'Outstanding', trips: 11 },
  { id: 'INV-2026-043', date: '18 Jun 2026', amount: '$5,100', status: 'Upcoming', trips: 16 },
];

const getStatusClass = (status) => {
  switch(status) {
    case 'Unassigned': return 'status-unassigned';
    case 'Assigned': return 'status-assigned';
    case 'On the way to Pickup': return 'status-way-to-pickup';
    case 'Arrived at pickup': return 'status-arrived';
    case 'Waiting for customer': return 'status-waiting';
    case 'On Trip': return 'status-on-trip';
    case 'Completed': return 'status-completed';
    case 'Paid': return 'status-completed';
    case 'Outstanding': return 'status-waiting';
    case 'Upcoming': return 'status-assigned';
    default: return 'status-unassigned';
  }
};

const CorporateProfileModal = ({ isOpen, onClose, isNew }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);

  if (!isOpen) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isNew ? "Onboard Corporate Client" : "Corporate Account Profile"}</h2>
          </div>
          <div className="u-modal-header-actions">
            {isEditing ? (
              <button className="cpm-btn-save" onClick={() => setIsEditing(false)}>SAVE ACCOUNT</button>
            ) : (
              <button className="u-modal-btn-edit" onClick={() => setIsEditing(true)}>EDIT ACCOUNT</button>
            )}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="cpm-hero">
          <div className="cpm-hero-logo-container">
            <img src={corporateLogo} alt="Corporate Logo" className="cpm-hero-logo" />
            {isEditing && (
              <button className="cpm-hero-upload-btn">
                <Camera size={16} />
              </button>
            )}
          </div>
          <div className="cpm-hero-info">
            <h1 className="cpm-hero-title">{isNew ? "New Corporate Client" : "Aetheris Global Holdings"}</h1>
            <p className="cpm-hero-subtitle">Hedge Fund / Private Equity • EXECUTIVE ELITE</p>
          </div>
        </div>

        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>ACTIVE BOOKINGS</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>BILLING HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>AUTHORIZED USERS</button>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              {/* Identity & Location */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <Building2 size={16} /> IDENTITY & LOCATION
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Company Name</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Aetheris Global Holdings"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Registration Number</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "UK-992841-B"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Sector</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Hedge Fund / Private Equity"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Primary Contact</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Julian Thorne (Chief of Staff)"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-field">
                  <label className="cpm-label">Office Address</label>
                  <input type="text" className="cpm-input" defaultValue={isNew ? "" : "14 Curzon Street, Mayfair, London, W1J 5HI, United Kingdom"} readOnly={!isEditing} />
                </div>
              </div>

              {/* Financial Framework */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <Wallet size={16} /> FINANCIAL FRAMEWORK
                </div>
                <div className="cpm-grid-3">
                  <div className="cpm-field">
                    <label className="cpm-label">Credit Limit</label>
                    <input type="text" className="cpm-input cpm-val-gold" defaultValue={isNew ? "" : "$50,000"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Billing Frequency</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Weekly"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Payment Terms</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Net 30"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">VAT Number</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "GB 123 4567 89"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Invoicing Email</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "finance@aetheris-global.com"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-field">
                  <label className="cpm-label">Bank Details (IBAN/Swift)</label>
                  <div className="cpm-input-with-action">
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "GB89 VELO 6016 1331 4455 66 • VELOUK22"} readOnly={!isEditing} />
                    <Copy size={14} className="cpm-input-action" />
                  </div>
                </div>
              </div>

              {/* SLA & Preferences */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <Contact size={16} /> SLA & PREFERENCES
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Account Manager</label>
                    <div className="cpm-input-with-icon">
                      <User size={14} className="cpm-input-icon" />
                      <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Eleanor Vance"} readOnly={!isEditing} />
                    </div>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Service Tier</label>
                    <select className="cpm-input cpm-val-gold" disabled={!isEditing}>
                      <option>EXECUTIVE ELITE</option>
                      <option>PLATINUM</option>
                      <option>CORE</option>
                    </select>
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Preferred Vehicle Class</label>
                    <select className="cpm-input" disabled={!isEditing}>
                      <option>First Class (Maybach / Phantom)</option>
                      <option>Business Class (S-Class / 7-Series)</option>
                    </select>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Special Instructions</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Bottled Fiji Water, no scent"} readOnly={!isEditing} />
                  </div>
                </div>
              </div>

              {/* Compliance & Documentation */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <ShieldCheck size={16} /> COMPLIANCE & DOCUMENTATION
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-doc-card">
                    <div className="cpm-doc-info">
                      <FileText size={14} /> Master Service Agreement
                    </div>
                    {isNew ? <span className="cpm-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="cpm-badge-valid">VALID</span>}
                  </div>
                  <div className="cpm-doc-card">
                    <div className="cpm-doc-info">
                      <Shield size={14} /> Corporate Insurance
                    </div>
                    {isNew ? <span className="cpm-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="cpm-badge-valid">VALID</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'bookings' && (
            <div className="cpm-tab-content">
              <div className="cc-metrics-row" style={{ marginBottom: '24px' }}>
                <button className="cc-pulse-card active">
                  <div className="cc-pulse-percent"><CarFront size={20} className="cc-pulse-icon" />2</div>
                  <div className="cc-pulse-label">ACTIVE TRIPS</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><CheckCircle size={20} className="cc-pulse-icon" />1</div>
                  <div className="cc-pulse-label">COMPLETED</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><Calendar size={20} className="cc-pulse-icon" />4</div>
                  <div className="cc-pulse-label">UPCOMING</div>
                </button>
              </div>

              <div className="cc-table-container">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '10%' }}>TASK ID</th>
                      <th style={{ width: '15%' }}>STATUS</th>
                      <th style={{ width: '15%' }}>DRIVER</th>
                      <th style={{ width: '15%' }}>VEHICLE</th>
                      <th style={{ width: '25%' }}>ROUTE DETAIL</th>
                      <th className="text-right" style={{ width: '15%' }}>TIME-TO-FREE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_ACTIVE_BOOKINGS.map(task => (
                      <tr key={task.id} className="cc-card-row">
                        <td className="text-gold font-bold">{task.id}</td>
                        <td><span className={`cc-status-badge ${getStatusClass(task.status)}`}>{task.status}</span></td>
                        <td><span className="cc-mock-link">{task.driver}</span></td>
                        <td><span className="cc-mock-link">{task.vehicle}</span></td>
                        <td className="text-white">{task.route}</td>
                        <td className="text-right" style={{ paddingRight: '24px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                            <span className="cc-metric" style={{ color: 'var(--color-gold)' }}>{task.timeToFree}</span>
                            <span style={{ fontSize: '10px', color: 'var(--color-text-muted)' }}>Mins</span>
                          </div>
                        </td>
                        <div className="cc-row-progress-bar">
                           <div className={`cc-row-progress-fill ${getStatusClass(task.status)}`} style={{ width: `${task.progress}%` }}>
                              <div className="cc-progress-content">
                                 <FastCarIcon size={32} className="cc-progress-car-icon" />
                                 <span className="cc-progress-text">{task.progress > 0 ? `${task.progress}%` : ''}</span>
                              </div>
                           </div>
                        </div>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="cpm-tab-content">
              <div className="cc-metrics-row" style={{ marginBottom: '24px' }}>
                <button className="cc-pulse-card active">
                  <div className="cc-pulse-percent"><Receipt size={20} className="cc-pulse-icon" />$145K</div>
                  <div className="cc-pulse-label">TOTAL INVOICED</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><CircleDollarSign size={20} className="cc-pulse-icon" />$132.5K</div>
                  <div className="cc-pulse-label">PAID AMOUNT</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><Wallet size={20} className="cc-pulse-icon" style={{color: '#ff4d4d'}}/>$12.5K</div>
                  <div className="cc-pulse-label" style={{color: '#ff4d4d'}}>OUTSTANDING</div>
                </button>
              </div>

              <div className="cc-table-container">
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '20%' }}>INVOICE ID</th>
                      <th style={{ width: '20%' }}>DATE</th>
                      <th style={{ width: '20%' }}>TRIPS</th>
                      <th style={{ width: '20%' }}>AMOUNT</th>
                      <th style={{ width: '20%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_INVOICES.map(inv => (
                      <tr key={inv.id} className="cc-card-row">
                        <td className="text-gold font-bold">{inv.id}</td>
                        <td className="text-white">{inv.date}</td>
                        <td className="text-white">{inv.trips}</td>
                        <td className="text-white font-bold">{inv.amount}</td>
                        <td><span className={`cc-status-badge ${getStatusClass(inv.status)}`}>{inv.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
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

export default CorporateProfileModal;
