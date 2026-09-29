import React, { useState } from 'react';
import { X, User, CreditCard, Star, ShieldCheck, FileText, Lock, Shield, Camera, CarFront, Calendar, UserCheck, UserX, CheckCircle, MapPin, Receipt, CircleDollarSign, Wallet } from 'lucide-react';
import privateAvatar from '../assets/private-avatar-placeholder.png';
import './PrivateClientProfileModal.css';
import './UniversalModal.css';
import ConciergeFeed from './ConciergeFeed';
import './CommandCenter.css';
import LiveTripModal from './LiveTripModal';
import UniversalTripTable from './UniversalTripTable';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';

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

const PrivateClientProfileModal = ({ isOpen, onClose, isNew, client }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { openSummaryModal } = useEntityLinker();

  if (!isOpen) return null;

  const name = isNew ? "New Private Client" : (client?.name || "Private Client");
  const avatar = isNew ? privateAvatar : (client?.avatar || privateAvatar);
  const tier = client?.tier || 'VIP';
  const lifetimeValue = client?.lifetimeValue || "$0.00";
  const status = client?.status || "ACTIVE";
  
  const phone = client?.contact?.phone || "+44 7700 900000";
  const email = client?.contact?.email || "email@example.com";
  const assistant = client?.contact?.assistant || "None";
  
  const rides = client?.trips || [];

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      {selectedTrip && (
        <LiveTripModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}
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

        <div className="u-modal-hero" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '0' }}>
          <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div className="u-modal-hero-avatar-container">
              <img src={avatar} alt="Private Avatar" className="u-modal-hero-avatar" />
              {isEditing && (
                <button className="u-modal-hero-upload-btn">
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="u-modal-hero-info" style={{ flexGrow: 1 }}>
              <h1 className="u-modal-hero-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{name}</h1>
              <p className="u-modal-hero-subtitle" style={{ fontSize: '14px', letterSpacing: '1px' }}>High Net Worth Individual • <span style={{color: 'var(--color-gold)'}}>{tier}</span></p>
            </div>
          </div>
          
          <div className="u-modal-hero-persistent-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Mobile Phone</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{phone}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Primary Email</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{email}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>EA / PA Contact</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{assistant}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Account Status</span>
                <span style={{ fontSize: '13px', color: 'var(--status-completed)', fontWeight: 'bold' }}>{status}</span>
             </div>
          </div>
        </div>

        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'rides' ? 'active' : ''}`} onClick={() => setActiveTab('rides')}>RIDE HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>PAYMENT METHODS</button>
          <button className={`u-modal-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>PREFERENCES</button>
          <button className={`u-modal-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>ENGAGEMENT</button>
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
                      {!isEditing ? (
                        <div className="u-modal-input" style={{ display: 'flex', alignItems: 'center' }}>
                          <EntityLink type="Driver">Julian Sterling</EntityLink> &nbsp;(VEO-9921)
                        </div>
                      ) : (
                        <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Julian Sterling (VEO-9921)"} />
                      )}
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

              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
                <UniversalTripTable
                  trips={[]}
                  onTripClick={trip => setSelectedTrip(trip)}
                  showChannel={true}
                  emptyMessage="No active bookings for this client."
                />
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
                    {(client?.invoices || []).map(inv => (
                      <tr key={inv.id}><td>{inv.invoice_number}</td><td>£{Number(inv.customer_retail_fare || 0).toFixed(2)}</td><td>{inv.status}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

          {activeTab === 'engagement' && (
            <div className="u-modal-tab-content" style={{ padding: 0 }}>
              <ConciergeFeed clientName={name} />
            </div>
          )}

          {activeTab === 'preferences' && (
            <div className="u-modal-tab-content" style={{ padding: '24px' }}>
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  VIP PREFERENCES
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Dedicated Chauffeur (Optional)</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Julian Sterling (VEO-9921)"} readOnly={!isEditing} />
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
                <div className="u-modal-field" style={{marginTop: '16px'}}>
                  <label className="u-modal-label">Cabin Preferences & Dietary</label>
                  <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "San Pellegrino strictly at room temp, Financial Times, no cabin fragrance"} readOnly={!isEditing} />
                </div>
              </div>
            </div>
          )}
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
