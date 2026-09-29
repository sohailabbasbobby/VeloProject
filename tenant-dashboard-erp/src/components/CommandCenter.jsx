import React, { useState, useMemo, useCallback } from 'react';
import {
  CarFront, UserCircle, Briefcase, Key, Contact, CalendarDays,
  LineChart, Paintbrush, Calendar, UserCheck, UserX, CheckCircle,
  Settings, X, Globe
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
import PlatformHealthWidget from './PlatformHealthWidget';
import './CommandCenter.css';
import { fetchKpis, fetchTrips, usePolling } from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import FleetVault from './FleetVault';

const LiveFleetMapModal = React.lazy(() => import('./LiveFleetMapModal'));

const STATE_LABELS = {
  PENDING_DISPATCH: 'Unassigned',
  OFFERING_OWN_FLEET: 'Offering to Fleet',
  IN_POOL: 'In B2B Pool',
  NEGOTIATION: 'Negotiating',
  ASSIGNED: 'Assigned',
  DRIVER_EN_ROUTE: 'On the way to Pickup',
  ARRIVED: 'Arrived at pickup',
  IN_PROGRESS: 'On Trip',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  EXPIRED: 'Expired',
};

const ACTIVE_STATES = ['DRIVER_EN_ROUTE', 'ARRIVED', 'IN_PROGRESS'];
const PROGRESS_BY_STATE = { ASSIGNED: 10, DRIVER_EN_ROUTE: 45, ARRIVED: 60, IN_PROGRESS: 80, COMPLETED: 100 };

const timeToFree = (trip) => {
  if (trip.state === 'COMPLETED') return 'Now';
  if (trip.state === 'IN_PROGRESS' && trip.duration_minutes) return `${trip.duration_minutes}m`;
  if (trip.scheduled_at) {
    const diff = new Date(trip.scheduled_at) - new Date();
    if (diff <= 0) return 'Now';
    const mins = Math.round(diff / 60000);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60}m` : `${mins}m`;
  }
  return trip.booking_type === 'ASAP' ? 'ASAP' : '—';
};

const CommandCenter = ({ onNavigate, pendingSubView, onConsumePendingSubView }) => {
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [activeFilter, setActiveFilter] = useState('ACTIVE');
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [mapFocusedTrip, setMapFocusedTrip] = useState(null);
  const [activeSubView, setActiveSubView] = useState('operations');

  // Consume a pending sub-view intent from App (cross-component navigation, e.g. CorporateRoster → Corporate Accounts)
  React.useEffect(() => {
    if (pendingSubView) {
      setActiveSubView(pendingSubView);
      if (onConsumePendingSubView) onConsumePendingSubView();
    }
  }, [pendingSubView, onConsumePendingSubView]);

  const { openDriverProfile, openClientProfile, openVehicleProfile } = useEntityLinker();

  // LIVE DATA — Operations Hub reads real trips + KPIs from backend-core (no mock arrays)
  const loadTrips = useCallback(() => fetchTrips(), []);
  const { data: trips, loading: tripsLoading, error: tripsError } = usePolling(loadTrips, 12000);

  const allTasks = useMemo(() => (trips || []).map((t) => ({
    id: t.task_id,
    dbId: t.id,
    channel: t.channel === 'POOL' ? 'B2B Pool' : t.channel === 'CORPORATE' ? 'Corporate' : (t.originating_tenant_name || 'Own App'),
    status: STATE_LABELS[t.state] || t.state,
    state: t.state,
    driver: t.driver_name || 'Unassigned',
    driverCode: t.driver_code,
    vehicle: t.vehicle_name || 'TBD',
    vehicleCode: t.vehicle_code,
    passenger: t.passenger_name,
    client: t.corporate_name || t.private_client_name || (t.corporate_booker_name ? t.corporate_booker_name : 'Private'),
    clientCode: t.corporate_code || t.private_client_code,
    route: `${t.pickup_address} → ${t.dropoff_address}`,
    price: t.final_price || t.custom_price,
    progress: PROGRESS_BY_STATE[t.state] ?? 0,
    timeToFree: timeToFree(t),
    scheduled_at: t.scheduled_at,
    pickup_lat: t.pickup_lat, pickup_lng: t.pickup_lng,
    dropoff_lat: t.dropoff_lat, dropoff_lng: t.dropoff_lng,
    _raw: t,
  })), [trips]);

  const counts = useMemo(() => ({
    active: allTasks.filter((t) => ACTIVE_STATES.includes(t.state)).length,
    upcoming: allTasks.filter((t) => ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION', 'ASSIGNED'].includes(t.state)).length,
    assigned: allTasks.filter((t) => t.state !== 'PENDING_DISPATCH' && t.driver && t.driver !== 'Unassigned').length,
    unassigned: allTasks.filter((t) => ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION'].includes(t.state)).length,
    completed: allTasks.filter((t) => t.state === 'COMPLETED').length,
  }), [allTasks]);

  const filteredTasks = useMemo(() => {
    if (activeFilter === 'ALL') return allTasks;
    if (activeFilter === 'ACTIVE') return allTasks.filter((t) => ACTIVE_STATES.includes(t.state));
    if (activeFilter === 'UPCOMING') return allTasks.filter((t) => ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION', 'ASSIGNED'].includes(t.state));
    if (activeFilter === 'ASSIGNED') return allTasks.filter((t) => t.state !== 'PENDING_DISPATCH' && t.driver !== 'Unassigned');
    if (activeFilter === 'UNASSIGNED') return allTasks.filter((t) => ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION'].includes(t.state));
    if (activeFilter === 'COMPLETED') return allTasks.filter((t) => t.state === 'COMPLETED');
    return allTasks;
  }, [activeFilter, allTasks]);

  const activeTasksForMap = useMemo(() => allTasks.filter((t) => ACTIVE_STATES.includes(t.state) || ['ASSIGNED', 'IN_POOL'].includes(t.state)), [allTasks]);

  const handleLinkClick = (e, type, value, code) => {
    if (e && e.stopPropagation) e.stopPropagation();
    if (type === 'Driver') openDriverProfile(value, code);
    else if (type === 'Client') openClientProfile(value, code);
    else if (type === 'Vehicle') openVehicleProfile(value, code);
  };

  const primaryNav = [
    { id: 'fleet', icon: <CarFront size={14} />, label: 'Fleet Asset Management', active: activeSubView === 'fleet' },
    { id: 'chauffeurs', icon: <UserCircle size={14} />, label: 'Chauffeur Personnel Hub', active: activeSubView === 'chauffeurs' },
    { id: 'accounts', icon: <Briefcase size={14} />, label: 'Corporate Accounts & Billing', active: activeSubView === 'accounts' },
    { id: 'private_clients', icon: <Key size={14} />, label: 'Private Client Registry', active: activeSubView === 'private_clients' },
  ];

  const secondaryNav = [
    { id: 'staff', icon: <Contact size={14} />, label: 'Operational Staff Directory' },
    { id: 'roster', icon: <CalendarDays size={14} />, label: 'Workforce Roster & Scheduling' },
    { id: 'analytics', icon: <LineChart size={14} className="text-gold" />, label: 'Financial Intelligence & Compliance' },
    { id: 'brand', icon: <Paintbrush size={14} />, label: 'Brand Identity & White Labeling' },
  ];

  const handleNavClick = (id) => {
    setActiveSubView(activeSubView === id ? 'operations' : id);
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
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PlatformHealthWidget />
          <button className="cc-toolbar-btn" onClick={() => setIsDrawerOpen(true)}>
            <span className="cc-toolbar-icon"><Settings size={14} /></span>
            <span className="cc-toolbar-label">System Admin</span>
          </button>
        </div>
      </div>

      {activeSubView === 'operations' && (
        <>
          {/* Row 2: Operational Metrics (Pulse Bar) — LIVE KPI counts */}
          <div className="cc-metrics-row">
            <button className={`cc-pulse-card ${activeFilter === 'ACTIVE' ? 'active' : ''}`} onClick={() => setActiveFilter('ACTIVE')}>
              <div className="cc-pulse-percent"><CarFront size={20} className="cc-pulse-icon" />{counts.active}</div>
              <div className="cc-pulse-label">ACTIVE TRIPS</div>
            </button>
            <button className={`cc-pulse-card ${activeFilter === 'UPCOMING' ? 'active' : ''}`} onClick={() => setActiveFilter('UPCOMING')}>
              <div className="cc-pulse-percent"><Calendar size={20} className="cc-pulse-icon" />{counts.upcoming}</div>
              <div className="cc-pulse-label">UPCOMING</div>
            </button>
            <button className={`cc-pulse-card ${activeFilter === 'ASSIGNED' ? 'active' : ''}`} onClick={() => setActiveFilter('ASSIGNED')}>
              <div className="cc-pulse-percent"><UserCheck size={20} className="cc-pulse-icon" />{counts.assigned}</div>
              <div className="cc-pulse-label">ASSIGNED</div>
            </button>
            <button className={`cc-pulse-card ${activeFilter === 'UNASSIGNED' ? 'active' : ''}`} onClick={() => setActiveFilter('UNASSIGNED')}>
              <div className="cc-pulse-percent"><UserX size={20} className="cc-pulse-icon" />{counts.unassigned}</div>
              <div className="cc-pulse-label">UNASSIGNED</div>
            </button>
            <button className={`cc-pulse-card ${activeFilter === 'COMPLETED' ? 'active' : ''}`} onClick={() => setActiveFilter('COMPLETED')}>
              <div className="cc-pulse-percent"><CheckCircle size={20} className="cc-pulse-icon" />{counts.completed}</div>
              <div className="cc-pulse-label">COMPLETED</div>
            </button>
          </div>

          {/* Row 3: Operations Hub (Universal Link Table) — LIVE trips */}
          <div className="cc-operations-hub">
            <div className="cc-ops-header">
              <div className="cc-ops-title-group">
                <h2>OPERATIONS HUB</h2>
                <span className="cc-ops-subtitle">
                  {tripsLoading ? 'Syncing live dispatch data…' : tripsError ? `Live feed error: ${tripsError.message}` : 'Live Lifecycle Tracking'}
                </span>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                {activeFilter !== 'ALL' && (
                  <button className="cc-clear-filter" onClick={() => setActiveFilter('ALL')}>
                    Viewing: {activeFilter} ✕
                  </button>
                )}
                <button className="cc-ops-map-btn" onClick={() => { setMapFocusedTrip(null); setIsMapOpen(true); }}>
                  <Globe size={14} />
                  <span className="cc-ops-map-text">INTERACTIVE FLEET MAP</span>
                </button>
              </div>
            </div>
            <UniversalTripTable
              trips={filteredTasks}
              onTripClick={setSelectedTrip}
              onDriverClick={(name, code) => handleLinkClick({ stopPropagation: () => {} }, 'Driver', name, code)}
              onVehicleClick={(name, code) => handleLinkClick({ stopPropagation: () => {} }, 'Vehicle', name, code)}
              onClientClick={(name, code) => handleLinkClick({ stopPropagation: () => {} }, 'Client', name, code)}
              onMapClick={(task) => { setMapFocusedTrip(task); setIsMapOpen(true); }}
              showChannel={true}
              emptyMessage={tripsLoading ? 'Loading live trips…' : 'No trips match the selected filter.'}
            />
          </div>
        </>
      )}
      {activeSubView === 'fleet' && <FleetVault />}
      {activeSubView === 'chauffeurs' && <ChauffeurHub />}
      {activeSubView === 'accounts' && <CorporateClientHub />}
      {activeSubView === 'private_clients' && <PrivateClientRegistry />}
      {activeSubView === 'staff' && <OperationalStaffDirectory />}
      {activeSubView === 'roster' && <WorkforceScheduler />}
      {activeSubView === 'analytics' && <FinancialDashboard />}
      {activeSubView === 'brand' && <WhiteLabelPortal />}

      <LiveTripModal
        trip={selectedTrip && selectedTrip._raw ? selectedTrip._raw : selectedTrip}
        onClose={() => setSelectedTrip(null)}
        onDriverClick={openDriverProfile}
        onClientClick={openClientProfile}
        onVehicleClick={openVehicleProfile}
      />

      <React.Suspense fallback={null}>
        <LiveFleetMapModal
          isOpen={isMapOpen}
          onClose={() => setIsMapOpen(false)}
          activeTasks={mapFocusedTrip ? [mapFocusedTrip] : activeTasksForMap}
          onTripSelect={(trip) => { setIsMapOpen(false); setSelectedTrip(trip); }}
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

      <div className="security-footer" style={{ marginTop: 'auto' }}>Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default CommandCenter;
