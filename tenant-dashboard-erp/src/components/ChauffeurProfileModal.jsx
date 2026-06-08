import React, { useState } from 'react';
import { User, MessageSquare, Phone, Briefcase, Lock, CarFront, Asterisk, ShieldCheck, Wallet, X } from 'lucide-react';
import './ChauffeurProfileModal.css';
import './UniversalModal.css';

const ChauffeurProfileModal = ({ chauffeur, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [isAssignJobModalOpen, setIsAssignJobModalOpen] = useState(false);

  if (!chauffeur) return null;

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      {isAssignJobModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setIsAssignJobModalOpen(false)}>
          <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--color-gold)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--color-gold)', marginTop: 0, marginBottom: '16px', letterSpacing: '1px' }}>ASSIGN UNASSIGNED JOB</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>JOB-8902</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>LHR T5 to The Savoy</div>
                </div>
                <button className="u-modal-btn-outline" onClick={() => { alert('Job Assigned to ' + chauffeur.name); setIsAssignJobModalOpen(false); }}>ASSIGN</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>JOB-8905</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>O2 Arena to Mayfair</div>
                </div>
                <button className="u-modal-btn-outline" onClick={() => { alert('Job Assigned to ' + chauffeur.name); setIsAssignJobModalOpen(false); }}>ASSIGN</button>
              </div>
            </div>
            <button className="u-modal-btn-primary" onClick={() => setIsAssignJobModalOpen(false)} style={{marginTop: '24px', width: '100%'}}>CANCEL</button>
          </div>
        </div>
      )}
      <div className="u-modal-container" onClick={e => e.stopPropagation()}>
        
        {/* Top Header */}
        <div className="u-modal-header">
          <div className="u-modal-header-left">
            <h2 className="u-modal-title">CHAUFFEUR PROFILE: {chauffeur.id}</h2>
          </div>
          <div className="u-modal-header-actions">
            <button className="u-modal-btn-edit">EDIT DRIVER</button>
            <button className="u-modal-btn-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Hero Section */}
        <div className="u-modal-hero">
          <div className="u-modal-hero-top">
            <div className="u-modal-hero-avatar-container" style={{ backgroundImage: chauffeur?.image ? `url(${chauffeur.image})` : 'none', backgroundSize: 'cover', backgroundPosition: 'center' }}>
              {!chauffeur.image && <User size={40} color="rgba(255,255,255,0.2)" />}
            </div>
            
            <div className="u-modal-hero-info">
              <h1 className="u-modal-hero-title">{chauffeur.name}</h1>
              <p className="u-modal-hero-subtitle">VEO-ID: {chauffeur.id} • <span style={{color: 'var(--color-gold)'}}>{chauffeur.status}</span></p>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button className="u-modal-btn-edit">
                <MessageSquare size={14} /> MESSAGE
              </button>
              <button className="u-modal-btn-save" onClick={() => setIsAssignJobModalOpen(true)}>
                <Briefcase size={14} /> ASSIGN JOB
              </button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="u-modal-tabs">
          <button className={`u-modal-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</button>
          <button className={`u-modal-tab ${activeTab === 'live_job' ? 'active' : ''}`} onClick={() => setActiveTab('live_job')}>LIVE JOB</button>
          <button className={`u-modal-tab ${activeTab === 'shift_log' ? 'active' : ''}`} onClick={() => setActiveTab('shift_log')}>SHIFT LOG</button>
          <button className={`u-modal-tab ${activeTab === 'maintenance' ? 'active' : ''}`} onClick={() => setActiveTab('maintenance')}>MAINTENANCE</button>
          <button className={`u-modal-tab ${activeTab === 'financials' ? 'active' : ''}`} onClick={() => setActiveTab('financials')}>FINANCIALS</button>
        </div>

        {/* Body Content */}
        <div className="u-modal-body">
          {activeTab === 'overview' && (
            <>
              <div className="u-modal-grid-2-col">
                {/* Left Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="u-modal-section">
                    <div className="u-modal-section-header">
                      <User size={18} />
                      Personal Identity
                    </div>
                    
                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">FULL NAME</span>
                        <span className="u-modal-data-value">{chauffeur.name}</span>
                      </div>
                    </div>

                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">DATE OF BIRTH</span>
                        <span className="u-modal-data-value">12 SEP 1972</span>
                      </div>
                    </div>

                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">MOBILE NUMBER</span>
                        <span className="u-modal-data-value">+44 20 7946 0000</span>
                      </div>
                      <span className="u-modal-update-link">UPDATE</span>
                    </div>

                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">EMAIL ADDRESS</span>
                        <span className="u-modal-data-value">j.sterling@velo-executive.com</span>
                      </div>
                      <span className="u-modal-update-link">UPDATE</span>
                    </div>

                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">RESIDENTIAL ADDRESS</span>
                        <span className="u-modal-data-value">12 Mayfair Gardens, London, W1J 7JZ</span>
                      </div>
                    </div>
                  </div>

                  <div className="u-modal-section">
                    <div className="u-modal-section-header gold">
                      <Asterisk size={18} />
                      Emergency Contact
                    </div>
                    
                    <div className="u-modal-inner-grid">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">CONTACT NAME</span>
                        <span className="u-modal-data-value">Eleanor Sterling</span>
                      </div>
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">CONTACT PHONE</span>
                        <span className="u-modal-data-value">+44 7700 900000</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                  <div className="u-modal-section">
                    <div className="u-modal-section-header gold">
                      <ShieldCheck size={18} />
                      Compliance & Credentials
                    </div>

                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">DRIVING LICENSE EXPIRY</span>
                        <span className="u-modal-data-value">14 NOV 2026</span>
                      </div>
                      <span className="u-modal-update-link">UPDATE</span>
                    </div>

                    <div className="u-modal-data-row">
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">PCO LICENSE EXPIRY</span>
                        <span className="u-modal-data-value">22 JAN 2027</span>
                      </div>
                      <span className="u-modal-update-link">UPDATE</span>
                    </div>

                    <div className="u-modal-data-row" style={{ borderBottom: 'none' }}>
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">NATIONAL INSURANCE NUMBER</span>
                        <span className="u-modal-data-value">QQ 12 34 56 C</span>
                      </div>
                    </div>

                    <div className="u-modal-data-row" style={{ borderBottom: 'none' }}>
                      <div className="u-modal-data-group">
                        <span className="u-modal-data-label">DBS/BACKGROUND CHECK REF</span>
                        <span className="u-modal-data-value">
                          DBS-9900-XJ <span className="u-modal-badge-dbs">MANDATORY DBS</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="u-modal-section">
                    <div className="u-modal-section-header gold">
                      <Wallet size={18} />
                      Financial Framework
                    </div>

                    <div className="u-modal-inner-grid">
                      <div className="u-modal-data-group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px' }}>
                        <span className="u-modal-data-label">CONTRACT TYPE</span>
                        <span className="u-modal-data-value" style={{ color: 'var(--color-gold)' }}>Revenue Share</span>
                      </div>
                      <div className="u-modal-data-group" style={{ backgroundColor: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '4px' }}>
                        <span className="u-modal-data-label">VALUE FIELD (%)</span>
                        <span className="u-modal-data-value">60.00</span>
                      </div>
                    </div>

                    <div className="u-modal-data-group" style={{ marginTop: '16px' }}>
                      <span className="u-modal-data-label">SORT CODE</span>
                      <span className="u-modal-data-value">18-XX-XX</span>
                    </div>

                    <div className="u-modal-data-group" style={{ marginTop: '16px' }}>
                      <span className="u-modal-data-label">ACCOUNT NUMBER</span>
                      <span className="u-modal-data-value">****4490</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Metrics */}
              <div className="u-modal-metrics-footer">
                <div className="u-modal-metric-card">
                  <span className="u-modal-metric-label">RATING</span>
                  <div className="u-modal-metric-value">
                    4.98<span className="u-modal-metric-sub">★</span>
                  </div>
                </div>
                <div className="u-modal-metric-card">
                  <span className="u-modal-metric-label">JOBS COMPLETED</span>
                  <div className="u-modal-metric-value">2,412</div>
                </div>
                <div className="u-modal-metric-card">
                  <span className="u-modal-metric-label">VELO TENURE</span>
                  <div className="u-modal-metric-value">
                    4.2<span className="u-modal-metric-sub-text">y</span>
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

export default ChauffeurProfileModal;
