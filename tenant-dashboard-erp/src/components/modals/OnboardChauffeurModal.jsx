import React, { useState, useEffect } from 'react';
import { X, UserPlus, Asterisk, ShieldCheck, Wallet, Upload } from 'lucide-react';
import './OnboardChauffeurModal.css';
import '../UniversalModal.css';

const OnboardChauffeurModal = ({ isOpen, onClose, data = null, isEditMode = false }) => {
  const [fullName, setFullName] = useState('');
  const [dob, setDob] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  
  // Payroll & Remuneration State
  const [hourlyRate, setHourlyRate] = useState('25.00');
  const [payFrequency, setPayFrequency] = useState('Weekly');
  const [taxCode, setTaxCode] = useState('1257L');
  const [niCategory, setNiCategory] = useState('A');
  const [pensionPercent, setPensionPercent] = useState('5');
  const [studentLoan, setStudentLoan] = useState(false);

  useEffect(() => {
    if (isEditMode && data) {
      setFullName(data.name || '');
      setMobile(data.mobile || '');
      setEmail(data.email || '');
      setAddress(data.address || '');
      // Assuming mock data might not have dob, emergencyName, etc.
    } else if (!isOpen) {
      setFullName('');
      setDob('');
      setMobile('');
      setEmail('');
      setAddress('');
      setEmergencyName('');
      setEmergencyPhone('');
      setHourlyRate('25.00');
      setPayFrequency('Weekly');
      setTaxCode('1257L');
      setNiCategory('A');
      setPensionPercent('5');
      setStudentLoan(false);
    }
  }, [isOpen, isEditMode, data]);

  const handleSubmit = () => {
    const payload = { fullName, email, mobile, hourlyRate, payFrequency, taxCode, niCategory, pensionPercent, studentLoan };
    if (isEditMode) {
      console.log(`[PUT/PATCH] Updating chauffeur ${data?.id}`, payload);
    } else {
      console.log(`[POST] Creating new chauffeur`, payload);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isEditMode ? 'Edit Chauffeur' : 'Onboard New Chauffeur'}</h2>
            <span className="ob-id-badge" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-gold)', borderRadius: '4px' }}>{data?.id || 'VEO-9900'}</span>
          </div>
          <div className="u-modal-header-actions">
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          
          {/* Primary Info */}
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
                <label className="ob-form-label">FULL NAME</label>
                <input type="text" className="ob-input" placeholder="Alistair Thorne" value={fullName} onChange={e => setFullName(e.target.value)} />
              </div>

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">DATE OF BIRTH</label>
                  <input type="date" className="ob-input" value={dob} onChange={e => setDob(e.target.value)} />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">MOBILE NUMBER</label>
                  <input type="text" className="ob-input" placeholder="+44 20 7946 0000" value={mobile} onChange={e => setMobile(e.target.value)} />
                </div>
              </div>

              <div className="ob-form-group">
                <label className="ob-form-label">EMAIL ADDRESS</label>
                <input type="email" className="ob-input" placeholder="a.thorne@velo-executive.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div className="ob-form-group">
                <label className="ob-form-label">RESIDENTIAL ADDRESS</label>
                <input type="text" className="ob-input" placeholder="12 Mayfair Gardens, London, W1J 7JZ" value={address} onChange={e => setAddress(e.target.value)} />
              </div>
            </div>
          </div>

          {/* Emergency Contact */}
          <div className="ob-section">
            <div className="ob-section-header">
              <Asterisk size={18} />
              <span>Emergency Contact</span>
            </div>
            <div className="ob-row-2">
              <div className="ob-form-group">
                <label className="ob-form-label">CONTACT NAME</label>
                <input type="text" className="ob-input" placeholder="Next of Kin Name" value={emergencyName} onChange={e => setEmergencyName(e.target.value)} />
              </div>
              <div className="ob-form-group">
                <label className="ob-form-label">CONTACT PHONE</label>
                <input type="text" className="ob-input" placeholder="+44 7700 900000" value={emergencyPhone} onChange={e => setEmergencyPhone(e.target.value)} />
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
                  <input type="date" className="ob-input" />
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
                  <label className="ob-form-label">PCO START DATE</label>
                  <input type="date" className="ob-input" />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">PCO EXPIRY DATE</label>
                  <input type="date" className="ob-input" />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">&nbsp;</label>
                  <button className="ob-btn-outline gold" style={{ height: '100%', justifyContent: 'center' }}>
                    📄 MANDATORY PCO UPLOAD
                  </button>
                </div>
              </div>

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">NATIONAL INSURANCE NUMBER</label>
                  <input type="text" className="ob-input" placeholder="AB 12 34 56 C" />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">DBS/BACKGROUND CHECK REF</label>
                  <div className="ob-input-with-btn">
                    <input type="text" className="ob-input" placeholder="Reference Number" />
                    <button className="ob-btn-outline gold">
                      <ShieldCheck size={14} /> MANDATORY DBS
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Financial Framework */}
          <div className="ob-section">
            <div className="ob-section-header">
              <Wallet size={18} />
              <span>Financial Framework</span>
            </div>
            
            <div className="ob-fields-col">
              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">CONTRACT TYPE</label>
                  <select className="ob-input">
                    <option>Revenue Share per hour</option>
                    <option>Fixed Rate</option>
                  </select>
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">VALUE FIELD ( % / £ )</label>
                  <div className="ob-input-with-btn">
                    <input type="text" className="ob-input" placeholder="e.g. 45" />
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: 'var(--color-text-muted)', fontWeight: 'bold' }}>VAL</span>
                  </div>
                </div>
              </div>

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">SORT CODE</label>
                  <input type="text" className="ob-input" placeholder="00-00-00" />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">ACCOUNT NUMBER</label>
                  <input type="text" className="ob-input" placeholder="12345678" />
                </div>
              </div>
            </div>
          </div>

          {/* Payroll & Remuneration */}
          <div className="ob-section">
            <div className="ob-section-header">
              <Asterisk size={18} />
              <span>5. Payroll & Remuneration</span>
            </div>
            
            <div className="ob-fields-col">
              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">BASE HOURLY RATE</label>
                  <div className="ob-input-with-btn">
                    <span style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: 'var(--color-text-muted)', paddingLeft: '12px' }}>£</span>
                    <input type="text" className="ob-input" style={{ paddingLeft: '8px' }} value={hourlyRate} onChange={e => setHourlyRate(e.target.value)} />
                  </div>
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">PAY FREQUENCY</label>
                  <select className="ob-input" value={payFrequency} onChange={e => setPayFrequency(e.target.value)}>
                    <option>Weekly</option>
                    <option>Fortnightly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">TAX CODE</label>
                  <input type="text" className="ob-input" value={taxCode} onChange={e => setTaxCode(e.target.value)} />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">NI CATEGORY</label>
                  <select className="ob-input" value={niCategory} onChange={e => setNiCategory(e.target.value)}>
                    <option>A (Standard)</option>
                    <option>B (Married Women's)</option>
                    <option>C (Over State Pension Age)</option>
                    <option>H (Apprentice under 25)</option>
                    <option>M (Under 21)</option>
                  </select>
                </div>
              </div>

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">PENSION CONTRIBUTION (%)</label>
                  <input type="number" className="ob-input" value={pensionPercent} onChange={e => setPensionPercent(e.target.value)} />
                </div>
                <div className="ob-form-group" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <label className="ob-form-label">STUDENT LOAN DEDUCTION</label>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                    <input type="checkbox" checked={studentLoan} onChange={e => setStudentLoan(e.target.checked)} style={{ width: '16px', height: '16px', accentColor: 'var(--color-gold)' }} />
                    <span style={{ fontSize: '14px', color: '#fff' }}>Enable Plan 1/2 Deductions</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Persistent Footer */}
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>SAVE DRAFT</button>
          <button className="ob-btn-complete" onClick={handleSubmit}>
            {isEditMode ? 'UPDATE CHAUFFEUR' : 'COMPLETE ONBOARDING'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default OnboardChauffeurModal;
