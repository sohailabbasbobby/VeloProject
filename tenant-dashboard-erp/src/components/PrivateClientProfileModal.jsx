import React, { useState } from 'react';
import { X, User, CreditCard, Star, ShieldCheck, FileText, Lock, Shield } from 'lucide-react';
import './PrivateClientProfileModal.css';
import './UniversalModal.css';

const PrivateClientProfileModal = ({ isOpen, onClose, isNew }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isEditing, setIsEditing] = useState(isNew || false);

  if (!isOpen) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">{isNew ? "Onboard Private Client" : "Private Client Profile"}</h2>
          </div>
          <div className="u-modal-header-actions">
            {isEditing ? (
              <button className="pcpm-btn-save" onClick={() => setIsEditing(false)}>SAVE CLIENT</button>
            ) : (
              <button className="u-modal-btn-edit" onClick={() => setIsEditing(true)}>EDIT CLIENT</button>
            )}
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'rides' ? 'active' : ''}`} onClick={() => setActiveTab('rides')}>RIDE HISTORY</button>
          <button className={`u-modal-tab ${activeTab === 'billing' ? 'active' : ''}`} onClick={() => setActiveTab('billing')}>PAYMENT METHODS</button>
          <button className={`u-modal-tab ${activeTab === 'preferences' ? 'active' : ''}`} onClick={() => setActiveTab('preferences')}>PREFERENCES</button>
        </div>

        {/* Body */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              {/* Identity */}
              <div className="pcpm-section">
                <div className="pcpm-section-header">
                  <User size={16} /> PERSONAL IDENTITY
                </div>
                <div className="pcpm-grid-2">
                  <div className="pcpm-field">
                    <label className="pcpm-label">Full Name</label>
                    <input type="text" className="pcpm-input" defaultValue={isNew ? "" : "Alexander Sterling"} readOnly={!isEditing} />
                  </div>
                  <div className="pcpm-field">
                    <label className="pcpm-label">Date of Birth</label>
                    <input type="date" className="pcpm-input" defaultValue={isNew ? "" : "1978-04-12"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="pcpm-grid-2">
                  <div className="pcpm-field">
                    <label className="pcpm-label">Primary Contact Number</label>
                    <input type="text" className="pcpm-input" defaultValue={isNew ? "" : "+44 7700 900111"} readOnly={!isEditing} />
                  </div>
                  <div className="pcpm-field">
                    <label className="pcpm-label">Email Address</label>
                    <input type="email" className="pcpm-input" defaultValue={isNew ? "" : "a.sterling@private-domain.com"} readOnly={!isEditing} />
                  </div>
                </div>
                <div className="pcpm-field">
                  <label className="pcpm-label">Primary Residence</label>
                  <input type="text" className="pcpm-input" defaultValue={isNew ? "" : "42 Kensington Palace Gardens, London, W8 4QQ"} readOnly={!isEditing} />
                </div>
              </div>

              {/* Financial & Billing */}
              <div className="pcpm-section">
                <div className="pcpm-section-header">
                  <CreditCard size={16} /> FINANCIAL & BILLING
                </div>
                <div className="pcpm-grid-2">
                  <div className="pcpm-field">
                    <label className="pcpm-label">Primary Card</label>
                    <input type="text" className="pcpm-input pcpm-val-gold" defaultValue={isNew ? "" : "AMEX Centurion •••• 1004"} readOnly={!isEditing} />
                  </div>
                  <div className="pcpm-field">
                    <label className="pcpm-label">Default Currency</label>
                    <select className="pcpm-input" disabled={!isEditing}>
                      <option>GBP (£)</option>
                      <option>USD ($)</option>
                      <option>EUR (€)</option>
                    </select>
                  </div>
                </div>
                <div className="pcpm-field">
                  <label className="pcpm-label">Billing Address (If different)</label>
                  <input type="text" className="pcpm-input" defaultValue={isNew ? "" : "Same as Primary Residence"} readOnly={!isEditing} />
                </div>
              </div>

              {/* VIP Preferences */}
              <div className="pcpm-section">
                <div className="pcpm-section-header">
                  <Star size={16} /> VIP PREFERENCES
                </div>
                <div className="pcpm-grid-2">
                  <div className="pcpm-field">
                    <label className="pcpm-label">Dedicated Chauffeur (Optional)</label>
                    <div className="pcpm-input-with-icon">
                      <User size={14} className="pcpm-input-icon" />
                      <input type="text" className="pcpm-input" defaultValue={isNew ? "" : "Julian Sterling (VEO-9921)"} readOnly={!isEditing} />
                    </div>
                  </div>
                  <div className="pcpm-field">
                    <label className="pcpm-label">Preferred Vehicle Class</label>
                    <select className="pcpm-input pcpm-val-gold" disabled={!isEditing}>
                      <option>First Class (Maybach / Phantom)</option>
                      <option>Business Class (S-Class / 7-Series)</option>
                      <option>SUV (Range Rover / Cullinan)</option>
                    </select>
                  </div>
                </div>
                <div className="pcpm-field">
                  <label className="pcpm-label">Cabin Preferences & Dietary</label>
                  <input type="text" className="pcpm-input" defaultValue={isNew ? "" : "San Pellegrino strictly at room temp, Financial Times, no cabin fragrance"} readOnly={!isEditing} />
                </div>
              </div>

              {/* Security & Identity */}
              <div className="pcpm-section">
                <div className="pcpm-section-header">
                  <ShieldCheck size={16} /> SECURITY & IDENTITY
                </div>
                <div className="pcpm-grid-2">
                  <div className="pcpm-doc-card">
                    <div className="pcpm-doc-info">
                      <FileText size={14} /> Passport / Govt ID
                    </div>
                    {isNew ? <span className="pcpm-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>UPLOAD</span> : <span className="pcpm-badge-valid">VERIFIED</span>}
                  </div>
                  <div className="pcpm-doc-card">
                    <div className="pcpm-doc-info">
                      <Lock size={14} /> Background / Security Check
                    </div>
                    {isNew ? <span className="pcpm-update-link" style={{fontSize: '10px', color: 'var(--color-gold)', cursor: 'pointer'}}>INITIATE</span> : <span className="pcpm-badge-valid">CLEARED</span>}
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

export default PrivateClientProfileModal;
