import React, { useState } from 'react';
import { Filter, Search, Mail, Plus, AlertTriangle, ShieldCheck, Shield, Building2 } from 'lucide-react';
import CorporateProfileModal from './CorporateProfileModal';
import './CorporateClientHub.css';
import './UniversalGrid.css';
import { MOCK_CORPORATE } from '../data/mockDatabase';


const CorporateClientHub = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);

  const handleOpenProfile = () => {
    setIsNew(false);
    setIsModalOpen(true);
  };

  const handleOnboardClient = () => {
    setIsNew(true);
    setIsModalOpen(true);
  };

  return (
    <div className="cch-container">
      {/* Header & Metrics */}
      <div className="cch-header">
        <div className="cch-title-group">
          <h1 className="cch-title">Corporate Client Hub</h1>
          <span className="cch-subtitle">Centralized oversight for Tier-1 corporate account management.</span>
        </div>
        <div className="cch-alert-badge">
          <AlertTriangle size={14} />
          3 OVERDUE INVOICES: $242,000 USD
        </div>
      </div>

      <div className="cch-metrics-row">
        <div className="cch-metric-card">
          <span className="cch-metric-title">ACTIVE CORPORATE CLIENTS</span>
          <div className="cch-metric-val">124 <span className="cch-metric-sub">+4 this month</span></div>
        </div>
        <div className="cch-metric-card">
          <span className="cch-metric-title">OUTSTANDING INVOICES</span>
          <div className="cch-metric-val">$1.2M <span className="cch-metric-sub danger" style={{ fontSize: '10px' }}>Critical</span></div>
        </div>
        <div className="cch-metric-card">
          <span className="cch-metric-title">CREDIT EXPOSURE</span>
          <div className="cch-metric-val" style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start' }}>
            34%
            <div className="cch-bar-container">
              <div className="cch-bar-fill" style={{ width: '34%' }}></div>
            </div>
          </div>
        </div>
        <div className="cch-metric-card">
          <span className="cch-metric-title">COMPLIANCE STATUS</span>
          <div className="cch-metric-val">
            98% <span className="cch-badge-verified">VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="cch-portfolio-header">
        <h2 className="cch-portfolio-title">Client Portfolio</h2>
        <div className="cch-filters">
          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" className="cch-filter-input" placeholder="Filter by sector..." style={{ paddingLeft: '36px' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" className="cch-filter-input" placeholder="Search company name..." style={{ paddingLeft: '36px' }} />
          </div>
        </div>
      </div>

      <div className="u-grid">
        {MOCK_CORPORATE.map((c, i) => (
          <div key={i} className="u-card">
            <div className="u-card-header">
              <div className="u-card-header-left">
                <span className="u-card-id" style={{ fontSize: '10px' }}>{c.sector || 'Corporate'}</span>
              </div>
              <span className={`u-badge ${c.statusClass}`}>{c.status}</span>
            </div>
            
            <div className="u-card-body">
              <div className="u-card-image-container">
                {(() => {
                  const imgUrl = c.logo_url || c.image_url || c.image || 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80';
                  return (
                    <img 
                      src={imgUrl} 
                      loading="eager"
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.src = 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=400&q=80';
                      }}
                      alt={c.name} 
                      className="u-card-image"
                    />
                  );
                })()}
              </div>
              <div className="u-card-title">{c.name}</div>
              <div className="u-card-subtitle">{c.type || 'Corporate Account'}</div>

              <div className="u-card-metrics">
                <div className="u-card-metric">
                  <span className="u-card-metric-label">BALANCE</span>
                  <span className="u-card-metric-value gold">{c.balance}</span>
                </div>
                <div className="u-card-metric">
                  <span className="u-card-metric-label">MANAGER</span>
                  <span className="u-card-metric-value">{c.manager}</span>
                </div>
              </div>
            </div>

            <div className="u-card-footer">
              <div className="u-card-actions">
                <button className="u-btn primary" onClick={handleOpenProfile}>View Profile</button>
                <button className="u-btn" style={{ flex: '0 0 32px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}><Mail size={14} /></button>
              </div>
            </div>
          </div>
        ))}

        <div className="u-card-onboard" onClick={handleOnboardClient}>
          <div className="cch-avatar" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <Plus size={16} color="var(--color-gold)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-gold)', fontWeight: '700', fontSize: '14px' }}>Onboard Client</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '4px' }}>Initiate MSA & Compliance</div>
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="cch-bottom-grid">
        {/* Transaction Audit */}
        <div className="cch-panel">
          <div className="cch-panel-header">
            Recent Transaction Audit
            <span className="cch-panel-link">FULL REPORT</span>
          </div>
          <table className="cch-table">
            <thead>
              <tr>
                <th>ENTITY</th>
                <th>VALUE</th>
                <th>METHOD</th>
                <th>SECURITY</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Aetheris Global</td>
                <td className="cch-val-gold">$45,000.00</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>Wire Transfer</td>
                <td><span className="cch-val-encrypted">ENCRYPTED</span></td>
              </tr>
              <tr>
                <td>Veridian Systems</td>
                <td className="cch-val-gold">$120,400.00</td>
                <td style={{ color: 'var(--color-text-secondary)' }}>Corporate Credit</td>
                <td><span className="cch-val-encrypted">ENCRYPTED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* System Security */}
        <div className="cch-panel">
          <div className="cch-panel-header">System Security</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="cch-security-item">
              <ShieldCheck size={16} color="var(--color-gold)" />
              <div className="cch-security-text">
                <span className="cch-sec-title">Velo AI Core</span>
                <span className="cch-sec-sub">Anomaly detection active</span>
              </div>
            </div>
            <div className="cch-security-item">
              <Shield size={16} color="var(--color-gold)" />
              <div className="cch-security-text">
                <span className="cch-sec-title">Compliance Lock</span>
                <span className="cch-sec-sub">256-bit AES Managed</span>
              </div>
            </div>
          </div>
          <div style={{ fontStyle: 'italic', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            "Precision is the ultimate luxury in corporate data."
          </div>
        </div>
      </div>

      <div className="cch-footer">
        <div>
          <span style={{ color: 'var(--color-gold)', fontWeight: '700', marginRight: '16px' }}>VELO EXECUTIVE</span>
          Verified by Velo AI Security Protocol
        </div>
        <div className="cch-footer-links">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Compliance</span>
        </div>
      </div>

      <CorporateProfileModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} isNew={isNew} />
    </div>
  );
};

export default CorporateClientHub;
