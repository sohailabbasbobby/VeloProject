import React, { useState, useMemo } from 'react';
import { 
  Car, CarFront, UserCircle, Briefcase, Key, Users, Contact, CalendarDays, 
  LineChart, Paintbrush, Gauge, Zap, Calendar, UserCheck, UserX, CheckCircle, Bot,
  Settings, X, Globe, MapPin, PieChart
} from 'lucide-react';
import LiveTripModal from './LiveTripModal';
import ChauffeurHub from './ChauffeurHub';
import CorporateClientHub from './CorporateClientHub';
import PrivateClientRegistry from './PrivateClientRegistry';
import OperationalStaffDirectory from './OperationalStaffDirectory';
import WorkforceScheduler from './WorkforceScheduler';
import FinancialDashboard from './FinancialDashboard';
import WhiteLabelPortal from './WhiteLabelPortal';
import UniversalTripTable from './UniversalTripTable';
import './CommandCenter.css';
import { MOCK_CHAUFFEURS, MOCK_CORP_CLIENTS, MOCK_PRIV_CLIENTS, MOCK_VEHICLES, MOCK_ACTIVE_TASKS as activeTasks, MOCK_LEDGER } from '../data/mockDatabase';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import FleetVault from './FleetVault';

const LiveFleetMapModal = React.lazy(() => import('./LiveFleetMapModal'));

const FastCarIcon = ({ size = 20, className = "" }) => (
  <svg width={size} height={size * 0.4} viewBox="0 0 100 40" className={className} xmlns="http://www.w3.org/2000/svg">
    <defs>
      <mask id="carMask">
        <rect width="100" height="40" fill="white" />
        <path d="M53 6 L55 13 L42 13 C45 10 49 7 53 6 Z" fill="black" />
        <path d="M56 6 C63 6 72 9 77 13 L58 13 Z" fill="black" />
        <circle cx="46" cy="30" r="4" fill="black" />
        <circle cx="84" cy="30" r="4" fill="black" />
        <circle cx="46" cy="30" r="2" fill="white" />
        <circle cx="84" cy="30" r="2" fill="white" />
      </mask>
    </defs>
    <g fill="currentColor" mask="url(#carMask)">
      <path d="M10 12 h 23 l -2 3 h -21 z" />
      <path d="M18 18 h 14 l -2 3 h -12 z" />
      <path d="M24 24 h 8 l -2 3 h -6 z" />
      <path d="M35 18 C33 17 34 14 36 12 C41 9 48 5 57 4 C66 3 76 6 83 12 C88 15 93 17 96 18 C98 19 99 21 99 24 C99 28 98 30 96 30 L36 30 C34 30 33 28 33 24 L35 18 Z" />
      <circle cx="46" cy="30" r="8" />
      <circle cx="84" cy="30" r="8" />
    </g>
  </svg>
);

const CommandCenter = ({ onNavigate }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ACTIVE');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapFocusedTrip, setMapFocusedTrip] = useState(null);
  const [activeSubView, setActiveSubView] = useState('operations');

  const { openDriverProfile, openClientProfile, openVehicleProfile } = useEntityLinker();

  // Legacy mock-link handler (kept for map modal) – now opens real profiles
  const handleLinkClick = (e, type, value) => {
    e.stopPropagation();
    if (type === 'Driver') openDriverProfile(value);
    else if (type === 'Client') openClientProfile(value);
    else if (type === 'Vehicle') openVehicleProfile(value);
  };

  const primaryNav = [
    { id: 'fleet', icon: <CarFront size={14} />, label: 'Fleet Asset Management', active: activeSubView === 'fleet' },
    { id: 'chauffeurs', icon: <UserCircle size={14} />, label: 'Chauffeur Personnel Hub', active: activeSubView === 'chauffeurs' },
    { id: 'accounts', icon: <Briefcase size={14} />, label: 'Corporate Accounts & Billing', active: activeSubView === 'accounts' },
    { id: 'private_clients', icon: <Key size={14} />, label: 'Private Client Registry', active: activeSubView === 'private_clients' }
  ];


  const secondaryNav = [
    { id: 'staff', icon: <Contact size={14} />, label: 'Operational Staff Directory' },
    { id: 'roster', icon: <CalendarDays size={14} />, label: 'Workforce Roster & Scheduling' },
    { id: 'analytics', icon: <LineChart size={14} className="text-gold" />, label: 'Financial Intelligence & Compliance' },
    { id: 'brand', icon: <Paintbrush size={14} />, label: 'Brand Identity & White Labeling' }
  ];

  const allTasks = [
    { id: '#VELO-9842', channel: 'Velo Black', status: 'On Trip',              driver: 'James Smith',  vehicle: 'RR Phantom (KX21)',  passenger: 'J.P. Morgan Exec',   client: 'J.P. Morgan',    route: 'Heathrow T5 to Mayfair',          progress: 75,  timeToFree: '12m'    },
    { id: '#VELO-9843', channel: 'Pool',       status: 'On the way to Pickup', driver: 'Sarah Jenkins', vehicle: 'Bentley Bentayga',   passenger: 'Lady V. Ashworth',   client: 'Private (VIP)',  route: 'Gatwick South to The Shard',      progress: 15,  timeToFree: '1h 15m' },
    { id: '#VELO-9844', channel: 'Velo Core',  status: 'Completed',            driver: 'Marcus F.',    vehicle: 'S-Class (Black)',    passenger: 'R. Goldman',         client: 'Goldman Sachs',  route: 'Luton Private to Canary Wharf',   progress: 100, timeToFree: 'Now'    },
    { id: '#VELO-9845', channel: 'Pool',       status: 'Waiting for customer', driver: 'David O.',     vehicle: 'Range Rover SV',    passenger: 'M. Soho',            client: 'Soho House',     route: 'Soho House to Heathrow T2',       progress: 40,  timeToFree: '45m'    },
    { id: '#VELO-9846', channel: 'Velo Core',  status: 'Unassigned',           driver: 'Unassigned',   vehicle: 'V-Class (Silver)',   passenger: '—',                  client: 'Internal',       route: 'Service Center Return',           progress: 0,   timeToFree: 'EST 48h'},
    { id: '#VELO-9847', channel: 'Pool',       status: 'Assigned',             driver: 'Elena R.',     vehicle: 'i7 xDrive',          passenger: 'C. Lennox',          client: 'Private',        route: 'St. Pancras to Kensington',       progress: 0,   timeToFree: '2h 30m' },
    { id: '#VELO-9848', channel: 'Velo Black', status: 'On Trip',              driver: 'Tom W.',       vehicle: 'RR Ghost',           passenger: 'D. Morgan Stanley',  client: 'Morgan Stanley', route: 'City Airport to O2 Arena',        progress: 90,  timeToFree: '4m'     },
    { id: '#VELO-9849', channel: 'Velo Core',  status: 'Arrived at pickup',    driver: 'A. Patel',     vehicle: 'S-Class (Blue)',     passenger: 'Sir B. Harrington',  client: 'Private (VIP)',  route: 'Battersea to Heathrow T5',        progress: 25,  timeToFree: '22m'    },
    { id: '#VELO-9850', channel: 'Pool',       status: 'Unassigned',           driver: 'TBD',          vehicle: 'TBD',                passenger: '—',                  client: 'Corporate X',    route: 'Canary Wharf to Soho',            progress: 0,   timeToFree: 'N/A'    },
  ];

  // Derive counts dynamically
  const counts = useMemo(() => {
    return {
      active: allTasks.filter(t => ['On the way to Pickup', 'Arrived at pickup', 'Waiting for customer', 'On Trip'].includes(t.status)).length,
      upcoming: allTasks.filter(t => t.status === 'Assigned' || t.status === 'Unassigned').length, // Mock logic
      assigned: allTasks.filter(t => t.status !== 'Unassigned').length,
      unassigned: allTasks.filter(t => t.status === 'Unassigned').length,
      completed: allTasks.filter(t => t.status === 'Completed').length,
    };
  }, [allTasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'ALL') return allTasks;
    if (activeFilter === 'ACTIVE') return allTasks.filter(t => ['On the way to Pickup', 'Arrived at pickup', 'Waiting for customer', 'On Trip'].includes(t.status));
    if (activeFilter === 'UPCOMING') return allTasks.filter(t => t.status === 'Assigned' || t.status === 'Unassigned');
    if (activeFilter === 'ASSIGNED') return allTasks.filter(t => t.status !== 'Unassigned');
    if (activeFilter === 'UNASSIGNED') return allTasks.filter(t => t.status === 'Unassigned');
    if (activeFilter === 'COMPLETED') return allTasks.filter(t => t.status === 'Completed');
    return allTasks;
  }, [activeFilter, allTasks]);

  const activeTasksForMap = useMemo(() => allTasks.filter(t => ['On the way to Pickup', 'Arrived at pickup', 'Waiting for customer', 'On Trip'].includes(t.status)), [allTasks]);

  const handleNavClick = (id) => {
    if (activeSubView === id) {
      setActiveSubView('operations'); // Toggle back to main view
    } else {
      setActiveSubView(id);
    }
  };

  return (
    <div className="command-center-layout">
      {/* Row 1: Unified Scaling Navigation Toolbar */}
      <div className="cc-nav-toolbar">
        {primaryNav.map((item) => (
          <button key={item.id} className={`cc-toolbar-btn ${item.active ? 'active' : ''}`} onClick={() => handleNavClick(item.id)}>
            <span className="cc-toolbar-icon">{item.icon}</span>
            <span className="cc-toolbar-label">{item.label}</span>
          </button>
        ))}
        <button className="cc-toolbar-btn" onClick={() => setIsDrawerOpen(true)}>
          <span className="cc-toolbar-icon"><Settings size={14} /></span>
          <span className="cc-toolbar-label">System Admin</span>
        </button>
      </div>

      {/* Row 2: Operational Metrics (Pulse Bar) */}
      {activeSubView === 'operations' && (
        <>
          <div className="cc-metrics-row">
        <button className={`cc-pulse-card ${activeFilter === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveFilter('ACTIVE')}>
           <div className="cc-pulse-percent">
             <CarFront size={20} className="cc-pulse-icon" />
             {counts.active}
           </div>
           <div className="cc-pulse-label">ACTIVE TRIPS</div>
        </button>
        <button className={`cc-pulse-card ${activeFilter === 'UPCOMING' ? 'active' : ''}`} onClick={() => setActiveFilter('UPCOMING')}>
           <div className="cc-pulse-percent">
             <Calendar size={20} className="cc-pulse-icon" />
             {counts.upcoming}
           </div>
           <div className="cc-pulse-label">UPCOMING</div>
        </button>
        <button className={`cc-pulse-card ${activeFilter === 'ASSIGNED' ? 'active' : ''}`} onClick={() => setActiveFilter('ASSIGNED')}>
           <div className="cc-pulse-percent">
             <UserCheck size={20} className="cc-pulse-icon" />
             {counts.assigned}
           </div>
           <div className="cc-pulse-label">ASSIGNED</div>
        </button>
        <button className={`cc-pulse-card ${activeFilter === 'UNASSIGNED' ? 'active' : ''}`} onClick={() => setActiveFilter('UNASSIGNED')}>
           <div className="cc-pulse-percent">
             <UserX size={20} className="cc-pulse-icon" />
             {counts.unassigned}
           </div>
           <div className="cc-pulse-label">UNASSIGNED</div>
        </button>
        <button className={`cc-pulse-card ${activeFilter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setActiveFilter('COMPLETED')}>
           <div className="cc-pulse-percent">
             <CheckCircle size={20} className="cc-pulse-icon" />
             {counts.completed}
           </div>
           <div className="cc-pulse-label">COMPLETED</div>
        </button>
      </div>

      {/* Row 3: Operations Hub (Universal Link Table) */}
      <div className="cc-operations-hub">
        
        <div className="cc-ops-header">
          <div className="cc-ops-title-group">
            <h2>OPERATIONS HUB</h2>
            <span className="cc-ops-subtitle">Live Lifecycle Tracking</span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
            {activeFilter !== 'ALL' && (
               <button className="cc-clear-filter" onClick={() => setActiveFilter('ALL')}>
                 Viewing: {activeFilter} ✕
               </button>
            )}
            <button className="cc-ops-map-btn" onClick={() => {
              setMapFocusedTrip(null);
              setIsMapOpen(true);
            }}>
              <Globe size={14} />
              <span className="cc-ops-map-text">INTERACTIVE FLEET MAP</span>
            </button>
          </div>
        </div>
        <UniversalTripTable
          trips={filteredTasks}
          onTripClick={setSelectedTrip}
          onDriverClick={(name) => handleLinkClick({stopPropagation:()=>{}}, 'Driver', name)}
          onVehicleClick={(name) => handleLinkClick({stopPropagation:()=>{}}, 'Vehicle', name)}
          onClientClick={(name) => handleLinkClick({stopPropagation:()=>{}}, 'Client', name)}
          onMapClick={(task) => {
            setMapFocusedTrip(task);
            setIsMapOpen(true);
          }}
          showChannel={true}
          emptyMessage="No trips match the selected filter."
        />
      </div>
      </>
      )}
      {activeSubView === 'fleet' && (
        <FleetVault />
      )}

      {activeSubView === 'chauffeurs' && (
        <ChauffeurHub />
      )}

      {activeSubView === 'accounts' && (
        <CorporateClientHub />
      )}

      {activeSubView === 'private_clients' && (
        <PrivateClientRegistry />
      )}

      {activeSubView === 'staff' && <OperationalStaffDirectory />}
      {activeSubView === 'roster' && <WorkforceScheduler />}
      {activeSubView === 'analytics' && <FinancialDashboard />}
      {activeSubView === 'brand' && <WhiteLabelPortal />}

      <LiveTripModal
        trip={selectedTrip}
        onClose={() => setSelectedTrip(null)}
        onDriverClick={openDriverProfile}
        onClientClick={openClientProfile}
        onVehicleClick={openVehicleProfile}
      />

      <React.Suspense fallback={null}>
        <LiveFleetMapModal 
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          activeTasks={mapFocusedTrip ? [mapFocusedTrip] : activeTasks}
          onTripSelect={(trip) => {
            setIsMapOpen(false);
            setSelectedTrip(trip);
          }}
          onLinkClick={handleLinkClick}
        />
      </React.Suspense>

      {/* System Admin Drawer */}
      <div className={`cc-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={() => setIsDrawerOpen(false)} />
      <div className={`cc-system-drawer ${isDrawerOpen ? 'open' : ''}`}>
        <div className="cc-drawer-header">
          <h3>SYSTEM MANAGEMENT</h3>
          <button className="cc-drawer-close" onClick={() => setIsDrawerOpen(false)}><X size={20} /></button>
        </div>
        <div className="cc-drawer-content">
          {secondaryNav.map((item) => (
            <button key={item.id} className="cc-drawer-btn" onClick={() => { handleNavClick(item.id); setIsDrawerOpen(false); }}>
               <span className="cc-drawer-icon">{item.icon}</span>
               <span className="cc-drawer-label">{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="security-footer" style={{ marginTop: "auto" }}>Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default CommandCenter;
