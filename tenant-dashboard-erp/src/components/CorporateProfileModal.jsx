import React, { useState } from 'react';
import { X, Building2, Wallet, Contact, ShieldCheck, FileText, Copy, Shield, User, Camera } from 'lucide-react';
import corporateLogo from '../assets/corporate-logo-placeholder.png';
import './CorporateProfileModal.css';
import './UniversalModal.css';

const CorporateProfileModal = ({ isOpen, onClose, isNew }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);

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
            {isEditing ? (
              <button className="cpm-btn-save" onClick={() => setIsEditing(false)}>SAVE ACCOUNT</button>
            ) : (
              <button className="u-modal-btn-edit" onClick={() => setIsEditing(true)}>EDIT ACCOUNT</button>
            )}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="cpm-hero">
          <div className="cpm-hero-logo-container">
            <img src={corporateLogo} alt="Corporate Logo" className="cpm-hero-logo" />
            {isEditing && (
              <button className="cpm-hero-upload-btn">
                <Camera size={16} />
              </button>
            )}
          </div>
          <div className="cpm-hero-info">
            <h1 className="cpm-hero-title">{isNew ? "New Corporate Client" : "Aetheris Global Holdings"}</h1>
            <p className="cpm-hero-subtitle">Hedge Fund / Private Equity • EXECUTIVE ELITE</p>
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
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Aetheris Global Holdings"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Registration Number</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "UK-992841-B"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Sector</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Hedge Fund / Private Equity"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Primary Contact</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Julian Thorne (Chief of Staff)"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-field">
                  <label className="cpm-label">Office Address</label>
                  <input type="text" className="cpm-input" defaultValue={isNew ? "" : "14 Curzon Street, Mayfair, London, W1J 5HI, United Kingdom"} readOnly={!isEditing} />
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
                    <input type="text" className="cpm-input cpm-val-gold" defaultValue={isNew ? "" : "$50,000"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Billing Frequency</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Weekly"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Payment Terms</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Net 30"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">VAT Number</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "GB 123 4567 89"} readOnly={!isEditing} />
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Invoicing Email</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "finance@aetheris-global.com"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="cpm-field">
                  <label className="cpm-label">Bank Details (IBAN/Swift)</label>
                  <div className="cpm-input-with-action">
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "GB89 VELO 6016 1331 4455 66 • VELOUK22"} readOnly={!isEditing} />
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
                      <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Eleanor Vance"} readOnly={!isEditing} />
                    </div>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Service Tier</label>
                    <select className="cpm-input cpm-val-gold" disabled={!isEditing}>
                      <option>EXECUTIVE ELITE</option>
                      <option>PLATINUM</option>
                      <option>CORE</option>
                    </select>
                  </div>
                </div>
                <div className="cpm-grid-2">
                  <div className="cpm-field">
                    <label className="cpm-label">Preferred Vehicle Class</label>
                    <select className="cpm-input" disabled={!isEditing}>
                      <option>First Class (Maybach / Phantom)</option>
                      <option>Business Class (S-Class / 7-Series)</option>
                    </select>
                  </div>
                  <div className="cpm-field">
                    <label className="cpm-label">Special Instructions</label>
                    <input type="text" className="cpm-input" defaultValue={isNew ? "" : "Bottled Fiji Water, no scent"} readOnly={!isEditing} />
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
