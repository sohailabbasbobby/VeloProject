import React, { useState } from 'react';
import { Search, Car, ShieldCheck, FileText, Settings, AlertCircle, CheckCircle2, Plus, X, UploadCloud, CalendarDays, Activity, AlertTriangle, Clock, MapPin, Gauge, ChevronRight, Zap, User, Camera, HelpCircle, Shield, Award, Upload, Building2 } from 'lucide-react';
import './FleetVault.css';
import './UniversalGrid.css';
import { MOCK_VEHICLES } from '../data/mockDatabase';
import VehicleProfileModal from './VehicleProfileModal';
import OnboardChauffeurModal from './modals/OnboardChauffeurModal';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';
import AddVehicleModal from './modals/AddVehicleModal';

const FleetVault = () => {
  const { openVehicleProfile } = useEntityLinker();
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [isAddDriverModalOpen, setIsAddDriverModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('compliance'); // 'compliance', 'maintenance', 'operational', 'finance'
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardType, setOnboardType] = useState('Fleet');
  const [vehiclePassengers, setVehiclePassengers] = useState(4);
  const [vehicleBags, setVehicleBags] = useState(3);

  const fleet = MOCK_VEHICLES.map(v => ({
  id: v.id,
  name: `${v.make} ${v.model}`,
  plate: v.registration,
  image: "https://images.unsplash.com/photo-1631477091219-c4fb5ebda941?w=400&q=80",
  class: "VIP Sedan",
  status: v.status === "Active" ? "Deployed" : v.status,
  color: "Onyx Black",
  fleetNo: v.id,
  ownership: "Fleet Vehicle",
  mileage: v.mileage.toLocaleString(),
  mileageUpdated: "Today",
  earliestExpiry: { item: "MOT", days: 30 },
  fuelLevel: 80,
  serviceTarget: 90,
  cleanliness: "Excellent",
  operationalLogs: v.faults,
  compliance: {
    mot: { issue: "14 Oct 2025", expiry: v.motExpiry, valid: v.complianceStatus === "VERIFIED" },
    roadTax: { issue: "01 Jan 2026", expiry: "31 Dec 2026", valid: true },
    taxiCompliance: { issue: "02 May 2024", expiry: "02 May 2025", valid: true },
    insurance: { type: "Fleet", issue: "28 Dec 2024", expiry: v.insuranceExpiry, valid: true }
  }
}));

  return (
    <div className="fleet-vault-desktop">
      
      {/* Action Required Strip */}
      <div className="action-required-strip flex-row space-between align-center px-xl py-sm">
        <div className="flex-row align-center gap-sm font-bold text-sm">
          <AlertTriangle size={16} />
          <span>CRITICAL ALERT: Hydraulic Seal Failure detected on Vehicle V-002. Asset grounded.</span>
        </div>
        <button className="btn-resolve text-sm font-bold flex-row align-center gap-xs">
          Click-to-Resolve <ChevronRight size={14} />
        </button>
      </div>

      <div className="vault-content px-xl py-lg">
        
        {/* Macro-Graphics KPI Header */}
        <div className="kpi-header grid-4 gap-lg mb-xl">
          <div className="kpi-card surface-panel p-lg">
            <div className="kpi-label text-muted text-xs font-bold mb-sm">FLEET HEALTH INDEX</div>
            <div className="kpi-value text-white flex-row align-center gap-sm">
              <span style={{ fontSize: '32px' }}>96%</span>
              <Activity size={24} color="var(--color-emerald)" />
            </div>
            <div className="kpi-trend text-emerald text-xs mt-sm">+2.4% vs last month</div>
          </div>
          
          <div className="kpi-card surface-panel p-lg">
            <div className="kpi-label text-muted text-xs font-bold mb-sm">COMPLIANCE STATUS</div>
            <div className="kpi-value text-white flex-row align-center gap-sm">
              <span style={{ fontSize: '32px' }}>12/12</span>
              <ShieldCheck size={24} color="var(--color-gold)" />
            </div>
            <div className="kpi-trend text-muted text-xs mt-sm">All assets fully certified</div>
          </div>
          
          <div className="kpi-card surface-panel p-lg">
            <div className="kpi-label text-muted text-xs font-bold mb-sm">ACTIVE ASSETS</div>
            <div className="kpi-value text-white flex-row align-center gap-sm">
              <span style={{ fontSize: '32px' }}>8/12</span>
              <Car size={24} color="var(--color-gold)" />
            </div>
            <div className="kpi-trend text-muted text-xs mt-sm">2 Deployed, 6 Available</div>
          </div>
          
          <div className="kpi-card surface-panel p-lg">
            <div className="kpi-label text-muted text-xs font-bold mb-sm">MAINTENANCE ALERTS</div>
            <div className="kpi-value text-white flex-row align-center gap-sm">
              <span style={{ fontSize: '32px' }}>1</span>
              <AlertCircle size={24} color="var(--color-danger)" />
            </div>
            <div className="kpi-trend text-danger text-xs mt-sm">1 Critical Alert Active</div>
          </div>
        </div>

        {/* Fleet Grid Toolbar */}
        <div className="fleet-grid-toolbar flex-row space-between align-center mb-md">
          <h2 className="text-white" style={{ fontSize: '20px', letterSpacing: '1px' }}>High-Density Asset Grid</h2>
          <div className="flex-row gap-md">
            <div className="search-wrapper">
              <Search size={14} className="search-icon text-muted" />
              <input type="text" placeholder="Search Fleet..." style={{ width: '250px' }} />
            </div>
            <button className="btn-primary flex-row align-center gap-sm" onClick={() => setIsAddVehicleModalOpen(true)}>
              <Plus size={16} /> Register Asset
            </button>
          </div>
        </div>

        {/* High-Density Fleet Grid */}
        <div className="u-grid">
          {fleet.map(vehicle => (
            <div key={vehicle.id} className="u-card" onClick={() => openVehicleProfile(vehicle.name)}>
              <div className="u-card-header">
                <div className="u-card-header-left">
                  <div className={`u-status-dot ${vehicle.status.toLowerCase()}`}></div>
                  <span className="u-card-id">{vehicle.fleetNo}</span>
                </div>
                <div className={`u-badge ${vehicle.status.toLowerCase()}`}>{vehicle.status}</div>
              </div>
              <div className="u-card-body">
                <div className="u-card-image-container">
                  {(() => {
                    const workingImages = [
                      'https://images.unsplash.com/photo-1549399542-7e3f8b79c341',
                      'https://images.unsplash.com/photo-1552519507-da3b142c6e3d',
                      'https://images.unsplash.com/photo-1542282088-fe8426682b8f'
                    ];
                    const charCode = vehicle.fleetNo ? vehicle.fleetNo.charCodeAt(vehicle.fleetNo.length - 1) : vehicle.id.charCodeAt(vehicle.id.length - 1);
                    let imgUrl = workingImages[charCode % 3];
                    return (
                      <img src={imgUrl} loading="eager" alt={vehicle.name} className="u-card-image" />
                    );
                  })()}
                </div>
                <div className="u-card-title">{vehicle.name}</div>
                <div className="u-card-subtitle">{vehicle.plate}</div>
                <div className="text-muted text-xs flex-row gap-xs align-center justify-center mt-xs">
                   <Gauge size={12} /> {vehicle.mileage} mi
                </div>
              </div>
              <div className="u-card-footer" onClick={(e) => e.stopPropagation()}>
                <div className="u-card-status-text">
                  Status: <span className={`u-card-status-val ${vehicle.status.toLowerCase() === 'assigned' || vehicle.status.toLowerCase() === 'active' ? 'gold' : ''}`}>{vehicle.status}</span>
                </div>
                
                {vehicle.status.toLowerCase() === 'assigned' || vehicle.status.toLowerCase() === 'active' ? (
                  <div className="flex-row align-center gap-sm mt-xs p-xs rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <img src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=100&q=80" style={{ width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--color-gold)', objectFit: 'cover' }} alt="Driver" />
                    <div className="flex-col">
                      <span className="text-xs text-white font-bold"><EntityLink type="Driver">Julian R.</EntityLink></span>
                      <span className="text-muted" style={{ fontSize: '9px' }}>VEO-882</span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-row align-center justify-center gap-sm mt-xs p-xs rounded" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)' }}>
                    <span className="text-muted text-xs py-xs">Unassigned</span>
                  </div>
                )}

                <select 
                  className="mt-xs text-xs" 
                  style={{ width: '100%', padding: '8px', backgroundColor: '#111', border: '1px solid #333', color: '#fff', borderRadius: '4px', outline: 'none', cursor: 'pointer' }}
                  onChange={(e) => {
                    if (e.target.value === 'ADD_NEW') {
                      setIsAddDriverModalOpen(true);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">{vehicle.status.toLowerCase() === 'assigned' || vehicle.status.toLowerCase() === 'active' ? 'Reassign Driver...' : 'Assign Driver...'}</option>
                  <option value="VEO-882">Julian R. (VEO-882)</option>
                  <option value="VEO-421">Sarah W. (VEO-421)</option>
                  <option value="VEO-900">Thomas S. (VEO-900)</option>
                  <option value="VEO-901">Mia B. (VEO-901)</option>
                  <option value="UNASSIGN">Unassign Vehicle</option>
                  <option value="ADD_NEW" style={{ color: 'var(--color-gold)', fontWeight: 'bold' }}>+ Add New Driver</option>
                </select>
              </div>
            </div>
          ))}
          
          {/* Onboard New Asset Card */}
          <div className="asset-card surface-panel flex-col align-center justify-center border-dashed" style={{ minHeight: '300px' }} onClick={() => setIsAddVehicleModalOpen(true)}>
             <div className="bg-gold-dim p-md rounded-full mb-md flex-col align-center justify-center" style={{ width: '60px', height: '60px' }}>
               <Plus size={32} color="var(--color-gold)" />
             </div>
             <div className="text-gold font-bold text-lg mb-xs">Onboard New Asset</div>
             <div className="text-muted text-sm text-center px-md">Register a new owned fleet vehicle or owner-driver.</div>
          </div>
        </div>

      </div>
      <AddVehicleModal 
        isOpen={isAddVehicleModalOpen} 
        onClose={() => setIsAddVehicleModalOpen(false)} 
      />

      {/* Driver Onboarding Modal */}
      <OnboardChauffeurModal 
        isOpen={isAddDriverModalOpen} 
        onClose={() => setIsAddDriverModalOpen(false)} 
      />

      <div className="security-footer" style={{ marginTop: "auto" }}>Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default FleetVault;
