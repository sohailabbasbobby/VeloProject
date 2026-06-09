import React, { useState } from 'react';
import { ShieldCheck, Timer, AlertCircle, AlertTriangle, Plus, User } from 'lucide-react';
import './ChauffeurHub.css';
import './UniversalGrid.css';
import { MOCK_CHAUFFEURS } from '../data/mockDatabase';
import OnboardChauffeurModal from './modals/OnboardChauffeurModal';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';


const ChauffeurHub = () => {
  const [activeTab, setActiveTab] = useState('all');
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);
  const [assignJobChauffeur, setAssignJobChauffeur] = useState(null);
  const { openDriverProfile } = useEntityLinker();

  const getStars = (count) => {
    return Array(5).fill(0).map((_, i) => (
      <span key={i} style={{ opacity: i < count ? 1 : 0.3 }}>★</span>
    ));
  };

  return (
    <div className="chauffeur-hub">
      {/* Top Metrics Row */}
      <div className="ch-metrics-row">
        {/* Metric 1 */}
        <div className="ch-metric-card">
          <div className="ch-metric-content">
            <span className="ch-metric-title">ACTIVE CHAUFFEURS</span>
            <div className="ch-metric-value">
              38<span className="ch-metric-sub">/42</span>
            </div>
          </div>
          <div className="ch-metric-icon-wrapper" style={{ borderColor: 'var(--color-gold)' }}>
            <span style={{ fontSize: '12px', fontWeight: 'bold', color: 'var(--color-gold)' }}>90%</span>
          </div>
        </div>
        
        {/* Metric 2 */}
        <div className="ch-metric-card">
          <div className="ch-metric-content">
            <span className="ch-metric-title">COMPLIANCE RATE</span>
            <div className="ch-metric-value">
              100%<span className="ch-metric-sub" style={{ color: 'var(--color-gold)' }}>||||</span>
            </div>
          </div>
          <div className="ch-metric-icon-wrapper">
            <ShieldCheck size={20} color="var(--color-gold)" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="ch-metric-card">
          <div className="ch-metric-content">
            <span className="ch-metric-title">SHIFT READINESS</span>
            <div className="ch-metric-value">
              94%<span className="ch-metric-sub" style={{ color: 'var(--color-gold)' }}>|||</span>
            </div>
          </div>
          <div className="ch-metric-icon-wrapper">
            <Timer size={20} color="var(--color-gold)" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="ch-metric-card">
          <div className="ch-metric-content">
            <span className="ch-metric-title">PENDING CERTIFICATIONS</span>
            <div className="ch-metric-value">02</div>
          </div>
          <div className="ch-metric-icon-wrapper danger">
            <AlertCircle size={20} color="var(--color-danger)" />
          </div>
        </div>
      </div>

      {/* Alert Banner */}
      <div className="ch-alert-banner">
        <div className="ch-alert-text">
          <AlertTriangle size={18} color="rgba(255, 59, 48, 0.8)" />
          ACTION REQUIRED: PCO LICENSE EXPIRY PENDING FOR CHAUFFEUR C-902 (<EntityLink type="Driver">JULIAN STERLING</EntityLink>) • 48 HOURS REMAINING
        </div>
        <button className="ch-alert-btn">RENEW NOW</button>
      </div>

      {/* Tabs */}
      <div className="ch-tabs">
        <div className={`ch-tab ${activeTab === 'all' ? 'active' : ''}`} onClick={() => setActiveTab('all')}>All Chauffeurs</div>
        <div className={`ch-tab ${activeTab === 'on-shift' ? 'active' : ''}`} onClick={() => setActiveTab('on-shift')}>On-Shift</div>
        <div className={`ch-tab ${activeTab === 'off-duty' ? 'active' : ''}`} onClick={() => setActiveTab('off-duty')}>Off-Duty</div>
        <div className={`ch-tab ${activeTab === 'in-transit' ? 'active' : ''}`} onClick={() => setActiveTab('in-transit')}>In-Transit</div>
        <div className={`ch-tab ${activeTab === 'alerts' ? 'active' : ''}`} onClick={() => setActiveTab('alerts')}>
          Compliance Alert <span className="ch-badge">2</span>
        </div>
      </div>

      {/* Chauffeur Grid */}
      <div className="u-grid">
        {MOCK_CHAUFFEURS.map((c, i) => (
          <div key={i} className="u-card" onClick={() => openDriverProfile(c.name)} style={{ cursor: 'pointer' }}>
            <div className="u-card-header">
              <div className="u-card-header-left">
                <span className="u-card-id">{c.id}</span>
                <div className="ch-stars">{getStars(c.stars)}</div>
              </div>
              <div className={`u-badge ${c.statusType}`}>{c.status}</div>
            </div>
            
            <div className="u-card-body">
              <div className="u-card-image-container">
                {(() => {
                  const imgUrl = c.profile_photo_url || c.image_url || c.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
                  return (
                    <img 
                      src={imgUrl} 
                      srcSet={`${imgUrl} 1x, ${imgUrl} 2x`}
                      loading="eager"
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
                      }}
                      alt={c.name} 
                      className="u-card-image"
                    />
                  );
                })()}
              </div>
              <div className="u-card-title">{c.name}</div>
              <div className="u-card-subtitle flex-row align-center gap-xs mt-xs justify-center">
                <span className={`ch-compliance-dot ${c.complianceType}`}>{c.compliance}</span>
              </div>
            </div>

            <div className="u-card-footer" onClick={(e) => e.stopPropagation()}>
              <div className="u-card-actions">
                <button className="u-btn primary" onClick={(e) => e.stopPropagation()}>Message</button>
                <button className="u-btn" onClick={(e) => { e.stopPropagation(); setAssignJobChauffeur(c); }}>Assign Job</button>
              </div>
            </div>
          </div>
        ))}

        {/* Onboard Card */}
        <div className="u-card-onboard" onClick={() => setIsOnboardModalOpen(true)}>
          <div className="ch-onboard-icon">
            <Plus size={16} color="var(--color-text-secondary)" />
          </div>
          <div style={{ textAlign: 'center' }}>
             <div className="ch-onboard-text">Onboard New Chauffeur</div>
             <div className="ch-onboard-sub">Add to Fleet Personnel</div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {assignJobChauffeur && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.85)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }} onClick={() => setAssignJobChauffeur(null)}>
          <div style={{ backgroundColor: '#111', padding: '24px', borderRadius: '8px', width: '400px', border: '1px solid var(--color-gold)' }} onClick={e => e.stopPropagation()}>
            <h3 style={{ color: 'var(--color-gold)', marginTop: 0, marginBottom: '16px', letterSpacing: '1px' }}>ASSIGN UNASSIGNED JOB</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>JOB-8902</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>LHR T5 to The Savoy</div>
                </div>
                <button className="ch-action-btn" onClick={() => { alert('Job Assigned to ' + assignJobChauffeur.name); setAssignJobChauffeur(null); }} style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#fff' }}>ASSIGN</button>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#000', padding: '12px', borderRadius: '4px', border: '1px solid #333' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 'bold', fontSize: '14px' }}>JOB-8905</div>
                  <div style={{ color: '#888', fontSize: '12px', marginTop: '4px' }}>O2 Arena to Mayfair</div>
                </div>
                <button className="ch-action-btn" onClick={() => { alert('Job Assigned to ' + assignJobChauffeur.name); setAssignJobChauffeur(null); }} style={{ padding: '6px 12px', border: '1px solid rgba(255,255,255,0.2)', backgroundColor: 'transparent', color: '#fff' }}>ASSIGN</button>
              </div>
            </div>
            <button className="ch-action-btn primary" onClick={() => setAssignJobChauffeur(null)} style={{marginTop: '24px', width: '100%'}}>CANCEL</button>
          </div>
        </div>
      )}
      <OnboardChauffeurModal isOpen={isOnboardModalOpen} onClose={() => setIsOnboardModalOpen(false)} />

      <div className="security-footer" style={{ marginTop: "auto" }}>Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default ChauffeurHub;
