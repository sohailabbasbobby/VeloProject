import React, { useState } from 'react';
import { Filter, Search, Mail, Plus, AlertTriangle, ShieldCheck, Shield, User } from 'lucide-react';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';
import './PrivateClientRegistry.css';
import './UniversalGrid.css';
import { MOCK_PRIV_CLIENTS as MOCK_CLIENTS } from '../data/mockDatabase';


const PrivateClientRegistry = () => {
  const { openClientProfile, openSummaryModal } = useEntityLinker();

  const handleOnboardClient = () => {
    openClientProfile('New Client');
  };



  return (
    <div className="pcr-container">
      {/* Header & Metrics */}
      <div className="pcr-header">
        <div className="pcr-title-group">
          <h1 className="pcr-title">Private Client Registry</h1>
          <span className="pcr-subtitle">Exclusive concierge management for high-net-worth individuals.</span>
        </div>
        <div className="pcr-alert-badge">
          <AlertTriangle size={14} />
          2 VIP BOOKINGS PENDING CONFIRMATION
        </div>
      </div>

      <div className="pcr-metrics-row">
        <div className="pcr-metric-card">
          <span className="pcr-metric-title">ACTIVE PRIVATE CLIENTS</span>
          <div className="pcr-metric-val">342 <span className="pcr-metric-sub">+12 this month</span></div>
        </div>
        <div className="pcr-metric-card">
          <span className="pcr-metric-title">PENDING REQUESTS</span>
          <div className="pcr-metric-val">8 <span className="pcr-metric-sub danger" style={{ fontSize: '10px' }}>Action Required</span></div>
        </div>
        <div className="pcr-metric-card">
          <span className="pcr-metric-title">VIP ACCOUNTS</span>
          <div className="pcr-metric-val">45 <span className="pcr-metric-sub" style={{ fontSize: '10px', color: '#d8b4fe' }}>Top Tier</span></div>
        </div>
        <div className="pcr-metric-card">
          <span className="pcr-metric-title">COMPLIANCE STATUS</span>
          <div className="pcr-metric-val">
            100% <span className="pcr-badge-verified">VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Portfolio Grid */}
      <div className="pcr-portfolio-header">
        <h2 className="pcr-portfolio-title">Client Portfolio</h2>
        <div className="pcr-filters">
          <div style={{ position: 'relative' }}>
            <Filter size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" className="pcr-filter-input" placeholder="Filter by type..." style={{ paddingLeft: '36px' }} />
          </div>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-muted)' }} />
            <input type="text" className="pcr-filter-input" placeholder="Search client name..." style={{ paddingLeft: '36px' }} />
          </div>
        </div>
      </div>

      <div className="u-grid">
        {MOCK_CLIENTS.map((c, i) => (
          <div key={i} className="u-card" onClick={() => openClientProfile(c.name)} style={{ cursor: 'pointer' }}>
            <div className="u-card-header">
              <div className="u-card-header-left">
                <span className="u-card-id" style={{ fontSize: '10px' }}>{c.type || 'Private Client'}</span>
              </div>
              <span className={`u-badge ${c.statusClass}`}>{c.status}</span>
            </div>
            
            <div className="u-card-body">
              <div className="u-card-image-container">
                {(() => {
                  const imgUrl = c.client_photo_url || c.logo_url || c.image_url || c.image || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80';
                  return (
                    <img 
                      src={imgUrl} 
                      srcSet={`${imgUrl} 1x, ${imgUrl} 2x`}
                      loading="eager"
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&q=80';
                      }}
                      alt={c.name} 
                      className="u-card-image"
                    />
                  );
                })()}
              </div>
              <div className="u-card-title">{c.name}</div>
              
              <div className="u-card-metrics">
                <div className="u-card-metric">
                  <span className="u-card-metric-label">TOTAL SPEND</span>
                  <span className="u-card-metric-value gold">{c.spend}</span>
                </div>
                <div className="u-card-metric">
                  <span className="u-card-metric-label">CONCIERGE</span>
                  <span className="u-card-metric-value">{c.manager}</span>
                </div>
              </div>
            </div>

            <div className="u-card-footer">
              <div className="u-card-actions" style={{ justifyContent: 'flex-end' }}>
                <button className="u-btn" style={{ flex: '0 0 32px', padding: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={(e) => e.stopPropagation()}><Mail size={14} /></button>
              </div>
            </div>
          </div>
        ))}

        <div className="u-card-onboard" onClick={handleOnboardClient}>
          <div className="pcr-avatar" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', borderColor: 'rgba(212, 175, 55, 0.3)' }}>
            <Plus size={16} color="var(--color-gold)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: 'var(--color-gold)', fontWeight: '700', fontSize: '14px' }}>Onboard Client</div>
            <div style={{ color: 'var(--color-text-secondary)', fontSize: '11px', marginTop: '4px' }}>Initiate Security & Profile</div>
          </div>
        </div>
      </div>

      {/* Bottom Sections */}
      <div className="pcr-bottom-grid">
        {/* Booking Audit */}
        <div className="pcr-panel">
          <div className="pcr-panel-header">
            Recent Booking Audit
            <span className="pcr-panel-link">FULL REPORT</span>
          </div>
          <table className="pcr-table">
            <thead>
              <tr>
                <th>CLIENT</th>
                <th>ROUTE</th>
                <th>CLASS</th>
                <th>SECURITY</th>
              </tr>
            </thead>
            <tbody>
              <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                title: 'Booking Audit', subtitle: 'Alexander Sterling', status: 'Completed', icon: 'file',
                primaryMetric: { label: 'CLASS', value: 'First Class' },
                fields: [{label: 'Route', value: 'LHR ➔ Mayfair'}, {label: 'Security', value: 'CLEARED'}]
              })}>
                <td><EntityLink type="Client">Alexander Sterling</EntityLink></td>
                <td style={{ color: 'var(--color-text-secondary)' }}>LHR ➔ Mayfair</td>
                <td className="pcr-val-gold">First Class</td>
                <td><span className="pcr-val-encrypted">CLEARED</span></td>
              </tr>
              <tr className="cc-card-row" style={{ cursor: 'pointer' }} onClick={() => openSummaryModal({
                title: 'Booking Audit', subtitle: 'Lady Victoria Hughes', status: 'Completed', icon: 'file',
                primaryMetric: { label: 'CLASS', value: 'First Class' },
                fields: [{label: 'Route', value: 'Kensington ➔ Farnborough'}, {label: 'Security', value: 'CLEARED'}]
              })}>
                <td><EntityLink type="Client">Lady Victoria Hughes</EntityLink></td>
                <td style={{ color: 'var(--color-text-secondary)' }}>Kensington ➔ Farnborough</td>
                <td className="pcr-val-gold">First Class</td>
                <td><span className="pcr-val-encrypted">CLEARED</span></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* System Security */}
        <div className="pcr-panel">
          <div className="pcr-panel-header">System Security</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="pcr-security-item">
              <ShieldCheck size={16} color="var(--color-gold)" />
              <div className="pcr-security-text">
                <span className="pcr-sec-title">Velo AI Core</span>
                <span className="pcr-sec-sub">Privacy masking active</span>
              </div>
            </div>
            <div className="pcr-security-item">
              <Shield size={16} color="var(--color-gold)" />
              <div className="pcr-security-text">
                <span className="pcr-sec-title">Identity Lock</span>
                <span className="pcr-sec-sub">Biometric verification</span>
              </div>
            </div>
          </div>
          <div style={{ fontStyle: 'italic', fontSize: '10px', color: 'var(--color-text-muted)', marginTop: '8px' }}>
            "Discretion is the ultimate luxury."
          </div>
        </div>
      </div>

      <div className="pcr-footer">
        <div>
          <span style={{ color: 'var(--color-gold)', fontWeight: '700', marginRight: '16px' }}>VELO EXECUTIVE</span>
          Verified by Velo AI Security Protocol
        </div>
        <div className="pcr-footer-links">
          <span>Terms of Service</span>
          <span>Privacy Policy</span>
          <span>Compliance</span>
        </div>
      </div>
    </div>
  );
};

export default PrivateClientRegistry;
