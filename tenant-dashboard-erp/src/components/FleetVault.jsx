import React, { useState } from 'react';
import { Search, Car, ShieldCheck, FileText, Settings, AlertCircle, CheckCircle2, Plus, X, UploadCloud, CalendarDays, Activity, AlertTriangle, Clock, MapPin, Gauge, ChevronRight, Zap, User, Camera, HelpCircle, Shield, Award, Upload, Building2 } from 'lucide-react';
import './FleetVault.css';
import './UniversalGrid.css';
import { MOCK_VEHICLES } from '../data/mockDatabase';
import VehicleProfileModal from './VehicleProfileModal';
import OnboardChauffeurModal from './OnboardChauffeurModal';

const FleetVault = () => {
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
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

  const currentVehicle = activeVehicle ? fleet.find(v => v.id === activeVehicle) : null;

  const handleOpenCommandModal = (id) => {
    setActiveVehicle(id);
    setIsCommandModalOpen(true);
  };

  const handleCloseCommandModal = () => {
    setIsCommandModalOpen(false);
    setActiveVehicle(null);
  };

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
            <div key={vehicle.id} className="u-card" onClick={() => handleOpenCommandModal(vehicle.id)}>
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
                      <span className="text-xs text-white font-bold">Julian R.</span>
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

      {/* Command Modal Deep-Dive */}
      {isCommandModalOpen && currentVehicle && (
        <VehicleProfileModal vehicle={currentVehicle} onClose={handleCloseCommandModal} />
      )}

      {/* Add Vehicle Modal (Multi-step) */}
      {isAddVehicleModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content add-vehicle-modal surface-panel" style={{ padding: 0 }}>
             
             {/* Sticky Header */}
             <div className="flex-row space-between p-xl border-bottom-subtle" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 10, borderTopLeftRadius: 'var(--border-radius-md)', borderTopRightRadius: 'var(--border-radius-md)' }}>
               <div>
                 <h2 className="text-white m-0">Add New Vehicle</h2>
               </div>
               <div className="flex-row gap-md">
                 <button className="text-muted hover-white" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><HelpCircle size={20}/></button>
                 <button className="text-muted hover-white" onClick={() => setIsAddVehicleModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
                   <X size={20} />
                 </button>
               </div>
             </div>
             
             {/* Scrollable Body */}
             <div className="add-vehicle-body p-xl">
               <div className="modal-split-layout">
                 
                 {/* LEFT COLUMN */}
                 <div className="flex-col gap-sm">
                   
                   {/* 1. Fleet Category */}
                   <div style={{ marginBottom: 0 }}>
                     <h3 className="text-xs text-muted font-bold tracking-wider mb-sm">1. FLEET CATEGORY</h3>
                     <div className="flex-row gap-md">
                       <div 
                         className={`category-card flex-1 ${onboardType === 'Fleet' ? 'active' : ''}`}
                         onClick={() => setOnboardType('Fleet')}
                       >
                         <div className="p-sm rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}><Building2 size={24} color={onboardType === 'Fleet' ? 'var(--color-gold)' : 'var(--color-muted)'} /></div>
                         <div className="flex-col">
                           <span className="text-white font-bold">Owned Fleet</span>
                           <span className="text-xs text-muted">Corporate-managed asset</span>
                         </div>
                       </div>
                       <div 
                         className={`category-card flex-1 ${onboardType === 'Owner' ? 'active' : ''}`}
                         onClick={() => setOnboardType('Owner')}
                       >
                         <div className="p-sm rounded" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}><MapPin size={24} color={onboardType === 'Owner' ? 'var(--color-gold)' : 'var(--color-muted)'} /></div>
                         <div className="flex-col">
                           <span className="text-white font-bold">Owner-Driver</span>
                           <span className="text-xs text-muted">Contractor-provided asset</span>
                         </div>
                       </div>
                     </div>
                   </div>

                   {/* 2. Visual Assets */}
                   <div style={{ marginBottom: 0 }}>
                     <h3 className="text-xs text-muted font-bold tracking-wider mb-sm">2. VISUAL ASSETS</h3>
                     <div className="drag-drop-zone flex-col align-center justify-center" style={{ height: '80px', borderStyle: 'dashed' }}>
                       <div className="p-sm rounded-full mb-xs" style={{ backgroundColor: 'rgba(212,175,55,0.1)' }}>
                         <Camera size={32} color="var(--color-gold)" />
                       </div>
                       <span className="text-white font-bold text-sm mb-xs">Drag and drop vehicle images</span>
                       <span className="text-muted" style={{ fontSize: '10px' }}>Supported: JPEG, PNG, HEIC (Max 15MB)</span>
                     </div>
                   </div>

                   {/* 3. Primary Details */}
                   <div style={{ marginBottom: 0 }}>
                     <h3 className="text-xs text-muted font-bold tracking-wider mb-sm">3. PRIMARY DETAILS</h3>
                     <div className="form-grid" style={{ gridAutoRows: 'min-content' }}>
                       <div className="form-group">
                         <label>Make</label>
                         <input type="text" className="input-field" placeholder="e.g. Mercedes-Benz" />
                       </div>
                       <div className="form-group">
                         <label>Model</label>
                         <input type="text" className="input-field" placeholder="e.g. S-Class" />
                       </div>
                       <div className="form-group">
                         <label>Registration Number</label>
                         <input type="text" className="input-field" placeholder="LV72 XXX" />
                       </div>
                       <div className="form-group">
                         <label>Exterior Color</label>
                         <input type="text" className="input-field" placeholder="e.g. Obsidian Black" />
                       </div>
                       <div className="form-group span-2">
                         <label>Initial Mileage</label>
                         <input type="number" className="input-field w-100" placeholder="0" />
                       </div>
                     </div>
                     
                     <div className="flex-row gap-md mt-sm">
                       <div className="form-group flex-1">
                         <label className="flex-row align-center gap-xs"><User size={14}/> Passenger Capacity</label>
                         <div className="counter-control mt-xs">
                           <button className="counter-btn" onClick={() => setVehiclePassengers(Math.max(1, vehiclePassengers - 1))}>-</button>
                           <span className="counter-value">{vehiclePassengers}</span>
                           <button className="counter-btn" onClick={() => setVehiclePassengers(vehiclePassengers + 1)}>+</button>
                         </div>
                       </div>
                       <div className="form-group flex-1" style={{ borderLeft: '1px solid rgba(255,255,255,0.1)', paddingLeft: '16px' }}>
                         <label className="flex-row align-center gap-xs"><FileText size={14} /> Luggage Capacity</label>
                         <div className="counter-control mt-xs">
                           <button className="counter-btn" onClick={() => setVehicleBags(Math.max(0, vehicleBags - 1))}>-</button>
                           <span className="counter-value">{vehicleBags}</span>
                           <button className="counter-btn" onClick={() => setVehicleBags(vehicleBags + 1)}>+</button>
                         </div>
                       </div>
                     </div>
                   </div>

                 </div>

                 {/* RIGHT COLUMN */}
                 <div className="flex-col gap-lg" style={{ height: "100%" }}>
                   
                   {/* 4. Compliance */}
                   <div className="flex-col" style={{ flex: 1 }}>
                     <div className="flex-row space-between align-center mb-sm">
                       <h3 className="text-xs text-muted font-bold tracking-wider m-0">4. COMPLIANCE</h3>
                       <span className="text-xs text-red font-bold flex-row align-center gap-xs"><AlertCircle size={14}/> ACTION REQUIRED</span>
                     </div>
                     
                     <div className="flex-col gap-md" style={{ flex: 1 }}>
                       {/* MOT Card */}
                       <div className="compliance-card flex-col justify-center" style={{ flex: 1, backgroundColor: 'var(--color-obsidian)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)' }}>
                         <div className="flex-row space-between align-center mb-md">
                           <div className="flex-row align-center gap-sm">
                             <Award size={18} color="var(--color-gold)"/>
                             <span className="text-white font-bold">MOT Certification</span>
                           </div>
                           <button className="text-gold font-bold text-xs flex-row align-center gap-xs" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Upload size={14}/> UPLOAD</button>
                         </div>
                         <div className="form-grid" style={{ gap: '16px' }}>
                           <div className="form-group">
                             <label style={{ fontSize: '10px' }}>ISSUED</label>
                             <input type="date" className="input-field p-sm text-sm" style={{ colorScheme: 'dark' }} />
                           </div>
                           <div className="form-group">
                             <label style={{ fontSize: '10px' }}>EXPIRY</label>
                             <input type="date" className="input-field p-sm text-sm" style={{ colorScheme: 'dark' }} />
                           </div>
                         </div>
                       </div>

                       {/* PCO Card */}
                       <div className="compliance-card flex-col justify-center" style={{ flex: 1, backgroundColor: 'var(--color-obsidian)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)' }}>
                         <div className="flex-row space-between align-center mb-md">
                           <div className="flex-row align-center gap-sm">
                             <Award size={18} color="var(--color-gold)"/>
                             <span className="text-white font-bold">PCO / Compliance License</span>
                           </div>
                           <button className="text-gold font-bold text-xs flex-row align-center gap-xs" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Upload size={14}/> UPLOAD</button>
                         </div>
                         <div className="form-grid" style={{ gap: '16px' }}>
                           <div className="form-group">
                             <label style={{ fontSize: '10px' }}>ISSUED</label>
                             <input type="date" className="input-field p-sm text-sm" style={{ colorScheme: 'dark' }} />
                           </div>
                           <div className="form-group">
                             <label style={{ fontSize: '10px' }}>EXPIRY</label>
                             <input type="date" className="input-field p-sm text-sm" style={{ colorScheme: 'dark' }} />
                           </div>
                         </div>
                       </div>

                       {/* Insurance Card */}
                       <div className="compliance-card flex-col justify-center" style={{ flex: 1, backgroundColor: 'var(--color-obsidian)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 'var(--border-radius-md)', padding: 'var(--spacing-lg)' }}>
                         <div className="flex-row space-between align-center mb-md">
                           <div className="flex-row align-center gap-sm">
                             <Shield size={18} color="var(--color-gold)"/>
                             <span className="text-white font-bold">Insurance Policy</span>
                           </div>
                           <button className="text-gold font-bold text-xs flex-row align-center gap-xs" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><Upload size={14}/> UPLOAD</button>
                         </div>
                         <div className="form-grid" style={{ gap: '16px' }}>
                           <div className="form-group">
                             <label style={{ fontSize: '10px' }}>ISSUED</label>
                             <input type="date" className="input-field p-sm text-sm" style={{ colorScheme: 'dark' }} />
                           </div>
                           <div className="form-group">
                             <label style={{ fontSize: '10px' }}>EXPIRY</label>
                             <input type="date" className="input-field p-sm text-sm" style={{ colorScheme: 'dark' }} />
                           </div>
                         </div>
                       </div>

                     </div>
                   </div>

                 </div>

               </div>
             </div>

             {/* Sticky Footer */}
             <div className="p-xl border-top-subtle flex-row space-between align-center" style={{ position: 'sticky', bottom: 0, backgroundColor: 'var(--color-surface)', zIndex: 10, borderBottomLeftRadius: 'var(--border-radius-md)', borderBottomRightRadius: 'var(--border-radius-md)' }}>
                <div className="flex-row align-center gap-sm text-muted text-xs font-bold tracking-wider">
                  <ShieldCheck size={16} color="var(--color-gold)" />
                  VERIFIED BY VELO AI SECURITY PROTOCOL
                </div>
                <div className="flex-row gap-md">
                  <button className="p-md rounded border-subtle text-white font-bold" style={{ backgroundColor: 'rgba(255,255,255,0.05)', cursor: 'pointer', border: '1px solid rgba(255,255,255,0.1)' }}>SAVE DRAFT</button>
                  <button className="btn-primary font-bold" onClick={() => setIsAddVehicleModalOpen(false)}>REGISTER ASSET TO VAULT</button>
                </div>
             </div>
           </div>
        </div>
      )}

      {/* Driver Onboarding Modal */}
      <OnboardChauffeurModal 
        isOpen={isAddDriverModalOpen} 
        onClose={() => setIsAddDriverModalOpen(false)} 
      />
    </div>
  );
};

export default FleetVault;
