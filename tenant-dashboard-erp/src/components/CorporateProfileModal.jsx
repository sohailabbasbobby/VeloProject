import React, { useState } from 'react';
import { X, Building2, Wallet, Contact, ShieldCheck, FileText, Copy, Shield, User } from 'lucide-react';
import './CorporateProfileModal.css';
import './UniversalModal.css';

const CorporateProfileModal = ({ isOpen, onClose, isNew }) => {
  const [activeTab, setActiveTab] = useState('overview');

  if (!isOpen) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isNew ? "Onboard Corporate Client" : "Corporate Account Profile"}</h2>
          </div>
          <div className="u-modal-header-actions">
            <button className="u-modal-btn-edit">EDIT ACCOUNT</button>
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'bookings' ? 'active' : ''}`} onClick={() => setActiveTab('bookings')}>ACTIVE BOOKINGS</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>BILLING HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'users' ? 'active' : ''}`} onClick={() => setActiveTab('users')}>AUTHORIZED USERS</button>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              {/* Identity & Location */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <Building2 size={16} /> IDENTITY & LOCATION
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Company Name</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Aetheris Global Holdings"} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Registration Number</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "UK-992841-B"} />
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Sector</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Hedge Fund / Private Equity"} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Primary Contact</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Julian Thorne (Chief of Staff)"} />
                  </div>
                </div>
                <div className="cpm-field">
                  <label className="cpm-label">Office Address</label>
                  <input type="text" className="cpm-input" defaultValue={isNew ? "" : "14 Curzon Street, Mayfair, London, W1J 5HI, United Kingdom"} />
                </div>
              </div>

              {/* Financial Framework */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <Wallet size={16} /> FINANCIAL FRAMEWORK
                </div>
                <div className="cpm-grid-3">
                  <div className="cpm-field">
                    <label className="cpm-label">Credit Limit</label>
                    <input type="text" className="cpm-input cpm-val-gold" defaultValue={isNew ? "" : "$50,000"} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Billing Frequency</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Weekly"} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Payment Terms</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Net 30"} />
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">VAT Number</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "GB 123 4567 89"} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Invoicing Email</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "finance@aetheris-global.com"} />
                  </div>
                </div>
                <div className="cpm-field">
                  <label className="cpm-label">Bank Details (IBAN/Swift)</label>
                  <div className="cpm-input-with-action">
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "GB89 VELO 6016 1331 4455 66 • VELOUK22"} />
                    <Copy size={14} className="cpm-input-action" />
                  </div>
                </div>
              </div>

              {/* SLA & Preferences */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <Contact size={16} /> SLA & PREFERENCES
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Account Manager</label>
                    <div className="cpm-input-with-icon">
                      <User size={14} className="cpm-input-icon" />
                      <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Eleanor Vance"} />
                    </div>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Service Tier</label>
                    <select className="cpm-input cpm-val-gold">
                      <option>EXECUTIVE ELITE</option>
                      <option>PLATINUM</option>
                      <option>CORE</option>
                    </select>
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Preferred Vehicle Class</label>
                    <select className="cpm-input">
                      <option>First Class (Maybach / Phantom)</option>
                      <option>Business Class (S-Class / 7-Series)</option>
                    </select>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Special Instructions</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Bottled Fiji Water, no scent"} />
                  </div>
                </div>
              </div>

              {/* Compliance & Documentation */}
              <div className="cpm-section">
                <div className="cpm-section-header">
                  <ShieldCheck size={16} /> COMPLIANCE & DOCUMENTATION
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-doc-card">
                    <div className="cpm-doc-info">
                      <FileText size={14} /> Master Service Agreement
                    </div>
                    {isNew ? <span className="cpm-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="cpm-badge-valid">VALID</span>}
                  </div>
                  <div className="cpm-doc-card">
                    <div className="cpm-doc-info">
                      <Shield size={14} /> Corporate Insurance
                    </div>
                    {isNew ? <span className="cpm-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="cpm-badge-valid">VALID</span>}
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Persistent Footer */}
        <div className="u-modal-footer">
          <div className="u-modal-footer-badge">
            <ShieldCheck size={14} color="var(--color-gold)" /> VERIFIED BY VELO AI SECURITY PROTOCOL
          </div>
        </div>

      </div>
    </div>
  );
};

export default CorporateProfileModal;
