import React from 'react';
import { X, UserPlus, Asterisk, ShieldCheck, Wallet, Upload } from 'lucide-react';
import './OnboardChauffeurModal.css';
import './UniversalModal.css';

const OnboardChauffeurModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">Onboard New Chauffeur</h2>
            <span className="ob-id-badge" style={{ fontSize: '10px', padding: '2px 6px', backgroundColor: 'rgba(212, 175, 55, 0.1)', color: 'var(--color-gold)', borderRadius: '4px' }}>VEO-9900</span>
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
                <input type="text" className="ob-input" placeholder="Alistair Thorne" />
              </div>

              <div className="ob-row-2">
                <div className="ob-form-group">
                  <label className="ob-form-label">DATE OF BIRTH</label>
                  <input type="date" className="ob-input" />
                </div>
                <div className="ob-form-group">
                  <label className="ob-form-label">MOBILE NUMBER</label>
                  <input type="text" className="ob-input" placeholder="+44 20 7946 0000" />
                </div>
              </div>

              <div className="ob-form-group">
                <label className="ob-form-label">EMAIL ADDRESS</label>
                <input type="email" className="ob-input" placeholder="a.thorne@velo-executive.com" />
              </div>

              <div className="ob-form-group">
                <label className="ob-form-label">RESIDENTIAL ADDRESS</label>
                <input type="text" className="ob-input" placeholder="12 Mayfair Gardens, London, W1J 7JZ" />
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
                <input type="text" className="ob-input" placeholder="Next of Kin Name" />
              </div>
              <div className="ob-form-group">
                <label className="ob-form-label">CONTACT PHONE</label>
                <input type="text" className="ob-input" placeholder="+44 7700 900000" />
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

        </div>

        {/* Persistent Footer */}
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>SAVE DRAFT</button>
          <button className="ob-btn-complete" onClick={onClose}>COMPLETE ONBOARDING</button>
        </div>

      </div>
    </div>
  );
};

export default OnboardChauffeurModal;
