import React, { useState } from 'react';
import { User, MessageSquare, Phone, Briefcase, Lock, CarFront, Asterisk, ShieldCheck, Wallet, X } from 'lucide-react';
import './ChauffeurProfileModal.css';
import './UniversalModal.css';
import ConciergeFeed from './ConciergeFeed';
import LiveTripModal from './LiveTripModal';
import UniversalTripTable from './UniversalTripTable';
import OnboardChauffeurModal from './modals/OnboardChauffeurModal';
import EntityLink from './EntityLink';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import { openModal } from '../utils/openModal';

const FastCarIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 100 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="carMaskProfile">
        <rect width="100" height="40" fill="white" />
        <path d="M53 6 L55 13 L42 13 C45 10 49 7 53 6 Z" fill="black" />
        <path d="M56 6 C63 6 72 9 77 13 L58 13 Z" fill="black" />
        <circle cx="46" cy="30" r="4" fill="black" />
        <circle cx="84" cy="30" r="4" fill="black" />
        <circle cx="46" cy="30" r="2" fill="white" />
        <circle cx="84" cy="30" r="2" fill="white" />
      </mask>
    </defs>
    <g fill="currentColor" mask="url(#carMaskProfile)">
      <path d="M10 12 h 23 l -2 3 h -21 z" />
      <path d="M18 18 h 14 l -2 3 h -12 z" />
      <path d="M24 24 h 8 l -2 3 h -6 z" />
      <path d="M35 18 C33 17 34 14 36 12 C41 9 48 5 57 4 C66 3 76 6 83 12 C88 15 93 17 96 18 C98 19 99 21 99 24 C99 28 98 30 96 30 L36 30 C34 30 33 28 33 24 L35 18 Z" />
      <circle cx="46" cy="30" r="8" />
      <circle cx="84" cy="30" r="8" />
    </g>
  </svg>
);

const calculateNetPay = (grossStr, taxCode = '1257L', niCat = 'A', pensionPct = 5, hasStudentLoan = false) => {
  const gross = parseFloat(grossStr.replace(/[^0-9.-]+/g, "")) || 0;
  
  // Simplified UK Weekly Calculation
  const pension = gross * (pensionPct / 100);
  const taxablePay = Math.max(0, gross - pension);
  
  const weeklyPersonalAllowance = 242; // £12,570 / 52
  const tax = taxablePay > weeklyPersonalAllowance ? (taxablePay - weeklyPersonalAllowance) * 0.20 : 0;
  
  const niThreshold = 242;
  let ni = 0;
  if (niCat === 'A' && gross > niThreshold) {
    ni = (gross - niThreshold) * 0.08;
  }
  
  let studentLoan = 0;
  const slThreshold = 524;
  if (hasStudentLoan && gross > slThreshold) {
    studentLoan = (gross - slThreshold) * 0.09;
  }
  
  const net = gross - tax - ni - pension - studentLoan;
  
  const fmt = (val) => new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
  
  return {
    gross: fmt(gross),
    tax: fmt(tax),
    ni: fmt(ni),
    pension: fmt(pension),
    studentLoan: fmt(studentLoan),
    net: fmt(net)
  };
};

const mockShiftData = [
  { id: 'S-7701', date: '2026-06-07', start: '07:00 AM', end: '05:00 PM', hours: '10h 0m', trips: '8', gross: '£250.00', net: '£250.00', status: 'Completed' },
  { id: 'S-7702', date: '2026-06-06', start: '06:30 AM', end: '04:30 PM', hours: '10h 0m', trips: '7', gross: '£240.00', net: '£240.00', status: 'Completed' },
  { id: 'S-7703', date: '2026-06-05', start: '08:00 AM', end: '06:00 PM', hours: '10h 0m', trips: '9', gross: '£310.00', net: '£310.00', status: 'Completed' },
  { id: 'S-7704', date: '2026-06-04', start: '07:30 AM', end: '05:30 PM', hours: '10h 0m', trips: '6', gross: '£220.00', net: '£220.00', status: 'Completed' },
  { id: 'S-7705', date: '2026-06-03', start: '06:00 AM', end: '04:00 PM', hours: '10h 0m', trips: '8', gross: '£265.00', net: '£265.00', status: 'Completed' }
];

const MOCK_MAINTENANCE = [
  { id: 'MX-01', date: '2026-06-01', vehicle: 'S-Class W223', issue: 'Tire Pressure Sensor', severity: 'Low',      mechanic: 'J. Evans',    cost: '£65',   parts: '£40',   labour: '£25',  nextAction: 'None',           status: 'Resolved' },
  { id: 'MX-02', date: '2026-05-15', vehicle: 'S-Class W223', issue: 'Brake Pad Replacement', severity: 'Medium',   mechanic: 'A. Patel',    cost: '£380',  parts: '£240',  labour: '£140', nextAction: 'Check in 6mo',   status: 'Resolved' },
  { id: 'MX-03', date: '2026-04-22', vehicle: 'S-Class W223', issue: 'Routine Oil Change',    severity: 'Low',      mechanic: 'J. Evans',    cost: '£120',  parts: '£80',   labour: '£40',  nextAction: 'Oct 2026',       status: 'Resolved' },
  { id: 'MX-04', date: '2026-03-10', vehicle: 'S-Class W223', issue: 'Wiper Fluid Top-up',    severity: 'None',     mechanic: 'Driver Self', cost: '£12',   parts: '£12',   labour: '£0',   nextAction: 'As needed',      status: 'Resolved' },
  { id: 'MX-05', date: '2026-02-05', vehicle: 'S-Class W223', issue: 'Cabin Air Filter',      severity: 'Low',      mechanic: 'A. Patel',    cost: '£55',   parts: '£35',   labour: '£20',  nextAction: 'Feb 2027',       status: 'Resolved' },
  { id: 'MX-06', date: '2026-01-18', vehicle: 'S-Class W223', issue: 'Full Service',           severity: 'Routine',  mechanic: 'MB Dealer',   cost: '£1,200',parts: '£800',  labour: '£400', nextAction: 'Jan 2027',       status: 'Resolved' },
  { id: 'MX-07', date: '2025-12-03', vehicle: 'S-Class W223', issue: 'Tyre Rotation',          severity: 'Low',      mechanic: 'J. Evans',    cost: '£45',   parts: '£0',    labour: '£45',  nextAction: 'Jun 2026',       status: 'Resolved' },
  { id: 'MX-08', date: '2025-11-14', vehicle: 'S-Class W223', issue: 'Coolant Top-up',         severity: 'None',     mechanic: 'Driver Self', cost: '£8',    parts: '£8',    labour: '£0',   nextAction: 'As needed',      status: 'Resolved' },
  { id: 'MX-09', date: '2025-10-20', vehicle: 'S-Class W223', issue: 'Windshield Chip Repair', severity: 'Low',      mechanic: 'AutoGlass',   cost: '£75',   parts: '£30',   labour: '£45',  nextAction: 'Monitor',        status: 'Resolved' },
  { id: 'MX-10', date: '2025-09-05', vehicle: 'S-Class W223', issue: 'Battery Check & Replace',severity: 'High',     mechanic: 'MB Dealer',   cost: '£520',  parts: '£420',  labour: '£100', nextAction: 'Sep 2028',       status: 'Resolved' },
  { id: 'MX-11', date: '2025-08-12', vehicle: 'S-Class W223', issue: 'AC Re-gas',              severity: 'Medium',   mechanic: 'A. Patel',    cost: '£180',  parts: '£120',  labour: '£60',  nextAction: 'Aug 2027',       status: 'Resolved' },
  { id: 'MX-12', date: '2025-07-01', vehicle: 'S-Class W223', issue: 'Wheel Alignment',        severity: 'Low',      mechanic: 'J. Evans',    cost: '£90',   parts: '£0',    labour: '£90',  nextAction: 'Annual',         status: 'Resolved' },
];

const MOCK_FINANCIALS = [
  { id: 'PAY-01', period: 'May 2026',  shifts: 22, trips: 187, gross: '$5,610', commission: '60%', deduction: '$760', tax: '$230', net: '$4,620', status: 'Paid',    paid: '2026-06-01' },
  { id: 'PAY-02', period: 'Apr 2026',  shifts: 20, trips: 171, gross: '$5,125', commission: '60%', deduction: '$640', tax: '$210', net: '$4,275', status: 'Paid',    paid: '2026-05-01' },
  { id: 'PAY-03', period: 'Mar 2026',  shifts: 21, trips: 179, gross: '$4,750', commission: '60%', deduction: '$590', tax: '$180', net: '$3,980', status: 'Paid',    paid: '2026-04-01' },
  { id: 'PAY-04', period: 'Feb 2026',  shifts: 19, trips: 163, gross: '$5,625', commission: '60%', deduction: '$700', tax: '$225', net: '$4,700', status: 'Paid',    paid: '2026-03-01' },
  { id: 'PAY-05', period: 'Jan 2026',  shifts: 22, trips: 188, gross: '$4,938', commission: '60%', deduction: '$605', tax: '$195', net: '$4,138', status: 'Paid',    paid: '2026-02-01' },
  { id: 'PAY-06', period: 'Dec 2025',  shifts: 18, trips: 154, gross: '$4,312', commission: '60%', deduction: '$530', tax: '$168', net: '$3,614', status: 'Paid',    paid: '2026-01-01' },
  { id: 'PAY-07', period: 'Nov 2025',  shifts: 20, trips: 168, gross: '$5,040', commission: '60%', deduction: '$630', tax: '$200', net: '$4,210', status: 'Paid',    paid: '2025-12-01' },
  { id: 'PAY-08', period: 'Oct 2025',  shifts: 21, trips: 180, gross: '$4,860', commission: '60%', deduction: '$605', tax: '$190', net: '$4,065', status: 'Paid',    paid: '2025-11-01' },
  { id: 'PAY-09', period: 'Sep 2025',  shifts: 19, trips: 162, gross: '$4,374', commission: '60%', deduction: '$546', tax: '$170', net: '$3,658', status: 'Paid',    paid: '2025-10-01' },
  { id: 'PAY-10', period: 'Aug 2025',  shifts: 22, trips: 190, gross: '$5,700', commission: '60%', deduction: '$710', tax: '$228', net: '$4,762', status: 'Paid',    paid: '2025-09-01' },
  { id: 'PAY-11', period: 'Jul 2025',  shifts: 23, trips: 196, gross: '$5,880', commission: '60%', deduction: '$735', tax: '$236', net: '$4,909', status: 'Paid',    paid: '2025-08-01' },
  { id: 'PAY-12', period: 'Jun 2025',  shifts: 20, trips: 172, gross: '$5,160', commission: '60%', deduction: '$645', tax: '$206', net: '$4,309', status: 'Paid',    paid: '2025-07-01' },
];

const MOCK_PAST_TRIPS = [
  { id: '#VELO-9841', channel: 'Velo Black', status: 'Completed', date: '2026-06-07', route: 'LHR T5 → The Savoy',          passenger: 'J. Hartmann',    client: 'J. Hartmann',    vehicle: 'S-Class W223',   driver: null, dist: '23.4mi', duration: '48m', timeToFree: '48m', fare: '$145', tip: '$20', progress: 100, rating: '5.0' },
  { id: '#VELO-9840', channel: 'Velo Core',  status: 'Completed', date: '2026-06-07', route: 'Mayfair → LGW',              passenger: 'S. Whitmore',    client: 'S. Whitmore',    vehicle: 'RR Phantom',     driver: null, dist: '31.2mi', duration: '62m', timeToFree: '62m', fare: '$180', tip: '$15', progress: 100, rating: '5.0' },
  { id: '#VELO-9838', channel: 'Pool',       status: 'Completed', date: '2026-06-06', route: 'Soho → LHR T2',              passenger: 'R. Chen',        client: 'R. Chen',        vehicle: 'S-Class W223',   driver: null, dist: '19.8mi', duration: '55m', timeToFree: '55m', fare: '$125', tip: '$10', progress: 100, rating: '5.0' },
  { id: '#VELO-9835', channel: 'Velo Black', status: 'Completed', date: '2026-06-06', route: 'The Shard → O2 Arena',       passenger: 'R. Goldman',     client: 'Goldman Sachs',  vehicle: 'RR Ghost',       driver: null, dist: '9.1mi',  duration: '28m', timeToFree: '28m', fare: '$85',  tip: '$0',  progress: 100, rating: '4.9' },
  { id: '#VELO-9831', channel: 'Velo Core',  status: 'Completed', date: '2026-06-05', route: 'Canary Wharf → Mayfair',     passenger: 'T. Osei',        client: 'T. Osei',        vehicle: 'Bentley Mulsanne',driver: null, dist: '7.4mi', duration: '22m', timeToFree: '22m', fare: '$65',  tip: '$10', progress: 100, rating: '5.0' },
  { id: '#VELO-9828', channel: 'Velo Black', status: 'Completed', date: '2026-06-05', route: 'Heathrow → Belgravia',       passenger: 'A. Rossi',       client: 'A. Rossi',       vehicle: 'RR Phantom',     driver: null, dist: '20.5mi', duration: '50m', timeToFree: '50m', fare: '$135', tip: '$25', progress: 100, rating: '5.0' },
  { id: '#VELO-9824', channel: 'Pool',       status: 'Completed', date: '2026-06-04', route: 'Chelsea → City of London',   passenger: 'P. Nielsen',     client: 'P. Nielsen',     vehicle: 'S-Class W223',   driver: null, dist: '5.8mi',  duration: '18m', timeToFree: '18m', fare: '$55',  tip: '$0',  progress: 100, rating: '4.8' },
  { id: '#VELO-9820', channel: 'Velo Core',  status: 'Completed', date: '2026-06-04', route: 'Kensington → Knightsbridge', passenger: 'R. Al-Farsi',    client: 'R. Al-Farsi',    vehicle: 'Range Rover SV', driver: null, dist: '2.1mi',  duration: '12m', timeToFree: '12m', fare: '$45',  tip: '$5',  progress: 100, rating: '5.0' },
  { id: '#VELO-9815', channel: 'Velo Black', status: 'Completed', date: '2026-06-03', route: 'Paddington → Shoreditch',    passenger: 'M. Yamamoto',    client: 'M. Yamamoto',    vehicle: 'i7 xDrive',      driver: null, dist: '6.2mi',  duration: '25m', timeToFree: '25m', fare: '$60',  tip: '$0',  progress: 100, rating: '5.0' },
  { id: '#VELO-9810', channel: 'Velo Core',  status: 'Completed', date: '2026-06-03', route: 'Gatwick → Kensington',       passenger: 'C. Leveque',     client: 'C. Leveque',     vehicle: 'S-Class W223',   driver: null, dist: '35.6mi', duration: '75m', timeToFree: '75m', fare: '$210', tip: '$30', progress: 100, rating: '5.0' },
  { id: '#VELO-9804', channel: 'Velo Core',  status: 'Completed', date: '2026-06-02', route: 'Islington → LHR T4',         passenger: 'D. Kumar',       client: 'D. Kumar',       vehicle: 'Bentley Mulsanne',driver: null, dist: '22.1mi', duration: '58m', timeToFree: '58m', fare: '$140', tip: '$0',  progress: 100, rating: '4.9' },
  { id: '#VELO-9799', channel: 'Pool',       status: 'Completed', date: '2026-06-02', route: 'Waterloo → Westminster',     passenger: "B. O'Sullivan",  client: "B. O'Sullivan",  vehicle: 'V-Class',        driver: null, dist: '1.8mi',  duration: '10m', timeToFree: '10m', fare: '$40',  tip: '$10', progress: 100, rating: '5.0' },
];

const ChauffeurProfileModal = ({ chauffeur, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAssignJobModalOpen, setIsAssignJobModalOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  
  const { openSummaryModal } = useEntityLinker();

  if (!chauffeur) return null;

  if (isEditing) {
    return (
      <OnboardChauffeurModal 
        isOpen={isEditing} 
        onClose={() => setIsEditing(false)} 
        data={chauffeur} 
        isEditMode={true} 
      />
    );
  }

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      {isAssignJobModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setIsAssignJobModalOpen(false)}>
          <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--color-gold)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--color-gold)', marginTop: 0, marginBottom: '16px', letterSpacing: '1px' }}>ASSIGN UNASSIGNED JOB</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>JOB-8902</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>LHR T5 to The Savoy</div>
                </div>
                <button className="u-modal-btn-outline" onClick={() => { alert('Job Assigned to ' + chauffeur.name); setIsAssignJobModalOpen(false); }}>ASSIGN</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>JOB-8905</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>O2 Arena to Mayfair</div>
                </div>
                <button className="u-modal-btn-outline" onClick={() => { alert('Job Assigned to ' + chauffeur.name); setIsAssignJobModalOpen(false); }}>ASSIGN</button>
              </div>
            </div>
            <button className="u-modal-btn-primary" onClick={() => setIsAssignJobModalOpen(false)} style={{marginTop: '24px', width: '100%'}}>CANCEL</button>
          </div>
        </div>
      )}

      {selectedTrip && (
        <LiveTripModal trip={selectedTrip} onClose={() => setSelectedTrip(null)} />
      )}

      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Top Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">CHAUFFEUR PROFILE: {chauffeur.id}</h2>
          </div>
          <div className="u-modal-header-actions">
            <button className="btn-primary" onClick={() => openModal(<OnboardChauffeurModal isOpen={true} onClose={() => {}} data={chauffeur} isEditMode={true} />)}>EDIT DRIVER</button>
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="u-modal-hero">
          <div className="u-modal-hero-top">
            <div className="u-modal-hero-avatar-container" style={{ backgroundImage: chauffeur?.image ? `url(${chauffeur.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!chauffeur.image && <User size={40} color="rgba(255,255,255,0.2)" />}
            </div>
            
            <div className="u-modal-hero-info">
              <h1 className="u-modal-hero-title">{chauffeur.name}</h1>
              <p className="u-modal-hero-subtitle">VEO-ID: {chauffeur.id} • <span style={{color: 'var(--color-gold)'}}>{chauffeur.status}</span></p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="u-modal-btn-edit">
                <MessageSquare size={14} /> MESSAGE
              </button>
              <button className="u-modal-btn-save" onClick={() => setIsAssignJobModalOpen(true)}>
                <Briefcase size={14} /> ASSIGN JOB
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'live_job' ? 'active' : ''}`} onClick={() => setActiveTab('live_job')}>LIVE JOB</button>
          <button className={`u-modal-tab ${activeTab === 'shift_log' ? 'active' : ''}`} onClick={() => setActiveTab('shift_log')}>SHIFT LOG</button>
          <button className={`u-modal-tab ${activeTab === 'wages' ? 'active' : ''}`} onClick={() => setActiveTab('wages')}>WAGES</button>
          <button className={`u-modal-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>MAINTENANCE</button>
          <button className={`u-modal-tab ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')}>FINANCIALS</button>
          <button className={`u-modal-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>ENGAGEMENT</button>
        </div>

        {/* Body Content */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              <div className="cp-grid-2-col">
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="u-modal-section">
                    <div className="u-modal-section-header">
                      <User size={18} />
                      Personal Identity
                    </div>
                    
                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">FULL NAME</span>
                        <span className="cp-data-value">{chauffeur.name}</span>
                      </div>
                    </div>

                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">DATE OF BIRTH</span>
                        <span className="cp-data-value">12 SEP 1972</span>
                      </div>
                    </div>

                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">MOBILE NUMBER</span>
                        <span className="cp-data-value">+44 20 7946 0000</span>
                      </div>
                      <span className="cp-update-link">UPDATE</span>
                    </div>

                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">EMAIL ADDRESS</span>
                        <span className="cp-data-value">j.sterling@velo-executive.com</span>
                      </div>
                      <span className="cp-update-link">UPDATE</span>
                    </div>

                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">RESIDENTIAL ADDRESS</span>
                        <span className="cp-data-value">12 Mayfair Gardens, London, W1J 7JZ</span>
                      </div>
                    </div>
                  </div>

                  <div className="u-modal-section">
                    <div className="u-modal-section-header gold">
                      <Asterisk size={18} />
                      Emergency Contact
                    </div>
                    
                    <div className="cp-inner-grid">
                      <div className="cp-data-group">
                        <span className="cp-data-label">CONTACT NAME</span>
                        <span className="cp-data-value">Eleanor Sterling</span>
                      </div>
                      <div className="cp-data-group">
                        <span className="cp-data-label">CONTACT PHONE</span>
                        <span className="cp-data-value">+44 7700 900000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="u-modal-section">
                    <div className="u-modal-section-header gold">
                      <ShieldCheck size={18} />
                      Compliance & Credentials
                    </div>

                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">DRIVING LICENSE EXPIRY</span>
                        <span className="cp-data-value">14 NOV 2026</span>
                      </div>
                      <span className="cp-update-link">UPDATE</span>
                    </div>

                    <div className="cp-data-row">
                      <div className="cp-data-group">
                        <span className="cp-data-label">PCO LICENSE EXPIRY</span>
                        <span className="cp-data-value">22 JAN 2027</span>
                      </div>
                      <span className="cp-update-link">UPDATE</span>
                    </div>

                    <div className="cp-data-row" style={{ borderBottom: 'none' }}>
                      <div className="cp-data-group">
                        <span className="cp-data-label">NATIONAL INSURANCE NUMBER</span>
                        <span className="cp-data-value">QQ 12 34 56 C</span>
                      </div>
                    </div>

                    <div className="cp-data-row" style={{ borderBottom: 'none' }}>
                      <div className="cp-data-group">
                        <span className="cp-data-label">DBS/BACKGROUND CHECK REF</span>
                        <span className="cp-data-value">
                          DBS-9900-XJ <span className="cp-badge-dbs">MANDATORY DBS</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="u-modal-section">
                    <div className="u-modal-section-header gold">
                      <Wallet size={18} />
                      Financial Framework
                    </div>

                    <div className="cp-inner-grid">
                      <div className="cp-data-group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px' }}>
                        <span className="cp-data-label">CONTRACT TYPE</span>
                        <span className="cp-data-value" style={{ color: 'var(--color-gold)' }}>Revenue Share</span>
                      </div>
                      <div className="cp-data-group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px' }}>
                        <span className="cp-data-label">VALUE FIELD (%)</span>
                        <span className="cp-data-value">60.00</span>
                      </div>
                    </div>

                    <div className="cp-data-group" style={{ marginTop: '16px' }}>
                      <span className="cp-data-label">SORT CODE</span>
                      <span className="cp-data-value">18-XX-XX</span>
                    </div>

                    <div className="cp-data-group" style={{ marginTop: '16px' }}>
                      <span className="cp-data-label">ACCOUNT NUMBER</span>
                      <span className="cp-data-value">****4490</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Metrics */}
              <div className="cp-metrics-footer">
                <div className="cp-metric-card">
                  <span className="cp-metric-label">RATING</span>
                  <div className="cp-metric-value">
                    4.98<span className="cp-metric-sub">★</span>
                  </div>
                </div>
                <div className="cp-metric-card">
                  <span className="cp-metric-label">JOBS COMPLETED</span>
                  <div className="cp-metric-value">2,412</div>
                </div>
                <div className="cp-metric-card">
                  <span className="cp-metric-label">VELO TENURE</span>
                  <div className="cp-metric-value">
                    4.2<span className="cp-metric-sub-text">y</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === 'live_job' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
              {/* Live Banner */}
              <div style={{ flex: '0 0 auto', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '32px', flexWrap: 'wrap' }}>
                <div>
                  <div style={{ color: 'var(--color-gold)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', marginBottom: '6px' }}>LIVE TRIP PROGRESS</div>
                  <div style={{ fontSize: '22px', fontWeight: 'bold', color: '#fff' }}>LHR T5 <span style={{ color: 'var(--color-text-muted)' }}>→</span> The Savoy</div>
                </div>
                <div style={{ display: 'flex', gap: '32px', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>STATUS</div><div style={{ color: '#34c759', fontWeight: 'bold', fontSize: '13px' }}>● ON ROUTE — ETA 14 MIN</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>PASSENGER</div><div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>J. Hartmann</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>VEHICLE</div><div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>S-Class W223 · LK23 XVP</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>FARE</div><div style={{ color: 'var(--color-gold)', fontWeight: 'bold', fontSize: '13px' }}>$145.00</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>DISTANCE</div><div style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>23.4 mi</div></div>
                </div>
              </div>
              {/* Universal Trip Table — identical to Operations Hub */}
              <UniversalTripTable
                trips={MOCK_PAST_TRIPS.map(t => ({ ...t, driver: t.driver || chauffeur.name }))}
                onTripClick={trip => setSelectedTrip(trip)}
                onClientClick={null}
                onVehicleClick={null}
                showChannel={true}
                emptyMessage="No trip history for this chauffeur."
              />
            </div>
          )}

          {activeTab === 'shift_log' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
              <div style={{ flex: '0 0 auto', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--color-gold)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', alignSelf: 'flex-start', marginTop: '2px' }}>CURRENT SHIFT</div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>START TIME</div><div style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>06:30 AM</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>HOURS ACTIVE</div><div style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>4h 15m</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>TRIPS TODAY</div><div style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>6</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>TODAY EARNINGS</div><div style={{ fontSize: '20px', color: '#34c759', fontWeight: 'bold' }}>$247.00</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>BREAKS TAKEN</div><div style={{ fontSize: '20px', color: '#fff', fontWeight: 'bold' }}>1 × 15m</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>STATUS</div><div style={{ fontSize: '18px', color: '#34c759', fontWeight: 'bold' }}>ON-SHIFT</div></div>
              </div>
              <div className="u-table-wrapper">
                <table className="u-modal-table">
                  <thead>
                    <tr>
                      <th style={{width:'10%', textAlign:'left'}}>SHIFT ID</th>
                      <th style={{width:'12%', textAlign:'left'}}>DATE</th>
                      <th style={{width:'12%', textAlign:'left'}}>START</th>
                      <th style={{width:'12%', textAlign:'left'}}>END</th>
                      <th style={{width:'10%', textAlign:'left'}}>HOURS</th>
                      <th style={{width:'10%', textAlign:'left'}}>TRIPS</th>
                      <th style={{width:'12%', textAlign:'left'}}>GROSS</th>
                      <th style={{width:'12%', textAlign:'left'}}>NET PAY</th>
                      <th style={{width:'10%', textAlign:'left'}}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockShiftData.map((s, i) => (
                      <tr key={i} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                        title: 'Shift Detail', subtitle: s.id, status: s.status, icon: 'activity',
                        primaryMetric: { label: 'NET EARNINGS', value: s.net },
                        fields: [
                          { label: 'Date', value: s.date }, { label: 'Start Time', value: s.start },
                          { label: 'End Time', value: s.end }, { label: 'Active Hours', value: s.hours },
                          { label: 'Total Trips', value: s.trips },
                          { label: 'Gross Earnings', value: s.gross }
                        ]
                      })}>
                        <td className="col-muted">{s.id}</td>
                        <td>{s.date}</td>
                        <td>{s.start}</td>
                        <td>{s.end}</td>
                        <td style={{fontWeight:'600'}}>{s.hours}</td>
                        <td style={{color:'var(--color-gold)'}}>{s.trips}</td>
                        <td>{s.gross}</td>
                        <td style={{color:'#34c759', fontWeight:'700'}}>{s.net}</td>
                        <td><span className="cc-status-badge status-completed">{s.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'maintenance' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
              <div style={{ flex: '0 0 auto', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--color-gold)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', alignSelf: 'flex-start', marginTop: '2px' }}>VEHICLE HEALTH INDEX</div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>HEALTH SCORE</div><div style={{ fontSize: '32px', color: '#34c759', fontWeight: 'bold', lineHeight: 1 }}>98%</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>ASSIGNED VEHICLE</div><div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>Mercedes-Benz S-Class W223</div><div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>LK23 XVP · Black</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>NEXT SERVICE</div><div style={{ fontSize: '14px', color: 'var(--color-gold)', fontWeight: '600' }}>4,200 mi</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>TOTAL SPEND (YTD)</div><div style={{ fontSize: '14px', color: '#fff', fontWeight: '600' }}>£2,760</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>OPEN ALERTS</div><div style={{ fontSize: '14px', color: '#34c759', fontWeight: '600' }}>None</div></div>
              </div>
              <div className="u-table-wrapper">
                <table className="u-modal-table">
                  <thead>
                    <tr>
                      <th style={{width:'15%'}}>DATE</th>
                      <th style={{width:'30%'}}>VEHICLE</th>
                      <th style={{width:'30%'}}>ISSUE</th>
                      <th style={{width:'15%'}}>TOTAL COST</th>
                      <th style={{width:'10%'}}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_MAINTENANCE.map((m, i) => {
                      const partsCost = parseFloat(m.parts.replace(/[^0-9.-]+/g,"")) || 0;
                      const labourCost = parseFloat(m.labour.replace(/[^0-9.-]+/g,"")) || 0;
                      const totalCost = partsCost + labourCost;
                      const formattedCost = new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(totalCost);

                      return (
                        <tr key={i} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                          title: 'Maintenance Detail', subtitle: m.id, status: m.status, icon: 'settings',
                          primaryMetric: { label: 'TOTAL COST', value: formattedCost },
                          fields: [
                            { label: 'Date', value: m.date }, { label: 'Vehicle', value: m.vehicle },
                            { label: 'Reported Issue', value: m.issue }, { label: 'Severity', value: m.severity },
                            { label: 'Mechanic', value: m.mechanic }, { label: 'Parts Cost', value: m.parts },
                            { label: 'Labour Cost', value: m.labour }, { label: 'Next Action', value: m.nextAction }
                          ]
                        })}>
                          <td>{m.date}</td>
                          <td style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}} onClick={e => e.stopPropagation()}><EntityLink type="Vehicle">{m.vehicle}</EntityLink></td>
                          <td style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{m.issue}</td>
                          <td style={{fontWeight:'600'}}>{formattedCost}</td>
                          <td><span className="cc-status-badge status-completed">{m.status}</span></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'financials' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '16px', minHeight: 0 }}>
              <div style={{ flex: '0 0 auto', backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px 24px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', gap: '40px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ color: 'var(--color-gold)', fontSize: '10px', fontWeight: 'bold', letterSpacing: '1.5px', alignSelf: 'flex-start', marginTop: '2px' }}>CURRENT MONTH PAYOUT</div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>ESTIMATED TOTAL</div><div style={{ fontSize: '28px', color: '#fff', fontWeight: 'bold', lineHeight: 1 }}>$4,850.00</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>GROSS REVENUE</div><div style={{ fontSize: '18px', color: '#ccc', fontWeight: '600' }}>$8,083.00</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>COMMISSION RATE</div><div style={{ fontSize: '18px', color: 'var(--color-gold)', fontWeight: '600' }}>60%</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>DEDUCTIONS</div><div style={{ fontSize: '18px', color: '#f59e0b', fontWeight: '600' }}>$896.00</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>TAX WITHHELD</div><div style={{ fontSize: '18px', color: '#888', fontWeight: '600' }}>$337.00</div></div>
                <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>NEXT DISBURSEMENT</div><div style={{ fontSize: '16px', color: '#34c759', fontWeight: '600' }}>July 1, 2026</div></div>
              </div>
              <div className="u-table-wrapper">
                <table className="u-modal-table">
                  <thead>
                    <tr>
                      <th style={{width:'9%'}}>REF</th>
                      <th style={{width:'10%'}}>PERIOD</th>
                      <th style={{width:'7%'}}>SHIFTS</th>
                      <th style={{width:'7%'}}>TRIPS</th>
                      <th style={{width:'10%'}}>GROSS</th>
                      <th style={{width:'9%'}}>COMMISSION</th>
                      <th style={{width:'9%'}}>DEDUCTION</th>
                      <th style={{width:'8%'}}>TAX</th>
                      <th style={{width:'10%'}}>NET PAY</th>
                      <th style={{width:'9%'}}>DATE PAID</th>
                      <th style={{width:'8%'}}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_FINANCIALS.map((f, i) => (
                      <tr key={i} className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                        title: 'Financial Payout Detail', subtitle: f.id, status: f.status, icon: 'financial',
                        primaryMetric: { label: 'NET PAY', value: f.net },
                        fields: [
                          { label: 'Period', value: f.period }, { label: 'Shifts Logged', value: f.shifts },
                          { label: 'Total Trips', value: f.trips }, { label: 'Gross Revenue', value: f.gross },
                          { label: 'Commission Rate', value: f.commission }, { label: 'Deductions', value: f.deduction },
                          { label: 'Tax Withheld', value: f.tax }, { label: 'Date Paid', value: f.paid }
                        ]
                      })}>
                        <td className="col-muted">{f.id}</td>
                        <td style={{fontWeight:'600'}}>{f.period}</td>
                        <td>{f.shifts}</td>
                        <td>{f.trips}</td>
                        <td>{f.gross}</td>
                        <td style={{color:'var(--color-gold)'}}>{f.commission}</td>
                        <td className="col-warn">{f.deduction}</td>
                        <td className="col-muted">{f.tax}</td>
                        <td style={{color:'#34c759', fontWeight:'700'}}>{f.net}</td>
                        <td className="col-muted">{f.paid}</td>
                        <td><span className="cc-status-badge status-completed">{f.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <div className="u-modal-tab-content" style={{ padding: 0 }}>
              <ConciergeFeed clientName={chauffeur?.name || "Chauffeur"} />
            </div>
          )}

          {activeTab === 'wages' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '20px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                <h3 style={{ color: 'var(--color-gold)', margin: '0 0 16px 0', fontSize: '14px', letterSpacing: '1px' }}>PAYROLL CONFIGURATION</h3>
                <div style={{ display: 'flex', gap: '40px', flexWrap: 'wrap' }}>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>BASE RATE</div><div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>£25.00/hr</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>TAX CODE</div><div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>1257L</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>NI CATEGORY</div><div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>A</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>PENSION</div><div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>5%</div></div>
                  <div><div style={{ fontSize: '10px', color: 'var(--color-text-muted)', letterSpacing: '1px' }}>STUDENT LOAN</div><div style={{ fontSize: '18px', color: '#fff', fontWeight: 'bold' }}>None</div></div>
                </div>
              </div>

              <div className="u-table-wrapper">
                <table className="u-modal-table">
                  <thead>
                    <tr>
                      <th style={{width:'15%', textAlign:'left'}}>PERIOD</th>
                      <th style={{width:'15%', textAlign:'left'}}>GROSS PAY</th>
                      <th style={{width:'15%', textAlign:'left'}}>TAX (PAYE)</th>
                      <th style={{width:'15%', textAlign:'left'}}>NAT. INS.</th>
                      <th style={{width:'15%', textAlign:'left'}}>PENSION</th>
                      <th style={{width:'25%', textAlign:'left'}}>NET PAY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockShiftData.slice(0, 3).map((shift, i) => {
                      const payroll = calculateNetPay(shift.gross);
                      return (
                        <tr key={i} className="cc-card-row">
                          <td style={{fontWeight:'bold'}}>{shift.date}</td>
                          <td style={{color: '#fff'}}>{payroll.gross}</td>
                          <td style={{color: '#ef4444'}}>-{payroll.tax}</td>
                          <td style={{color: '#f59e0b'}}>-{payroll.ni}</td>
                          <td style={{color: '#3b82f6'}}>-{payroll.pension}</td>
                          <td style={{color: '#34c759', fontWeight: 'bold', fontSize: '16px'}}>{payroll.net}</td>
                        </tr>
                      );
                    })}
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

export default ChauffeurProfileModal;
