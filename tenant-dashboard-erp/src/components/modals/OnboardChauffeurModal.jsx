import React, { useState, useEffect, useRef } from 'react';
import { X, UserPlus, Asterisk, ShieldCheck, Wallet, Upload } from 'lucide-react';
import './OnboardChauffeurModal.css';
import '../UniversalModal.css';
import { createDriver, updateDriver, uploadFileBytes, verifyComplianceDocument } from '../../utils/api';

/**
 * ONBOARD CHAUFFEUR MODAL (Global Rule 7) — a real, fully validated onboarding form
 * that saves through live POST/PUT. In edit mode it pre-fills from the database
 * record passed in `data`. The §1.1 pay-model selector reveals ONLY the fields
 * relevant to the chosen framework.
 */
const OnboardChauffeurModal = ({ isOpen, onClose, data = null, isEditMode = false, onSaved }) => {
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [licenseExpiry, setLicenseExpiry] = useState('');
  const [pcoBadgeNumber, setPcoBadgeNumber] = useState('');
  const [pcoExpiry, setPcoExpiry] = useState('');
  const [pcoFile, setPcoFile] = useState(null); // { base64, mime, name }
  const [paymentModel, setPaymentModel] = useState('COMMISSION');
  const [commissionRate, setCommissionRate] = useState('80');
  const [hourlyRate, setHourlyRate] = useState('25.00');
  const [tripBonus, setTripBonus] = useState('0.00');
  const [customPayJson, setCustomPayJson] = useState('{\n  "perTripRate": 0,\n  "hourlyRate": 0,\n  "fixedWeekly": 0,\n  "perMileRate": 0\n}');
  const [subscriptionOn, setSubscriptionOn] = useState(false);
  const [pensionPercent, setPensionPercent] = useState('5');
  const [studentLoan, setStudentLoan] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isEditMode && data) {
      setFullName(data.full_name || `${data.first_name || ''} ${data.last_name || ''}`.trim());
      setMobile(data.phone || '');
      setEmail(data.email || '');
      setLicenseExpiry(data.license_expiry ? String(data.license_expiry).slice(0, 10) : '');
      setPcoBadgeNumber(data.pco_badge_number || '');
      setPcoExpiry(data.pco_badge_expiry ? String(data.pco_badge_expiry).slice(0, 10) : '');
      setPaymentModel(data.payment_model || 'COMMISSION');
      setCommissionRate(data.commission_rate != null ? String(data.commission_rate) : '80');
      setHourlyRate(data.hourly_rate != null ? String(data.hourly_rate) : '25.00');
      setTripBonus(data.trip_bonus != null ? String(data.trip_bonus) : '0.00');
      setCustomPayJson(data.custom_pay_config ? JSON.stringify(data.custom_pay_config, null, 2) : '{\n  "perTripRate": 0,\n  "hourlyRate": 0,\n  "fixedWeekly": 0,\n  "perMileRate": 0\n}');
      setSubscriptionOn(data.subscription_status === 'ACTIVE');
    } else if (isOpen && !isEditMode) {
      setFullName(''); setMobile(''); setEmail(''); setLicenseExpiry(''); setPcoBadgeNumber(''); setPcoExpiry('');
      setPaymentModel('COMMISSION'); setCommissionRate('80'); setHourlyRate('25.00'); setTripBonus('0.00');
      setSubscriptionOn(false);
    }
  }, [isOpen, isEditMode, data]);

  if (!isOpen) return null;

  const splitName = () => {
    const parts = fullName.trim().split(/\s+/);
    return { firstName: parts[0] || '', lastName: parts.slice(1).join(' ') || parts[0] || '' };
  };

  const handleFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPcoFile({ base64: String(reader.result).split(',')[1], mime: file.type, name: file.name });
    reader.readAsDataURL(file);
  };

  const uploadPcoDocument = async (driverId) => {
    if (!pcoFile) return;
    const up = await uploadFileBytes(pcoFile.base64, pcoFile.mime, 'compliance');
    await verifyComplianceDocument({
      entityType: 'DRIVER', entityId: driverId, documentType: 'PCO_BADGE',
      fileUrl: up.url, fileMime: pcoFile.mime, uploadedBy: 'ERP_ONBOARDING',
    });
  };

  const handleSubmit = async () => {
    setError(null);
    const { firstName, lastName } = splitName();
    if (!firstName) { setError('Full name is required.'); return; }
    if (paymentModel === 'COMMISSION' && !(Number(commissionRate) > 0 && Number(commissionRate) <= 100)) {
      setError('Commission framework requires a driver share between 1 and 100%.'); return;
    }
    if (paymentModel === 'SALARIED' && !(Number(hourlyRate) > 0)) {
      setError('Salaried framework requires an hourly rate.'); return;
    }
    if (paymentModel === 'CUSTOM') {
      try { JSON.parse(customPayJson); } catch { setError('Custom framework requires valid JSON config.'); return; }
    }
    setSaving(true);
    try {
      const payload = {
        firstName, lastName, email, phone: mobile,
        paymentModel,
        ...(paymentModel === 'COMMISSION' ? { commissionRate: Number(commissionRate) } : {}),
        ...(paymentModel === 'SALARIED' ? { hourlyRate: Number(hourlyRate), tripBonus: Number(tripBonus) } : {}),
        ...(paymentModel === 'CUSTOM' ? { customPayConfig: JSON.parse(customPayJson) } : {}),
        ...(paymentModel === 'SUBSCRIPTION' ? { subscriptionStatus: subscriptionOn ? 'ACTIVE' : 'NONE' } : {}),
        licenseExpiry: licenseExpiry || undefined,
        pcoBadgeNumber: pcoBadgeNumber || undefined,
        pcoBadgeExpiry: pcoExpiry || undefined,
      };
      let saved;
      if (isEditMode && data?.id) {
        saved = await updateDriver(data.id, payload);
      } else {
        saved = await createDriver(payload);
      }
      if (pcoFile && saved?.id) await uploadPcoDocument(saved.id);
      if (onSaved) onSaved(saved);
      onClose();
    } catch (err) {
      setError(err.message || 'Save failed.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isEditMode ? 'Edit Chauffeur' : 'Onboard New Chauffeur'}</h2>
            <span className="ob-id-badge" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-gold)', borderRadius: '4px' }}>
              {data?.reference_code || '#V-XXXX'}
            </span>
          </div>
          <div className="u-modal-header-actions">
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="u-modal-body">

          <div className="ob-primary-grid">
            <div className="ob-form-group">
              <label className="ob-form-label">PROFILE IMAGE</label>
              <div className="ob-portrait-upload">
                <UserPlus size={24} />
                <span className="ob-portrait-text">Upload Portrait</span>
              </div>
            </div>

            <div className="ob-fields-col">
              <div className="ob-form-group">
                <label className="ob-form-label">FULL NAME *</label>
                <input type="text" className="ob-input" placeholder="Alistair Thorne" value={fullName} onChange={(e) => setFullName(e.target.value)} />
              </div>
              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">MOBILE NUMBER</label>
                  <input type="text" className="ob-input" placeholder="+44 20 7946 0000" value={mobile} onChange={(e) => setMobile(e.target.value)} />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">EMAIL ADDRESS</label>
                  <input type="email" className="ob-input" placeholder="a.thorne@velo-executive.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
              </div>
            </div>
          </div>

          {/* Compliance & Credentials */}
          <div className="ob-section">
            <div className="ob-section-header">
              <ShieldCheck size={18} />
              <span>Compliance & Credentials</span>
            </div>
            <div className="ob-fields-col">
              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">DRIVING LICENSE EXPIRY DATE</label>
                  <input type="date" className="ob-input" value={licenseExpiry} onChange={(e) => setLicenseExpiry(e.target.value)} />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">&nbsp;</label>
                  <button className="ob-btn-outline" style={{ height: '100%', justifyContent: 'center' }}>
                    <Upload size={14} /> UPLOAD SCAN
                  </button>
                </div>
              </div>
              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">PCO BADGE NUMBER</label>
                  <input type="text" className="ob-input" placeholder="Badge reference" value={pcoBadgeNumber} onChange={(e) => setPcoBadgeNumber(e.target.value)} />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">PCO EXPIRY DATE</label>
                  <input type="date" className="ob-input" value={pcoExpiry} onChange={(e) => setPcoExpiry(e.target.value)} />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">&nbsp;</label>
                  <button className="ob-btn-outline gold" style={{ height: '100%', justifyContent: 'center' }} onClick={() => fileInputRef.current?.click()}>
                    📄 MANDATORY PCO UPLOAD
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*,application/pdf" style={{ display: 'none' }} onChange={handleFile} />
                  {pcoFile && <span style={{ fontSize: 10, color: 'var(--color-gold)' }}>{pcoFile.name} ready — AI verification runs on save</span>}
                </div>
              </div>
            </div>
          </div>

          {/* Financial Framework — §1.1 dynamic pay-model selector */}
          <div className="ob-section">
            <div className="ob-section-header">
              <Wallet size={18} />
              <span>Driver Pay Framework</span>
            </div>
            <div className="ob-fields-col">
              <div className="ob-form-group">
                <label className="ob-form-label">PAY MODEL *</label>
                <select className="ob-input" value={paymentModel} onChange={(e) => setPaymentModel(e.target.value)}>
                  <option value="COMMISSION">Percentage Revenue Share (Commission)</option>
                  <option value="SALARIED">Hourly + Trip Bonus (Salaried)</option>
                  <option value="CUSTOM">Custom Framework</option>
                  <option value="SUBSCRIPTION">Subscription — £50.00/week, 0% commission</option>
                </select>
              </div>

              {paymentModel === 'COMMISSION' && (
                <div className="ob-form-group">
                  <label className="ob-form-label">DRIVER KEEPS (%)</label>
                  <input type="number" min="1" max="100" className="ob-input" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} placeholder="e.g. 80" />
                </div>
              )}

              {paymentModel === 'SALARIED' && (
                <div className="ob-row-2">
                  <div className="ob-form-group">
                    <label className="ob-form-label">BASE HOURLY RATE (£)</label>
                    <input type="number" step="0.01" className="ob-input" value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} />
                  </div>
                  <div className="ob-form-group">
                    <label className="ob-form-label">BONUS PER COMPLETED TRIP (£)</label>
                    <input type="number" step="0.01" className="ob-input" value={tripBonus} onChange={(e) => setTripBonus(e.target.value)} />
                  </div>
                </div>
              )}

              {paymentModel === 'CUSTOM' && (
                <div className="ob-form-group">
                  <label className="ob-form-label">CUSTOM PAY CONFIG (JSON — engine computes from these variables)</label>
                  <textarea className="ob-input" rows={5} value={customPayJson} onChange={(e) => setCustomPayJson(e.target.value)} />
                </div>
              )}

              {paymentModel === 'SUBSCRIPTION' && (
                <div className="ob-row-2">
                  <div className="ob-form-group">
                    <label className="ob-form-label">WEEKLY SUBSCRIPTION</label>
                    <div className="ob-input" style={{ display: 'flex', alignItems: 'center' }}>£50.00 / week — 0% commission</div>
                  </div>
                  <div className="ob-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                    <label className="ob-form-label">SUBSCRIPTION STATUS</label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <input type="checkbox" checked={subscriptionOn} onChange={(e) => setSubscriptionOn(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--color-gold)' }} />
                      <span style={{ fontSize: 14, color: '#fff' }}>Active — bill weekly via ledger</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">PENSION CONTRIBUTION (%)</label>
                  <input type="number" className="ob-input" value={pensionPercent} onChange={(e) => setPensionPercent(e.target.value)} />
                </div>
                <div className="ob-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="ob-form-label">STUDENT LOAN DEDUCTION</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <input type="checkbox" checked={studentLoan} onChange={(e) => setStudentLoan(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }} />
                    <span style={{ fontSize: '14px', color: '#fff' }}>Enable Plan 1/2 Deductions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Persistent Footer — fixed size modal, mandatory verified footer */}
        {error && <div className="ob-error-bar" style={{ color: '#ff6b6b', padding: '6px 16px', fontSize: 12 }}>{error}</div>}
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>CANCEL</button>
          <button className="ob-btn-complete" onClick={handleSubmit} disabled={saving}>
            {saving ? 'SAVING…' : isEditMode ? 'UPDATE CHAUFFEUR' : 'COMPLETE ONBOARDING'}
          </button>
        </div>
        <div className="security-footer">Verified by Velo AI Security Protocol</div>
      </div>
    </div>
  );
};

export default OnboardChauffeurModal;
