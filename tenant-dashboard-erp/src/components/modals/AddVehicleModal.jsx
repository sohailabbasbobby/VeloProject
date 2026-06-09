import React, { useState, useEffect } from 'react';
import { HelpCircle, X, Camera, AlertCircle, Award, Shield, Upload, Building2, MapPin, User, FileText, ShieldCheck } from 'lucide-react';
import '../FleetVault.css';

const AddVehicleModal = ({ isOpen, onClose, data = null, isEditMode = false, onSave = null }) => {
  const [onboardType, setOnboardType] = useState('Fleet');
  const [vehiclePassengers, setVehiclePassengers] = useState(4);
  const [vehicleBags, setVehicleBags] = useState(3);
  
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [registration, setRegistration] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [initialMileage, setInitialMileage] = useState('');

  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [outstandingBalance, setOutstandingBalance] = useState('');
  const [assetValuation, setAssetValuation] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [totalLeaseTerm, setTotalLeaseTerm] = useState('');

  useEffect(() => {
    if (isEditMode && data) {
      setMake(data.make || '');
      setModel(data.model || '');
      setRegistration(data.registration || '');
      setExteriorColor(data.color || '');
      setInitialMileage(data.mileage || 0);
      setVehiclePassengers(data.passengers || 4);
      setVehicleBags(data.bags || 3);
      if (data.financials) {
        setMonthlyInstallment(data.financials.monthlyInstallment || '');
        setOutstandingBalance(data.financials.outstandingBalance || '');
        setAssetValuation(data.financials.assetValuation || '');
        setLeaseStartDate(data.financials.leaseStartDate || '');
        setLeaseEndDate(data.financials.leaseEndDate || '');
        setTotalLeaseTerm(data.financials.totalLeaseTerm || '');
      }
    } else if (!isOpen) {
      setMake('');
      setModel('');
      setRegistration('');
      setExteriorColor('');
      setInitialMileage('');
      setMonthlyInstallment('');
      setOutstandingBalance('');
      setAssetValuation('');
      setLeaseStartDate('');
      setLeaseEndDate('');
      setTotalLeaseTerm('');
    }
  }, [isOpen, isEditMode, data]);

  const handleSubmit = () => {
    const payload = {
      make, model, registration, exteriorColor, initialMileage, vehiclePassengers, vehicleBags,
      financials: {
        monthlyInstallment, outstandingBalance, assetValuation, leaseStartDate, leaseEndDate, totalLeaseTerm
      }
    };
    if (isEditMode) {
      console.log(`[PUT/PATCH] Updating vehicle ${data?.id}`, payload);
    } else {
      console.log(`[POST] Creating new vehicle`, payload);
    }
    if (onSave) onSave(payload);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content add-vehicle-modal surface-panel" style={{ padding: 0 }}>
         {/* Sticky Header */}
         <div className="flex-row space-between p-xl border-bottom-subtle" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 10, borderTopLeftRadius: 'var(--border-radius-md)', borderTopRightRadius: 'var(--border-radius-md)' }}>
           <div>
             {/* Heading moved below */}
           </div>
           <div className="flex-row gap-md">
             <button className="text-muted hover-white" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><HelpCircle size={20}/></button>
             <button className="text-muted hover-white" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
               <X size={20} />
             </button>
           </div>
         </div>
         
         {/* Scrollable Body */}
         <div className="modal-body add-vehicle-body p-xl">
           <div className="modal-split-layout" style={{ margin: 0 }}>
             
             {/* LEFT COLUMN */}
             <div className="flex-col gap-sm">
               
               <h2 className="text-white m-0 mb-md">{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>

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
                     <input type="text" className="input-field" placeholder="e.g. Mercedes-Benz" value={make} onChange={(e) => setMake(e.target.value)} />
                   </div>
                   <div className="form-group">
                     <label>Model</label>
                     <input type="text" className="input-field" placeholder="e.g. S-Class" value={model} onChange={(e) => setModel(e.target.value)} />
                   </div>
                   <div className="form-group">
                     <label>Registration Number</label>
                     <input type="text" className="input-field" placeholder="LV72 XXX" value={registration} onChange={(e) => setRegistration(e.target.value)} />
                   </div>
                   <div className="form-group">
                     <label>Exterior Color</label>
                     <input type="text" className="input-field" placeholder="e.g. Obsidian Black" value={exteriorColor} onChange={(e) => setExteriorColor(e.target.value)} />
                   </div>
                   <div className="form-group span-2">
                     <label>Initial Mileage</label>
                     <input type="number" className="input-field w-100" placeholder="0" value={initialMileage} onChange={(e) => setInitialMileage(e.target.value)} />
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

               {/* 5. Financial Data */}
               <div className="flex-col mt-md">
                 <h3 className="text-xs text-muted font-bold tracking-wider mb-sm">5. FINANCIAL DATA</h3>
                 <div className="form-grid" style={{ gridAutoRows: 'min-content' }}>
                   <div className="form-group">
                     <label>Monthly Installment</label>
                     <div style={{ position: 'relative' }}>
                       <span style={{ position: 'absolute', left: 10, top: 10, color: '#888' }}>£</span>
                       <input type="number" className="input-field w-100" style={{ paddingLeft: '24px' }} placeholder="0.00" value={monthlyInstallment} onChange={(e) => setMonthlyInstallment(e.target.value)} />
                     </div>
                   </div>
                   <div className="form-group">
                     <label>Outstanding Balance</label>
                     <div style={{ position: 'relative' }}>
                       <span style={{ position: 'absolute', left: 10, top: 10, color: '#888' }}>£</span>
                       <input type="number" className="input-field w-100" style={{ paddingLeft: '24px' }} placeholder="0.00" value={outstandingBalance} onChange={(e) => setOutstandingBalance(e.target.value)} />
                     </div>
                   </div>
                   <div className="form-group span-2">
                     <label>Asset Valuation</label>
                     <div style={{ position: 'relative' }}>
                       <span style={{ position: 'absolute', left: 10, top: 10, color: '#888' }}>£</span>
                       <input type="number" className="input-field w-100" style={{ paddingLeft: '24px' }} placeholder="0.00" value={assetValuation} onChange={(e) => setAssetValuation(e.target.value)} />
                     </div>
                   </div>
                   <div className="form-group">
                     <label>Lease Start Date</label>
                     <input type="date" className="input-field w-100" style={{ colorScheme: 'dark' }} value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} />
                   </div>
                   <div className="form-group">
                     <label>Lease End Date</label>
                     <input type="date" className="input-field w-100" style={{ colorScheme: 'dark' }} value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} />
                   </div>
                   <div className="form-group span-2">
                     <label>Total Lease Term (Months)</label>
                     <input type="number" className="input-field w-100" placeholder="e.g. 36" value={totalLeaseTerm} onChange={(e) => setTotalLeaseTerm(e.target.value)} />
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
              <button className="btn-primary font-bold" onClick={handleSubmit}>
                {isEditMode ? 'UPDATE ASSET RECORD' : 'REGISTER ASSET TO VAULT'}
              </button>
            </div>
         </div>
       </div>
    </div>
  );
};

export default AddVehicleModal;
