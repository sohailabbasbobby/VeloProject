import React, { useState } from 'react';
import { Search, Car, ShieldCheck, FileText, Settings, AlertCircle, CheckCircle2, Plus, X, UploadCloud, CalendarDays, Activity, AlertTriangle, Clock, MapPin, Gauge, ChevronRight, Zap, User, Camera, HelpCircle, Shield, Award, Upload, Building2 } from 'lucide-react';
import './FleetVault.css';

const FleetVault = () => {
  const [activeVehicle, setActiveVehicle] = useState(null);
  const [isCommandModalOpen, setIsCommandModalOpen] = useState(false);
  const [isAddVehicleModalOpen, setIsAddVehicleModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('compliance'); // 'compliance', 'maintenance', 'operational', 'finance'
  const [onboardStep, setOnboardStep] = useState(1);
  const [onboardType, setOnboardType] = useState('Fleet');
  const [vehiclePassengers, setVehiclePassengers] = useState(4);
  const [vehicleBags, setVehicleBags] = useState(3);

  const fleet = [
    {
      id: 1,
      name: 'Mercedes-Maybach S680',
      plate: 'LN23 YXX',
      image: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?w=400&q=80',
      class: 'VIP Sedan',
      status: 'Deployed',
      color: 'Midnight Silver',
      fleetNo: 'V-001',
      ownership: 'Fleet Vehicle',
      mileage: '12,450',
      mileageUpdated: '06 Jun 2026',
      earliestExpiry: { item: 'MOT', days: 12 },
      fuelLevel: 85,
      serviceTarget: 92,
      cleanliness: 'Excellent',
      operationalLogs: [
        { id: 101, date: '06 Jun 2026 08:30', driver: 'Alistair B.', driverID: '#CH-0084', mileage: '12,450', category: 'Fuel', description: 'Refueled at Shell Mayfair (£85.00)' },
        { id: 102, date: '05 Jun 2026 18:00', driver: 'Alistair B.', driverID: '#CH-0084', mileage: '12,380', category: 'Cleaning', description: 'Executive Valet Service' },
        { id: 103, date: '04 Jun 2026 09:15', driver: 'Marcus T.', driverID: '#CH-0122', mileage: '12,210', category: 'General', description: 'Pre-shift inspection completed. All systems nominal.' }
      ],
      compliance: {
        mot: { issue: '14 Oct 2025', expiry: '14 Oct 2026', valid: true },
        roadTax: { issue: '01 Jan 2026', expiry: '31 Dec 2026', valid: true },
        taxiCompliance: { issue: '02 May 2024', expiry: '02 May 2025', valid: true },
        insurance: { type: 'Fleet Insurance', issue: '28 Dec 2024', expiry: '28 Dec 2025', valid: true }
      }
    },
    {
      id: 2,
      name: 'Rolls-Royce Phantom',
      plate: 'RR01 VIP',
      image: 'https://images.unsplash.com/photo-1631477091219-c4fb5ebda941?w=400&q=80',
      class: 'Ultra Luxury',
      status: 'Maintenance',
      color: 'Onyx Black',
      fleetNo: 'V-002',
      ownership: 'Fleet Vehicle',
      mileage: '8,100',
      mileageUpdated: '05 Jun 2026',
      earliestExpiry: { item: 'PCO License', days: 45 },
      fuelLevel: 40,
      serviceTarget: 10,
      cleanliness: 'Fair',
      operationalLogs: [
        { id: 201, date: '05 Jun 2026 14:00', driver: 'Service Dept', driverID: 'SYS-MAINT', mileage: '8,100', category: 'Maintenance', description: 'Scheduled deep detail and leather treatment.' }
      ],
      compliance: {
        mot: { issue: '10 Nov 2025', expiry: '10 Nov 2026', valid: true },
        roadTax: { issue: '15 Feb 2026', expiry: '14 Feb 2027', valid: true },
        taxiCompliance: { issue: '20 Jul 2025', expiry: '20 Jul 2026', valid: true },
        insurance: { type: 'Fleet Insurance', issue: '28 Dec 2024', expiry: '28 Dec 2025', valid: true }
      }
    },
    {
      id: 3,
      name: 'Range Rover SV',
      plate: 'AB24 XYZ',
      image: 'https://images.unsplash.com/photo-1606016159991-d17b67fa0ce8?w=400&q=80',
      class: 'SUV',
      status: 'Available',
      color: 'Eiger Grey',
      fleetNo: 'V-003',
      ownership: 'Owner Vehicle',
      mileage: '4,200',
      mileageUpdated: '01 Jun 2026',
      earliestExpiry: { item: 'Road Tax', days: 90 },
      fuelLevel: 100,
      serviceTarget: 75,
      cleanliness: 'Excellent',
      operationalLogs: [],
      compliance: {
        mot: { issue: '01 Mar 2026', expiry: '01 Mar 2027', valid: true },
        roadTax: { issue: '05 Sep 2025', expiry: '05 Sep 2026', valid: true },
        taxiCompliance: { issue: '12 Dec 2025', expiry: '12 Dec 2026', valid: true },
        insurance: { type: 'Individual', issue: '10 Jan 2026', expiry: '10 Jan 2027', valid: true }
      }
    },
    {
      id: 4,
      name: 'Bentley Bentayga',
      plate: 'BN23 LUX',
      image: 'https://images.unsplash.com/photo-1632230623696-98ec8d0e7223?w=400&q=80',
      class: 'Luxury SUV',
      status: 'Deployed',
      color: 'Dark Sapphire',
      fleetNo: 'V-004',
      ownership: 'Fleet Vehicle',
      mileage: '15,600',
      mileageUpdated: '06 Jun 2026',
      earliestExpiry: { item: 'MOT', days: 210 },
      fuelLevel: 60,
      serviceTarget: 40,
      cleanliness: 'Good',
      operationalLogs: [],
      compliance: {
        mot: { issue: '01 Jan 2026', expiry: '01 Jan 2027', valid: true },
        roadTax: { issue: '01 Mar 2026', expiry: '01 Mar 2027', valid: true },
        taxiCompliance: { issue: '01 Apr 2026', expiry: '01 Apr 2027', valid: true },
        insurance: { type: 'Fleet Insurance', issue: '28 Dec 2024', expiry: '28 Dec 2025', valid: true }
      }
    }
  ];

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
        <div className="fleet-asset-grid">
          {fleet.map(vehicle => (
            <div key={vehicle.id} className="asset-card surface-panel d-flex flex-col" onClick={() => handleOpenCommandModal(vehicle.id)}>
              <div className="asset-card-header p-md border-bottom-subtle flex-row space-between align-center">
                <div className="flex-row gap-xs align-center">
                  <div className={`status-dot ${vehicle.status.toLowerCase()}`}></div>
                  <span className="text-xs font-bold" style={{ letterSpacing: '1px' }}>{vehicle.fleetNo}</span>
                </div>
                <div className={`status-badge-small ${vehicle.status.toLowerCase()}`}>{vehicle.status}</div>
              </div>
              <div className="asset-card-body p-md flex-col align-center text-center">
                <div className="asset-card-image mb-sm w-100" style={{ height: '110px', overflow: 'hidden', borderRadius: '4px' }}>
                  <img src={vehicle.image} alt={vehicle.name} style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.9 }} />
                </div>
                <div className="font-bold text-white text-md mb-xs mt-xs">{vehicle.name}</div>
                <div className="text-muted text-xs mb-xs">{vehicle.plate}</div>
                <div className="text-muted text-xs flex-row gap-xs align-center justify-center">
                   <Gauge size={12} /> {vehicle.mileage} mi
                </div>
              </div>
              <div className="asset-card-footer p-md border-top-subtle grid-2 gap-sm">
                <div>
                  <div className="text-xs text-muted mb-1">Fuel/Range</div>
                  <div className="progress-bar-bg"><div className="progress-bar-fill bg-gold" style={{ width: `${vehicle.fuelLevel}%` }}></div></div>
                </div>
                <div>
                  <div className="text-xs text-muted mb-1">Service Target</div>
                  <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${vehicle.serviceTarget}%`, backgroundColor: 'var(--color-emerald)' }}></div></div>
                </div>
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
        <div className="modal-overlay">
          <div className="command-modal-content surface-panel flex-col">
            
            {/* Modal Header */}
            <div className="command-modal-header p-xl flex-row space-between align-start" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(0,0,0,0.2)' }}>
              <div className="flex-row gap-lg align-start">
                <div className="inspector-large-icon bg-gold-dim p-md rounded-lg">
                  <Car size={48} color="var(--color-gold)" />
                </div>
                <div className="flex-col gap-sm">
                  <h2 className="text-white m-0 flex-row align-center gap-md" style={{ fontSize: '28px' }}>
                    {currentVehicle.name} 
                    <span className={`status-badge ${currentVehicle.status.toLowerCase()}`} style={{ fontSize: '12px' }}>{currentVehicle.status}</span>
                  </h2>
                  <div className="flex-row align-center gap-md text-sm text-muted font-bold">
                    <span className="text-white">{currentVehicle.plate}</span>
                    <span>•</span>
                    <span>{currentVehicle.fleetNo}</span>
                    <span>•</span>
                    <span className="text-gold">{currentVehicle.ownership}</span>
                  </div>
                </div>
              </div>
              <div className="flex-row gap-xl align-start">
                {/* Driver Assignment Block */}
                <div className="flex-col gap-sm" style={{ minWidth: '220px' }}>
                  <div className="text-xs text-muted font-bold">DRIVER ASSIGNMENT</div>
                  {currentVehicle.ownership === 'Owner Vehicle' ? (
                     <div className="surface-panel p-sm border-subtle rounded flex-col gap-xs" title="Owner-Driver profiles are strictly linked to the Driver Registry. Reassignment disabled." style={{ opacity: 0.8 }}>
                       <div className="text-gold text-xs font-bold flex-row align-center gap-xs"><ShieldCheck size={12}/> Owner-Driver Locked</div>
                       <select disabled className="input-field py-xs px-sm text-sm" style={{ opacity: 0.8, height: '36px' }}>
                          <option>James Smith (Owner)</option>
                       </select>
                     </div>
                  ) : (
                     <div className="surface-panel p-sm border-subtle rounded flex-col gap-xs">
                       <div className="text-emerald text-xs font-bold">Fleet Asset - Reassignable</div>
                       <select className="input-field py-xs px-sm text-sm border-gold" style={{ height: '36px' }}>
                          <option>Alistair B.</option>
                          <option>Marcus T.</option>
                          <option>Sarah Jenkins</option>
                          <option>Unassigned</option>
                       </select>
                     </div>
                  )}
                </div>
                <button className="modal-close-btn" onClick={handleCloseCommandModal}>
                  <X size={24} />
                </button>
              </div>
            </div>

            {/* AI Control Strip inside Modal */}
            <div className="ai-control-strip px-xl py-sm flex-row space-between align-center border-bottom-subtle">
              <div className="flex-row align-center gap-sm text-gold text-sm font-bold">
                <Zap size={16} /> AI Assistant Ready
              </div>
              <div className="search-wrapper" style={{ flex: 1, marginLeft: '32px' }}>
                <input type="text" placeholder="Type a natural language command (e.g. 'Assign Marcus to this vehicle for tomorrow's shift')" className="w-100" style={{ background: 'transparent' }} />
              </div>
            </div>

            {/* Tabbed Interface */}
            <div className="flex-1 flex-col" style={{ overflow: 'hidden' }}>
              <div className="tabs-header flex-row px-xl pt-md border-bottom-subtle gap-md">
                <button className={`tab-btn ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>Compliance</button>
                <button className={`tab-btn ${activeTab === 'operational' ? 'active' : ''}`} onClick={() => setActiveTab('operational')}>Vehicle Log</button>
                <button className={`tab-btn ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>Maintenance</button>
                <button className={`tab-btn ${activeTab === 'finance' ? 'active' : ''}`} onClick={() => setActiveTab('finance')}>Financials</button>
              </div>

              <div className="tab-content p-xl flex-1" style={{ overflowY: 'auto' }}>
                {/* Compliance Tab */}
                {activeTab === 'compliance' && (
                  <div className="compliance-tab-content flex-col gap-lg">
                    <h3 className="text-white text-sm" style={{ letterSpacing: '2px' }}>COMPLIANCE TIMELINE</h3>
                    <div className="timeline-visualization p-lg surface-panel rounded-lg border-subtle">
                      <p className="text-muted text-sm italic">Compliance timeline visualization (e.g., Gantt style chart) will render here, showing valid ranges and upcoming expirations.</p>
                    </div>
                    <div className="grid-2 gap-lg">
                      <div className="detailed-compliance-card p-lg border-subtle rounded-lg">
                        <div className="flex-row space-between align-center mb-md pb-sm border-bottom-subtle">
                          <h4 className="text-white m-0 text-sm">MOT Certificate</h4>
                          <span className="badge-valid flex-row align-center gap-xs"><CheckCircle2 size={12} /> Valid</span>
                        </div>
                        <div className="flex-row space-between mb-md text-sm">
                          <div><div className="text-muted text-xs">Issue Date</div><div className="text-white">{currentVehicle.compliance.mot.issue}</div></div>
                          <div className="text-right"><div className="text-muted text-xs">Expiry Date</div><div className="text-white">{currentVehicle.compliance.mot.expiry}</div></div>
                        </div>
                      </div>
                      <div className="detailed-compliance-card p-lg border-subtle rounded-lg">
                        <div className="flex-row space-between align-center mb-md pb-sm border-bottom-subtle">
                          <h4 className="text-white m-0 text-sm">Insurance Policy</h4>
                          <span className="badge-valid flex-row align-center gap-xs"><CheckCircle2 size={12} /> Valid</span>
                        </div>
                        <div className="flex-row space-between mb-md text-sm">
                          <div><div className="text-muted text-xs">Type</div><div className="text-white">{currentVehicle.compliance.insurance.type}</div></div>
                          <div className="text-right"><div className="text-muted text-xs">Expiry Date</div><div className="text-white">{currentVehicle.compliance.insurance.expiry}</div></div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Vehicle Log / Operational Tab */}
                {activeTab === 'operational' && (
                  <div className="operational-tab-content flex-col gap-lg">
                     <div className="flex-row space-between align-center border-bottom-subtle pb-md">
                       <h3 className="text-white text-sm m-0" style={{ letterSpacing: '2px' }}>VEHICLE EVENT LOG</h3>
                       <button className="btn-primary text-xs flex-row align-center gap-xs"><Plus size={14}/> Add Log Entry</button>
                     </div>
                     <div className="vehicle-log-timeline mt-md">
                        {currentVehicle.operationalLogs.length > 0 ? currentVehicle.operationalLogs.map(log => (
                          <div key={log.id} className="vehicle-log-entry">
                            <div className="flex-row space-between align-center mb-sm text-xs">
                              <span className="text-muted font-bold">{log.date}</span>
                              <span className="badge-valid bg-gold-dim text-gold" style={{ border: '1px solid rgba(212,175,55,0.3)' }}>{log.category}</span>
                            </div>
                            <p className="text-white text-sm mb-md">{log.description}</p>
                            <div className="flex-row space-between text-xs text-muted border-top-subtle pt-sm">
                              <span className="flex-row align-center gap-xs"><User size={12} color="var(--color-gold)"/> <span className="font-bold text-white">{log.driver}</span> ({log.driverID})</span>
                              <span className="flex-row align-center gap-xs"><Gauge size={12} color="var(--color-emerald)"/> <span className="font-bold text-white">{log.mileage}</span> mi</span>
                            </div>
                          </div>
                        )) : <p className="text-muted text-sm italic">No logs available.</p>}
                     </div>
                  </div>
                )}

                {/* Maintenance Tab */}
                {activeTab === 'maintenance' && (
                  <div className="maintenance-tab-content">
                    <h3 className="text-white text-sm mb-lg" style={{ letterSpacing: '2px' }}>MAINTENANCE & SEVERITY</h3>
                    <div className="grid-3 gap-md mb-xl">
                      <div className="surface-panel p-md rounded-lg border-subtle text-center">
                         <CheckCircle2 size={32} color="var(--color-emerald)" className="mb-sm" />
                         <div className="text-white font-bold text-sm">Engine Health</div>
                         <div className="text-xs text-muted">Nominal</div>
                      </div>
                      <div className="surface-panel p-md rounded-lg border-subtle text-center">
                         <AlertTriangle size={32} color="var(--color-gold)" className="mb-sm" />
                         <div className="text-white font-bold text-sm">Brake Pads</div>
                         <div className="text-xs text-muted">Check in 2,000 mi</div>
                      </div>
                      <div className="surface-panel p-md rounded-lg border-subtle text-center">
                         <CheckCircle2 size={32} color="var(--color-emerald)" className="mb-sm" />
                         <div className="text-white font-bold text-sm">Tyre Tread</div>
                         <div className="text-xs text-muted">Nominal</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Finance Tab */}
                {activeTab === 'finance' && (
                  <div className="finance-tab-content flex-col gap-lg">
                    <h3 className="text-white text-sm" style={{ letterSpacing: '2px' }}>FINANCIALS & AMORTIZATION</h3>
                    <div className="flex-row gap-lg">
                      <div className="flex-1 surface-panel p-xl rounded-lg border-subtle flex-col align-center justify-center">
                        <div className="donut-chart-placeholder rounded-full border-gold flex-col align-center justify-center" style={{ width: '150px', height: '150px', border: '8px solid var(--color-gold)', borderRadius: '50%' }}>
                          <span className="text-white font-bold text-lg">75%</span>
                          <span className="text-xs text-muted">Paid off</span>
                        </div>
                      </div>
                      <div className="flex-1 flex-col gap-md">
                         <div className="surface-panel p-md rounded-lg border-subtle">
                           <div className="text-xs text-muted mb-xs">Monthly Installment</div>
                           <div className="text-white font-bold text-lg">£1,250.00</div>
                         </div>
                         <div className="surface-panel p-md rounded-lg border-subtle">
                           <div className="text-xs text-muted mb-xs">Next Payment Due</div>
                           <div className="text-white font-bold text-lg">14 Jul 2026</div>
                         </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
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
    </div>
  );
};

export default FleetVault;
