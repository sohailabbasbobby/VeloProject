import React, { useState, useEffect } from 'react';
import { HelpCircle, X } from 'lucide-react';
import '../FleetVault.css';
import { createVehicle, updateVehicle } from '../../utils/api';

/**
 * ADD VEHICLE MODAL (Global Rule 7) — real, validated onboarding form saving
 * through live POST/PUT. Edit mode pre-fills from the passed database record.
 */
const AddVehicleModal = ({ isOpen, onClose, data = null, isEditMode = false, onSave = null }) => {
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [tier, setTier] = useState('EXECUTIVE');
  const [registration, setRegistration] = useState('');
  const [exteriorColor, setExteriorColor] = useState('');
  const [initialMileage, setInitialMileage] = useState('');
  const [vehiclePassengers, setVehiclePassengers] = useState(4);
  const [vehicleBags, setVehicleBags] = useState(3);
  const [motExpiry, setMotExpiry] = useState('');
  const [phvExpiry, setPhvExpiry] = useState('');
  const [insuranceExpiry, setInsuranceExpiry] = useState('');
  const [monthlyInstallment, setMonthlyInstallment] = useState('');
  const [leaseStartDate, setLeaseStartDate] = useState('');
  const [leaseEndDate, setLeaseEndDate] = useState('');
  const [totalLeaseCost, setTotalLeaseCost] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isEditMode && data) {
      setMake(data.make || '');
      setModel(data.model || '');
      setTier(data.tier || 'EXECUTIVE');
      setRegistration(data.plate_number || data.registration || '');
      setExteriorColor(data.color || '');
      setInitialMileage(data.current_odometer || 0);
      setVehiclePassengers(data.passenger_capacity || 4);
      setVehicleBags(data.baggage_capacity || 3);
      setMotExpiry(data.mot_expiry ? String(data.mot_expiry).slice(0, 10) : '');
      setPhvExpiry(data.phv_expiry ? String(data.phv_expiry).slice(0, 10) : '');
      setInsuranceExpiry(data.insurance_expiry ? String(data.insurance_expiry).slice(0, 10) : '');
      setMonthlyInstallment(data.monthly_finance_cost_pence ? String(data.monthly_finance_cost_pence / 100) : '');
      setLeaseStartDate(data.lease_start_date ? String(data.lease_start_date).slice(0, 10) : '');
      setLeaseEndDate(data.lease_end_date ? String(data.lease_end_date).slice(0, 10) : '');
      setTotalLeaseCost(data.lease_total_cost ? String(data.lease_total_cost) : '');
    } else if (!isOpen) {
      setMake(''); setModel(''); setTier('EXECUTIVE'); setRegistration(''); setExteriorColor('');
      setInitialMileage(''); setMotExpiry(''); setPhvExpiry(''); setInsuranceExpiry('');
      setMonthlyInstallment(''); setLeaseStartDate(''); setLeaseEndDate(''); setTotalLeaseCost('');
    }
  }, [isOpen, isEditMode, data]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    setError(null);
    if (!make || !model || !registration) {
      setError('Make, model and registration are required.');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        make, model, tier, plateNumber: registration.toUpperCase(), color: exteriorColor,
        currentOdometer: initialMileage ? Number(initialMileage) : 0,
        passengerCapacity: Number(vehiclePassengers), baggageCapacity: Number(vehicleBags),
        motExpiry: motExpiry || undefined, phvExpiry: phvExpiry || undefined,
        insuranceExpiry: insuranceExpiry || undefined,
        monthlyFinanceCostPence: monthlyInstallment ? Math.round(Number(monthlyInstallment) * 100) : 0,
        leaseStartDate: leaseStartDate || undefined, leaseEndDate: leaseEndDate || undefined,
        leaseTotalCost: totalLeaseCost ? Number(totalLeaseCost) : undefined,
      };
      const saved = isEditMode && (data?.id || data?.vehicle?.id)
        ? await updateVehicle(data.id || data.vehicle.id, payload)
        : await createVehicle(payload);
      if (onSave) onSave(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content add-vehicle-modal surface-panel" style={{ padding: 0 }}>
        {/* Sticky Header */}
        <div className="flex-row space-between p-xl border-bottom-subtle" style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-surface)', zIndex: 10, borderTopLeftRadius: 'var(--border-radius-md)', borderTopRightRadius: 'var(--border-radius-md)' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 16, color: '#fff' }}>{isEditMode ? 'Edit Vehicle' : 'Add New Vehicle'}</h2>
            <span style={{ fontSize: 10, color: 'var(--color-gold)' }}>{(data && (data.reference_code || data.id)) || 'VLO-XXXX'}</span>
          </div>
          <div className="flex-row gap-md">
            <button className="text-muted hover-white" style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}><HelpCircle size={20} /></button>
            <button className="text-muted hover-white" onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}>
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, overflowY: 'auto' }}>
          <label style={lbl}>MAKE *</label>
          <input style={inp} value={make} onChange={(e) => setMake(e.target.value)} placeholder="Mercedes-Benz" />
          <label style={lbl}>MODEL *</label>
          <input style={inp} value={model} onChange={(e) => setModel(e.target.value)} placeholder="S-Class" />
          <label style={lbl}>REGISTRATION *</label>
          <input style={inp} value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="LK21 XYZ" />
          <label style={lbl}>VEHICLE CLASS</label>
          <select style={inp} value={tier} onChange={(e) => setTier(e.target.value)}>
            <option value="EXECUTIVE">Executive (E-Class/5-Series)</option>
            <option value="PREMIUM_MPV">Premium MPV (V-Class/EQV)</option>
            <option value="FIRST_CLASS">First-Class Luxury (S-Class/7-Series)</option>
            <option value="ULTRA_LUXURY">Ultra-Luxury (Rolls-Royce/Bentley/Maybach)</option>
          </select>
          <label style={lbl}>COLOUR</label>
          <input style={inp} value={exteriorColor} onChange={(e) => setExteriorColor(e.target.value)} placeholder="Obsidian Black" />
          <label style={lbl}>ODOMETER (MI)</label>
          <input style={inp} type="number" value={initialMileage} onChange={(e) => setInitialMileage(e.target.value)} />
          <label style={lbl}>PASSENGER CAPACITY</label>
          <input style={inp} type="number" min="1" value={vehiclePassengers} onChange={(e) => setVehiclePassengers(e.target.value)} />
          <label style={lbl}>BAGGAGE CAPACITY</label>
          <input style={inp} type="number" min="0" value={vehicleBags} onChange={(e) => setVehicleBags(e.target.value)} />
          <label style={lbl}>MOT EXPIRY</label>
          <input style={inp} type="date" value={motExpiry} onChange={(e) => setMotExpiry(e.target.value)} />
          <label style={lbl}>PHV/PCO LICENCE EXPIRY</label>
          <input style={inp} type="date" value={phvExpiry} onChange={(e) => setPhvExpiry(e.target.value)} />
          <label style={lbl}>INSURANCE EXPIRY</label>
          <input style={inp} type="date" value={insuranceExpiry} onChange={(e) => setInsuranceExpiry(e.target.value)} />
          <label style={lbl}>MONTHLY FINANCE (£)</label>
          <input style={inp} type="number" step="0.01" value={monthlyInstallment} onChange={(e) => setMonthlyInstallment(e.target.value)} />
          <label style={lbl}>LEASE START</label>
          <input style={inp} type="date" value={leaseStartDate} onChange={(e) => setLeaseStartDate(e.target.value)} />
          <label style={lbl}>LEASE END</label>
          <input style={inp} type="date" value={leaseEndDate} onChange={(e) => setLeaseEndDate(e.target.value)} />
          <label style={lbl}>TOTAL LEASE COST (£)</label>
          <input style={inp} type="number" step="0.01" value={totalLeaseCost} onChange={(e) => setTotalLeaseCost(e.target.value)} />
        </div>

        {error && <div style={{ color: '#ff6b6b', padding: '0 16px 8px', fontSize: 12 }}>{error}</div>}

        {/* Persistent Footer + mandatory verified footer */}
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>CANCEL</button>
          <button className="ob-btn-complete" onClick={handleSubmit} disabled={saving}>
            {saving ? 'SAVING…' : isEditMode ? 'UPDATE VEHICLE' : 'REGISTER VEHICLE'}
          </button>
        </div>
        <div className="security-footer">Verified by Velo AI Security Protocol</div>
      </div>
    </div>
  );
};

const lbl = { fontSize: 10, color: '#888', letterSpacing: '0.08em', alignSelf: 'center' };
const inp = {
  backgroundColor: '#0B0B0C', border: '1px solid #2a2a2c', borderRadius: 6, color: '#fff',
  padding: '8px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
};

export default AddVehicleModal;
