import React, { useState } from 'react';
import { X, User, CreditCard, Star, ShieldCheck, FileText, Lock, Shield, Camera, CarFront, Calendar, UserCheck, UserX, CheckCircle, MapPin, Receipt, CircleDollarSign, Wallet } from 'lucide-react';
import privateAvatar from '../assets/private-avatar-placeholder.png';
import './PrivateClientProfileModal.css';
import './UniversalModal.css';
import './CommandCenter.css'; // Import for cc-table styles

const FastCarIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 100 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="carMaskPrivate">
        <rect width="100" height="40" fill="white" />
        <path d="M53 6 L55 13 L42 13 C45 10 49 7 53 6 Z" fill="black" />
        <path d="M56 6 C63 6 72 9 77 13 L58 13 Z" fill="black" />
        <circle cx="46" cy="30" r="4" fill="black" />
        <circle cx="84" cy="30" r="4" fill="black" />
        <circle cx="46" cy="30" r="2" fill="white" />
        <circle cx="84" cy="30" r="2" fill="white" />
      </mask>
    </defs>
    <g fill="currentColor" mask="url(#carMaskPrivate)">
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
  { id: '#VELO-9855', channel: 'Private (VIP)', status: 'On Trip', driver: 'Sarah Jenkins', vehicle: 'Bentley Bentayga', route: 'Gatwick South to The Shard', progress: 45, timeToFree: '1h 15m' },
  { id: '#VELO-9861', channel: 'Private (VIP)', status: 'Arrived at pickup', driver: 'A. Patel', vehicle: 'S-Class (Blue)', route: 'Battersea to Heathrow T5', progress: 25, timeToFree: '22m' },
];

const MOCK_INVOICES = [
  { id: 'INV-2026-088', date: '01 Jun 2026', amount: '$1,200', status: 'Paid', trips: 3 },
  { id: 'INV-2026-092', date: '15 Jun 2026', amount: '$850', status: 'Outstanding', trips: 2 },
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

const PrivateClientProfileModal = ({ isOpen, onClose, isNew }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);

  if (!isOpen) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isNew ? "Onboard Private Client" : "Private Client Profile"}</h2>
          </div>
          <div className="u-modal-header-actions">
            {isEditing ? (
              <button className="u-modal-btn-save" onClick={() => setIsEditing(false)}>SAVE CLIENT</button>
            ) : (
              <button className="u-modal-btn-edit" onClick={() => setIsEditing(true)}>EDIT CLIENT</button>
            )}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="u-modal-hero">
          <div className="u-modal-hero-avatar-container">
            <img src={privateAvatar} alt="Client Avatar" className="u-modal-hero-avatar" />
            {isEditing && (
              <button className="u-modal-hero-upload-btn">
                <Camera size={16} />
              </button>
            )}
          </div>
          <div className="u-modal-hero-info">
            <h1 className="u-modal-hero-title">{isNew ? "New Private Client" : "Alexander Sterling"}</h1>
            <p className="u-modal-hero-subtitle">High-Net-Worth Individual • VIP PRIORITY</p>
          </div>
        </div>

        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'rides' ? 'active' : ''}`} onClick={() => setActiveTab('rides')}>RIDE HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>PAYMENT METHODS</button>
          <button className={`u-modal-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>PREFERENCES</button>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              {/* Identity */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <User size={16} /> PERSONAL IDENTITY
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Full Name</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Alexander Sterling"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Date of Birth</label>
                    <input type="date" className="u-modal-input" defaultValue={isNew ? "" : "1978-04-12"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Primary Contact Number</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "+44 7700 900111"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Email Address</label>
                    <input type="email" className="u-modal-input" defaultValue={isNew ? "" : "a.sterling@private-domain.com"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="u-modal-field">
                  <label className="u-modal-label">Primary Residence</label>
                  <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "42 Kensington Palace Gardens, London, W8 4QQ"} readOnly={!isEditing} />
                </div>
              </div>

              {/* Financial & Billing */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <CreditCard size={16} /> FINANCIAL & BILLING
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Primary Card</label>
                    <input type="text" className="u-modal-input u-modal-val-gold" defaultValue={isNew ? "" : "AMEX Centurion •••• 1004"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Default Currency</label>
                    <select className="u-modal-input" disabled={!isEditing}>
                      <option>GBP (£)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                </div>
                <div className="u-modal-field">
                  <label className="u-modal-label">Billing Address (If different)</label>
                  <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Same as Primary Residence"} readOnly={!isEditing} />
                </div>
              </div>

              {/* VIP Preferences */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <Star size={16} /> VIP PREFERENCES
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Dedicated Chauffeur (Optional)</label>
                    <div className="u-modal-input-with-icon">
                      <User size={14} className="u-modal-input-icon" />
                      <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Julian Sterling (VEO-9921)"} readOnly={!isEditing} />
                    </div>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Preferred Vehicle Class</label>
                    <select className="u-modal-input u-modal-val-gold" disabled={!isEditing}>
                      <option>First Class (Maybach / Phantom)</option>
                      <option>Business Class (S-Class / 7-Series)</option>
                      <option>SUV (Range Rover / Cullinan)</option>
                    </select>
                  </div>
                </div>
                <div className="u-modal-field">
                  <label className="u-modal-label">Cabin Preferences & Dietary</label>
                  <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "San Pellegrino strictly at room temp, Financial Times, no cabin fragrance"} readOnly={!isEditing} />
                </div>
              </div>

              {/* Security & Identity */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <ShieldCheck size={16} /> SECURITY & IDENTITY
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-doc-card">
                    <div className="u-modal-doc-info">
                      <FileText size={14} /> Passport / Govt ID
                    </div>
                    {isNew ? <span className="u-modal-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="u-modal-badge-valid">VERIFIED</span>}
                  </div>
                  <div className="u-modal-doc-card">
                    <div className="u-modal-doc-info">
                      <Lock size={14} /> Background / Security Check
                    </div>
                    {isNew ? <span className="u-modal-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>INITIATE</span> : <span className="u-modal-badge-valid">CLEARED</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'rides' && (
            <div className="u-modal-tab-content">
              <div className="u-metric-row" style={{ marginBottom: '24px' }}>
                <button className="cc-pulse-card active">
                  <div className="cc-pulse-percent"><CarFront size={20} className="cc-pulse-icon" />2</div>
                  <div className="cc-pulse-label">ACTIVE TRIPS</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><CheckCircle size={20} className="cc-pulse-icon" />18</div>
                  <div className="cc-pulse-label">COMPLETED</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><Calendar size={20} className="cc-pulse-icon" />1</div>
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
            <div className="u-modal-tab-content">
              <div className="u-metric-row" style={{ marginBottom: '24px' }}>
                <button className="cc-pulse-card active">
                  <div className="cc-pulse-percent"><Receipt size={20} className="cc-pulse-icon" />$24.5K</div>
                  <div className="cc-pulse-label">LIFETIME INVOICED</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><CircleDollarSign size={20} className="cc-pulse-icon" />$23.65K</div>
                  <div className="cc-pulse-label">PAID AMOUNT</div>
                </button>
                <button className="cc-pulse-card">
                  <div className="cc-pulse-percent"><Wallet size={20} className="cc-pulse-icon" style={{color: '#ff4d4d'}}/>$850</div>
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

export default PrivateClientProfileModal;
