import React, { useState } from 'react';
import { X, Building2, Wallet, Contact, ShieldCheck, FileText, Copy, Shield, User, Camera, CarFront, Calendar, UserCheck, UserX, CheckCircle, MapPin, Receipt, CircleDollarSign, ChevronDown, ChevronUp, ChevronLeft, Filter } from 'lucide-react';
import corporateLogo from '../assets/corporate-logo-placeholder.png';
import './CorporateProfileModal.css';
import './UniversalModal.css';
import './CommandCenter.css';
import ConciergeFeed from './ConciergeFeed';
import LiveTripModal from './LiveTripModal';
import UniversalTripTable from './UniversalTripTable';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

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
  { id: '#VELO-9842', channel: 'Velo Black', status: 'On Trip',              driver: 'James Smith',  vehicle: 'RR Phantom (KX21)',  passenger: 'C. Harrington',   client: 'J.P. Morgan',    route: 'Heathrow T5 to Mayfair',      progress: 75,  timeToFree: '12m'  },
  { id: '#VELO-9844', channel: 'Velo Core',  status: 'Completed',            driver: 'Marcus F.',    vehicle: 'S-Class (Black)',    passenger: 'R. Goldman',      client: 'Goldman Sachs',  route: 'Luton to Canary Wharf',        progress: 100, timeToFree: 'Now'  },
  { id: '#VELO-9848', channel: 'Velo Black', status: 'On Trip',              driver: 'Tom W.',       vehicle: 'RR Ghost',           passenger: 'L. Morgan',       client: 'Morgan Stanley', route: 'City Airport to O2 Arena',    progress: 90,  timeToFree: '4m'   },
  { id: '#VELO-9851', channel: 'Pool',       status: 'Assigned',             driver: 'Elena R.',     vehicle: 'Bentley Bentayga',   passenger: 'Sir J. Whitmore', client: 'HSBC Capital',   route: 'Canary Wharf to LHR T5',      progress: 0,   timeToFree: '35m'  },
  { id: '#VELO-9852', channel: 'Velo Core',  status: 'On the way to Pickup', driver: 'A. Patel',     vehicle: 'S-Class (Midnight)', passenger: 'P. Chen',         client: 'Barclays Corp',  route: 'St. James to Heathrow T4',    progress: 20,  timeToFree: '18m'  },
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

const CreditUtilizationGauge = ({ limit, utilized }) => {
  const radius = 35;
  const circumference = 2 * Math.PI * radius;
  const percentage = utilized / limit;
  const offset = circumference - percentage * circumference;

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
        <text x="50" y="55" textAnchor="middle" fill="white" fontSize="16" fontWeight="bold">{Math.round(percentage * 100)}%</text>
      </svg>
      <div className="u-modal-gauge-label">
        <div style={{color: 'white', fontWeight: 'bold'}}>${(utilized/1000).toFixed(1)}k</div>
        <div style={{color: 'var(--color-text-muted)', fontSize: '10px'}}>of ${(limit/1000).toFixed(1)}k Limit</div>
      </div>
    </div>
  );
};

const SpendTrendSparkline = ({ data }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * 100;
    const y = 100 - ((val - min) / range) * 80 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="u-modal-sparkline-container">
      <div className="u-modal-sparkline-title">Spend Trend</div>
      <svg width="100%" height="80" viewBox="0 -10 100 120" preserveAspectRatio="none" className="u-modal-sparkline-svg">
        <polyline points={points} fill="none" stroke="var(--color-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((val, i) => {
          const x = (i / (data.length - 1)) * 100;
          const y = 100 - ((val - min) / range) * 80 - 10;
          return <circle key={i} cx={x} cy={y} r="4" fill="var(--color-onyx)" stroke="var(--color-gold)" strokeWidth="2" />
        })}
      </svg>
      <div className="u-modal-sparkline-labels">
        <span>Prev Cycle</span>
        <span style={{color: 'var(--color-gold)'}}>Current</span>
      </div>
    </div>
  );
};

const CorporateProfileModal = ({ isOpen, onClose, isNew, client }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);
  const [expandedInvoices, setExpandedInvoices] = useState({});
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const { openSummaryModal } = useEntityLinker();

  const toggleInvoice = (id) => {
    setExpandedInvoices(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (!isOpen) return null;

  const name = isNew ? "New Corporate Client" : (client?.name || "Corporate Account");
  const logo = isNew ? corporateLogo : (client?.logo || corporateLogo);
  const sector = client?.sector || 'Corporate';
  const tier = client?.tier || 'EXECUTIVE ELITE';
  const balance = client?.balance || "$0.00";
  const manager = client?.manager || "Unassigned";
  const status = client?.status || "ACTIVE";
  const statusClass = client?.statusClass || "active-acc";
  
  const primaryPhone = client?.contact?.primaryPhone || "+44 20 7946 0000";
  const financePhone = client?.contact?.financePhone || "+44 20 7946 0885";
  const primaryContact = client?.contact?.primaryContact || "Unassigned";
  const financeEmail = client?.contact?.financeEmail || "finance@example.com";
  
  const authorizedUsers = client?.authorizedUsers || [];
  const invoices = client?.invoices?.length ? client.invoices : (MOCK_CORP_CLIENTS?.[0]?.invoices || MOCK_INVOICES || []);

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      {selectedTrip && (
        <LiveTripModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isNew ? "Onboard Corporate Client" : "Corporate Account Profile"}</h2>
          </div>
          <div className="u-modal-header-actions">
            {isEditing ? (
              <button className="u-modal-btn-save" onClick={() => setIsEditing(false)}>SAVE ACCOUNT</button>
            ) : (
              <button className="u-modal-btn-edit" onClick={() => setIsEditing(true)}>EDIT ACCOUNT</button>
            )}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="u-modal-hero" style={{ display: 'flex', flexDirection: 'column', gap: '16px', paddingBottom: '0' }}>
                    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
            <div className="u-modal-hero-avatar-container">
              <img src={logo} alt="Corporate Logo" className="u-modal-hero-avatar" />
              {isEditing && (
                <button className="u-modal-hero-upload-btn">
                  <Camera size={16} />
                </button>
              )}
            </div>
            <div className="u-modal-hero-info" style={{ flexGrow: 1 }}>
              <h1 className="u-modal-hero-title" style={{ fontSize: '28px', marginBottom: '8px' }}>{name}</h1>
              <p className="u-modal-hero-subtitle" style={{ fontSize: '14px', letterSpacing: '1px' }}>{sector} • <span style={{color: 'var(--color-gold)'}}>{tier}</span></p>
            </div>
          </div>
          
          <div className="u-modal-hero-persistent-info" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '16px', background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Primary Phone</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{primaryPhone}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Finance Email</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{financeEmail}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Primary Contact</span>
                <span style={{ fontSize: '13px', color: '#fff', fontWeight: 'bold' }}>{primaryContact}</span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>Account Status</span>
                <span style={{ fontSize: '13px', color: 'var(--status-completed)', fontWeight: 'bold' }}>{status}</span>
             </div>
          </div>
        </div>

        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>ACTIVE BOOKINGS</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>BILLING HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>AUTHORIZED USERS</button>
          <button className={`u-modal-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>ENGAGEMENT</button>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              {/* Identity & Location */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <Building2 size={16} /> IDENTITY & LOCATION
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Company Name</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Aetheris Global Holdings"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Registration Number</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "UK-992841-B"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="u-modal-field" style={{marginTop: '16px'}}>
                  <label className="u-modal-label">Office Address</label>
                  <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "14 Curzon Street, Mayfair, London, W1J 5HI, United Kingdom"} readOnly={!isEditing} />
                </div>
              </div>

              {/* Full Contact Block */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <Contact size={16} /> PRIMARY & FINANCE CONTACTS
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Primary Office Phone</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "+44 20 7946 0881"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Primary Contact</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Julian Thorne (Chief of Staff)"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Finance/Accounts Phone</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "+44 20 7946 0885"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Finance/Accounts Email</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "finance@aetheris-global.com"} readOnly={!isEditing} />
                  </div>
                </div>
              </div>

              {/* Authorized Personnel Summary */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <UserCheck size={16} /> AUTHORIZED PERSONNEL SUMMARY
                </div>
                <div className="u-modal-grid-3">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Total Users</label>
                    <input type="text" className="u-modal-input u-modal-val-gold" defaultValue={isNew ? "" : "12 Personnel"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Active Bookers</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "8 Permitted"} readOnly={!isEditing} />
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Manage Personnel</label>
                    <button className="u-modal-btn-edit" style={{width: '100%', justifyContent: 'center'}} onClick={() => setActiveTab('users')}>VIEW DIRECTORY</button>
                  </div>
                </div>
              </div>

              {/* Financial Dashboard */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <Wallet size={16} /> FINANCIAL INTELLIGENCE
                </div>
                <div className="u-modal-financial-dashboard">
                  <div className="u-modal-financial-card">
                    <div className="u-modal-financial-card-header">Credit Utilization</div>
                    <CreditUtilizationGauge limit={50000} utilized={12500} />
                  </div>
                  <div className="u-modal-financial-card" style={{ flexGrow: 1 }}>
                    <SpendTrendSparkline data={[8500, 9200, 7800, 11000, 12500]} />
                  </div>
                  <div className="u-modal-financial-card u-modal-financial-summary">
                     <div className="u-modal-summary-item">
                        <span className="u-modal-summary-label">Billing Frequency</span>
                        <span className="u-modal-summary-value">Weekly</span>
                     </div>
                     <div className="u-modal-summary-item">
                        <span className="u-modal-summary-label">Payment Terms</span>
                        <span className="u-modal-summary-value">Net 30</span>
                     </div>
                     <div className="u-modal-summary-item">
                        <span className="u-modal-summary-label">VAT Number</span>
                        <span className="u-modal-summary-value">GB 123 4567 89</span>
                     </div>
                  </div>
                </div>
              </div>

              {/* SLA & Preferences */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <Contact size={16} /> SLA & PREFERENCES
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Account Manager</label>
                    <div className="u-modal-input-with-icon">
                      <User size={14} className="u-modal-input-icon" />
                      <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Eleanor Vance"} readOnly={!isEditing} />
                    </div>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Service Tier</label>
                    <select className="u-modal-input u-modal-val-gold" disabled={!isEditing}>
                      <option>EXECUTIVE ELITE</option>
                      <option>PLATINUM</option>
                      <option>CORE</option>
                    </select>
                  </div>
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Preferred Vehicle Class</label>
                    <select className="u-modal-input" disabled={!isEditing}>
                      <option>First Class (Maybach / Phantom)</option>
                      <option>Business Class (S-Class / 7-Series)</option>
                    </select>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Special Instructions</label>
                    <input type="text" className="u-modal-input" defaultValue={isNew ? "" : "Bottled Fiji Water, no scent"} readOnly={!isEditing} />
                  </div>
                </div>
              </div>

              {/* Compliance & Documentation */}
              <div className="u-modal-section">
                <div className="u-modal-section-header">
                  <ShieldCheck size={16} /> COMPLIANCE & DOCUMENTATION
                </div>
                <div className="u-modal-grid-2">
                  <div className="u-modal-doc-card">
                    <div className="u-modal-doc-info">
                      <FileText size={14} /> Master Service Agreement
                    </div>
                    {isNew ? <span className="u-modal-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="u-modal-badge-valid">VALID</span>}
                  </div>
                  <div className="u-modal-doc-card">
                    <div className="u-modal-doc-info">
                      <Shield size={14} /> Corporate Insurance
                    </div>
                    {isNew ? <span className="u-modal-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="u-modal-badge-valid">VALID</span>}
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'bookings' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
              {/* KPI bar */}
              <div style={{ flex: '0 0 auto', display: 'flex', gap: '16px' }}>
                <div className="u-metric-massive" style={{ borderColor: 'var(--color-gold)', backgroundColor: 'rgba(212,175,55,0.05)' }}>
                  <div className="u-metric-number"><CarFront size={28} />2</div>
                  <div className="u-metric-label">ACTIVE BOOKINGS</div>
                </div>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><CheckCircle size={28} />1</div>
                  <div className="u-metric-label">COMPLETED</div>
                </div>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><Calendar size={28} />4</div>
                  <div className="u-metric-label">UPCOMING</div>
                </div>
              </div>
              {/* Universal trip table — same layout as home screen */}
              <UniversalTripTable
                trips={MOCK_ACTIVE_BOOKINGS}
                onTripClick={trip => setSelectedTrip(trip)}
                showChannel={true}
                emptyMessage="No active bookings for this account."
              />
            </div>
          )}

          {activeTab === 'billing' && (
            <div className="u-modal-tab-content">
              <div className="u-modal-section-header" style={{ marginBottom: '16px' }}>
                <FileText size={16} /> BILLING SUMMARY
              </div>

              {/* Finance Contact Block */}
              <div className="u-modal-section" style={{ marginBottom: '24px' }}>
                <div className="u-modal-grid-3">
                  <div className="u-modal-field">
                    <label className="u-modal-label">Finance Department</label>
                    <div className="u-modal-value-box">Sarah Jenkins</div>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Direct Line</label>
                    <div className="u-modal-value-box">+44 20 7946 0885</div>
                  </div>
                  <div className="u-modal-field">
                    <label className="u-modal-label">Billing Email</label>
                    <div className="u-modal-value-box">finance@aetheris-global.com</div>
                  </div>
                </div>
              </div>

              <div className="u-metric-row" style={{ marginBottom: '32px', display: 'flex', gap: '16px' }}>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><Receipt size={32} />$145K</div>
                  <div className="u-metric-label">TOTAL REVENUE (YTD)</div>
                </div>
                <div className="u-metric-massive" style={{ borderColor: 'rgba(255, 77, 77, 0.3)', backgroundColor: 'rgba(255, 77, 77, 0.05)' }}>
                  <div className="u-metric-number" style={{color: '#ff4d4d'}}><Wallet size={32} />$12.5K</div>
                  <div className="u-metric-label" style={{color: '#ff4d4d'}}>OUTSTANDING</div>
                </div>
                <div className="u-metric-massive">
                  <div className="u-metric-number"><Calendar size={32} />Jul 01</div>
                  <div className="u-metric-label">NEXT INVOICE DATE</div>
                </div>
              </div>

              <div className="u-modal-section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <FileText size={16} /> UNBILLED TRIPS (CURRENT CYCLE)
                </div>
                <button className="u-modal-btn-save" style={{ padding: '8px 16px', fontSize: '11px' }}>
                  GENERATE CYCLE INVOICE
                </button>
              </div>

              <div className="cc-table-container" style={{ marginBottom: '32px' }}>
                <table className="cc-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>TASK ID</th>
                      <th style={{ width: '25%' }}>ROUTE</th>
                      <th style={{ width: '20%' }}>DATE</th>
                      <th style={{ width: '20%' }}>AMOUNT</th>
                      <th style={{ width: '20%' }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="cc-card-row">
                      <td className="text-gold font-bold">#VELO-9912</td>
                      <td className="text-white">Heathrow T5 to Mayfair</td>
                      <td className="text-white">28 Jun 2026</td>
                      <td className="text-white font-bold">$350</td>
                      <td><span className="cc-status-badge status-waiting">Unbilled</span></td>
                    </tr>
                    <tr className="cc-card-row">
                      <td className="text-gold font-bold">#VELO-9915</td>
                      <td className="text-white">Mayfair to Gatwick</td>
                      <td className="text-white">29 Jun 2026</td>
                      <td className="text-white font-bold">$420</td>
                      <td><span className="cc-status-badge status-waiting">Unbilled</span></td>
                    </tr>
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
                      <th style={{ width: '20%' }}>INVOICE ID</th>
                      <th style={{ width: '20%' }}>DATE</th>
                      <th style={{ width: '15%' }}>TRIPS</th>
                      <th style={{ width: '20%' }}>AMOUNT</th>
                      <th style={{ width: '20%' }}>STATUS</th>
                    </tr>
                  </thead>
                                    <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                        title: 'Corporate Invoice Detail', subtitle: inv.id, status: inv.status, icon: 'financial',
                        primaryMetric: { label: 'TOTAL AMOUNT', value: inv.amount },
                        fields: [
                          { label: 'Date Issued', value: inv.date },
                          { label: 'Total Trips', value: inv.trips?.length || inv.trips },
                          { label: 'Status', value: inv.status }
                        ]
                      })}>
                        <td style={{ textAlign: 'center' }}>
                          <Receipt size={16} color="var(--color-text-muted)" />
                        </td>
                        <td className="text-gold font-bold">{inv.id}</td>
                        <td className="text-white">{inv.date}</td>
                        <td className="text-white">{inv.trips?.length || inv.trips}</td>
                        <td className="text-white font-bold">{inv.amount}</td>
                        <td><span className={`cc-status-badge cc-status-${inv.status.toLowerCase()}`}>{inv.status}</span></td>
                      </tr>
                    ))}
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
                    <button className="u-modal-btn-save" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px', background: 'transparent', color: 'var(--color-gold)', border: '1px solid var(--color-gold)' }} onClick={() => setSelectedUser(null)}>
                      <ChevronLeft size={16} /> BACK TO DIRECTORY
                    </button>
                  </div>
                  <div className="u-modal-drilldown-profile" style={{ display: 'flex', gap: '24px', alignItems: 'center', padding: '24px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <div className="u-modal-drilldown-avatar" style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'rgba(212,175,55,0.1)', color: 'var(--color-gold)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <User size={40} />
                    </div>
                    <div className="u-modal-drilldown-info">
                      <h3 style={{ margin: '0 0 8px 0', fontSize: '20px', color: '#fff', fontFamily: 'var(--font-family-main)' }}>{selectedUser.name}</h3>
                      <div className="u-modal-drilldown-role" style={{ color: 'var(--color-gold)', fontSize: '12px', fontWeight: 'bold', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>{selectedUser.role}</div>
                      <div className="u-modal-drilldown-contact" style={{ color: 'var(--color-text-secondary)', fontSize: '12px' }}>{selectedUser.email} &bull; {selectedUser.phone}</div>
                    </div>
                  </div>
                  <div className="u-modal-section-header" style={{ display: 'flex', justifyContent: 'space-between', marginTop: '32px', marginBottom: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <FileText size={16} /> TRIPS BOOKED BY {selectedUser.name.toUpperCase()}
                    </div>
                    <button className="u-modal-btn-edit" style={{ padding: '4px 12px', fontSize: '10px', display: 'flex', alignItems: 'center' }}>
                      <Filter size={12} style={{marginRight: '4px'}} /> FILTER
                    </button>
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
                        <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                          title: 'User Booking Detail', subtitle: '#VELO-8801', status: 'Completed', icon: 'file',
                          primaryMetric: { label: 'FARE', value: '$250' },
                          fields: [{label: 'Route', value: 'Heathrow to City'}, {label: 'Date', value: '14 Jun 2026'}]
                        })}>
                          <td className="text-gold font-bold">#VELO-8801</td>
                          <td className="text-white">Heathrow to City</td>
                          <td className="text-white">14 Jun 2026</td>
                          <td className="text-white font-bold">$250</td>
                        </tr>
                        <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                          title: 'User Booking Detail', subtitle: '#VELO-8815', status: 'Completed', icon: 'file',
                          primaryMetric: { label: 'FARE', value: '$120' },
                          fields: [{label: 'Route', value: 'City to Mayfair'}, {label: 'Date', value: '16 Jun 2026'}]
                        })}>
                          <td className="text-gold font-bold">#VELO-8815</td>
                          <td className="text-white">City to Mayfair</td>
                          <td className="text-white">16 Jun 2026</td>
                          <td className="text-white font-bold">$120</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <>
                  <div className="u-modal-section-header" style={{ marginBottom: '16px' }}>
                    <UserCheck size={16} /> AUTHORIZED PERSONNEL
                  </div>
                  <div className="cpm-user-grid">
                    {authorizedUsers.map((user, idx) => (
                      <div key={idx} className="cpm-user-card" style={{cursor: 'pointer', border: '1px solid var(--color-gold)'}} onClick={() => setSelectedUser(user)}>
                        <div style={{ position: 'absolute', top: '8px', right: '12px', fontSize: '9px', color: 'var(--color-gold)', letterSpacing: '1px', textTransform: 'uppercase', fontWeight: 'bold' }}>Click to View Profile</div>
                        <div className="cpm-user-header" style={{ marginTop: '16px' }}>
                          <div className="cpm-user-avatar">
                            <User size={20} />
                          </div>
                          <div className="cpm-user-info">
                            <div className="cpm-user-name">{user.name}</div>
                            <div className="cpm-user-role">{user.role}</div>
                          </div>
                        </div>
                        <div className="cpm-user-contact">
                          <div>{user.email}</div>
                          <div>{user.phone}</div>
                        </div>
                        <div className="cpm-user-actions" onClick={e => e.stopPropagation()}>
                          <span className={`cpm-user-status ${user.status === 'Booking Permitted' ? 'active' : 'inactive'}`}>{user.status}</span>
                          <button className={`cpm-toggle-btn ${user.status === 'Booking Permitted' ? 'active' : 'inactive'}`}>
                            <div className="cpm-toggle-knob"></div>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        
          {activeTab === 'engagement' && (
            <div className="u-modal-tab-content" style={{ padding: 0 }}>
              <ConciergeFeed clientName={name} />
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

export default CorporateProfileModal;
