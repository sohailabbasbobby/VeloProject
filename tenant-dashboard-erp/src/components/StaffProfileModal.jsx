import React, { useState } from 'react';
import { User, MessageSquare, Briefcase, Lock, Activity, ShieldCheck, X } from 'lucide-react';
import './StaffProfileModal.css';
import './UniversalModal.css';
import ConciergeFeed from './ConciergeFeed';
import { openModal } from '../utils/openModal';
import OfficeStaffOnboarding from './onboarding/OfficeStaffOnboarding';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import EntityLink from './EntityLink';


const StaffProfileModal = ({ staff, isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState('overview');
  const { openSummaryModal } = useEntityLinker();

  if (!isOpen || !staff) return null;

  return (
    <div className="sp-modal-overlay" onClick={onClose}>
      <div className="sp-modal-content" onClick={(e) => e.stopPropagation()}>
        {/* Header Section (Fixed) */}
        <div className="sp-header">
          <div className="sp-header-top">
            <div className="sp-profile-info">
              <div className="sp-avatar-container">
                {(() => {
                  const imgUrl = staff.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
                  return (
                    <img 
                      src={imgUrl} 
                      srcSet={`${imgUrl} 1x, ${imgUrl} 2x`}
                      loading="eager"
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'; }}
                      alt={staff.name} 
                      style={{width: '100%', height: '100%', objectFit: 'cover', borderRadius: '4px'}}
                    />
                  );
                })()}
                <div className="sp-status-dot"></div>
              </div>
              <div className="sp-name-group">
                <h1 className="sp-name">{staff.name}</h1>
                <div className="sp-id">{staff.id} • {staff.role}</div>
                <div style={{color: '#d4af37', fontSize: '10px', textTransform: 'uppercase', marginBottom: '10px'}}>
                  CONTRACT: {staff.contract_type || 'N/A'} – {staff.pay_frequency || 'N/A'}
                </div>
                <div className="sp-live-status">
                  <div style={{ width: 6, height: 6, backgroundColor: '#34C759', borderRadius: '50%' }}></div>
                  ACTIVE
                </div>
              </div>
            </div>
            <div className="sp-action-bar">
              <div className="sp-action-group">
                <button className="sp-btn sp-btn-outline"><MessageSquare size={14} /> MESSAGE</button>
                <button className="sp-btn sp-btn-primary"><Briefcase size={14} /> ASSIGN TASK</button>
                <button className="sp-btn sp-btn-outline" onClick={() => openModal(<OfficeStaffOnboarding initialData={staff} />)}>EDIT PROFILE</button>
                <button className="sp-btn sp-btn-outline" onClick={onClose} style={{ padding: '8px', border: 'none' }}><X size={20} color="var(--color-text-muted)" /></button>
              </div>
            </div>
          </div>
          
          <div className="sp-tabs">
            <div className={`sp-tab ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>OVERVIEW</div>
            <div className={`sp-tab ${activeTab === 'activity' ? 'active' : ''}`} onClick={() => setActiveTab('activity')}>ACTIVITY LOG</div>
            <div className={`sp-tab ${activeTab === 'compliance' ? 'active' : ''}`} onClick={() => setActiveTab('compliance')}>COMPLIANCE & CREDENTIALING</div>
            <div className={`sp-tab ${activeTab === 'engagement' ? 'active' : ''}`} onClick={() => setActiveTab('engagement')}>ENGAGEMENT</div>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="sp-modal-body">
          {activeTab === 'overview' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div className="sp-grid-2-col">
                <div className="sp-section">
                  <div className="sp-section-header gold"><User size={16} /> Personal Identity</div>
                  <div className="sp-inner-grid">
                    <div className="sp-data-group">
                      <span className="sp-data-label">FULL NAME</span>
                      <span className="sp-data-value">{staff.name}</span>
                    </div>
                    <div className="sp-data-group">
                      <span className="sp-data-label">EMPLOYEE ID</span>
                      <span className="sp-data-value">{staff.id}</span>
                    </div>
                    <div className="sp-data-group">
                      <span className="sp-data-label">DEPARTMENT</span>
                      <span className="sp-data-value">Operations</span>
                    </div>
                    <div className="sp-data-group">
                      <span className="sp-data-label">ROLE</span>
                      <span className="sp-data-value">{staff.role}</span>
                    </div>
                  </div>
                </div>
                <div className="sp-section">
                  <div className="sp-section-header"><Activity size={16} /> Current Status</div>
                  <div className="sp-inner-grid">
                    <div className="sp-data-group">
                      <span className="sp-data-label">SHIFT STATUS</span>
                      <span className="sp-data-value" style={{ color: staff.status === 'Active' ? '#34C759' : '#fff' }}>{staff.status}</span>
                    </div>
                    <div className="sp-data-group">
                      <span className="sp-data-label">SHIFT AVAILABILITY</span>
                      <span className="sp-data-value">{staff.shiftAvailability}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="sp-section">
                <div className="sp-section-header"><Briefcase size={16} /> Weekly Schedule</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginTop: '16px' }}>
                  {(staff.schedule || []).map((day, idx) => (
                    <div key={idx} style={{ padding: '12px', backgroundColor: 'rgba(255,255,255,0.02)', borderRadius: '4px', textAlign: 'center' }}>
                      <div style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase', marginBottom: '8px' }}>{day.day}</div>
                      <div style={{ fontSize: '12px', fontWeight: day.shift === 'OFF' ? 'normal' : 'bold', color: day.shift === 'OFF' ? '#666' : '#fff' }}>{day.shift}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'activity' && (
            <div className="sp-section" style={{ flex: 1, overflowY: 'auto', padding: 0, backgroundColor: 'transparent', border: 'none' }}>
              <table className="cc-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead style={{ position: 'sticky', top: 0, backgroundColor: 'var(--color-obsidian)', zIndex: 10 }}>
                  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Date</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Action</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Target</th>
                    <th style={{ padding: '16px', textAlign: 'left', fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Details</th>
                    <th style={{ padding: '16px', textAlign: 'right', fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {(staff?.shifts || []).map((shift) => (
                    <tr key={act.id} className="cc-card-row" style={{ cursor: 'pointer', borderBottom: '1px solid rgba(255,255,255,0.05)' }} onClick={() => openSummaryModal({
                      title: 'Activity Log', subtitle: act.action, status: act.status, icon: 'file',
                      primaryMetric: { label: 'TARGET', value: act.target },
                      fields: [{label: 'Date', value: act.date}, {label: 'Details', value: act.details}]
                    })}>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#ccc' }}>{act.date}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#fff' }}>{act.action}</td>
                      <td style={{ padding: '16px', fontSize: '13px', color: 'var(--color-gold)' }}>
                        {act.type === 'Vehicle' ? <EntityLink type="Vehicle">{act.target}</EntityLink> :
                         act.type === 'Client' ? <EntityLink type="Client">{act.target}</EntityLink> :
                         act.type === 'Driver' ? <EntityLink type="Driver">{act.target}</EntityLink> :
                         <EntityLink type="Staff">{act.target}</EntityLink>}
                      </td>
                      <td style={{ padding: '16px', fontSize: '13px', color: '#888' }}>{act.details}</td>
                      <td style={{ padding: '16px', textAlign: 'right' }}><span className="sp-badge-dbs">{act.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="sp-grid-2-col">
              <div className="sp-section">
                <div className="sp-section-header"><ShieldCheck size={16} /> Access Levels</div>
                <div className="sp-inner-grid">
                  <div className="sp-data-group">
                    <span className="sp-data-label">SYSTEM ROLE</span>
                    <span className="sp-data-value">{staff.role}</span>
                  </div>
                  <div className="sp-data-group">
                    <span className="sp-data-label">DATA CLASSIFICATION</span>
                    <span className="sp-data-value" style={{ color: 'var(--color-gold)' }}>Level 4 (Sensitive)</span>
                  </div>
                  <div className="sp-data-group">
                    <span className="sp-data-label">FINANCIAL CLEARANCE</span>
                    <span className="sp-data-value">Up to $50,000</span>
                  </div>
                  <div className="sp-data-group">
                    <span className="sp-data-label">DISPATCH OVERRIDE</span>
                    <span className="sp-data-value" style={{ color: '#34C759' }}>AUTHORIZED</span>
                  </div>
                </div>
              </div>
              <div className="sp-section">
                <div className="sp-section-header"><Lock size={16} /> Credentialing</div>
                <div className="sp-data-row">
                  <div className="sp-data-group">
                    <span className="sp-data-label">BACKGROUND CHECK</span>
                    <span className="sp-data-value">Cleared (2025-01-15)</span>
                  </div>
                  <span className="sp-update-link">RENEW</span>
                </div>
                <div className="sp-data-row" style={{ marginTop: '16px' }}>
                  <div className="sp-data-group">
                    <span className="sp-data-label">NDA STATUS</span>
                    <span className="sp-data-value">Signed V2.0</span>
                  </div>
                  <span className="sp-update-link">VIEW</span>
                </div>
                <div className="sp-data-row" style={{ marginTop: '16px' }}>
                  <div className="sp-data-group">
                    <span className="sp-data-label">LAST SECURITY AUDIT</span>
                    <span className="sp-data-value">2026-05-20</span>
                  </div>
                  <span className="sp-update-link">LOG</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'engagement' && (
            <ConciergeFeed />
          )}

        </div>

        {/* Fixed Footer */}
        <div style={{ padding: '16px 32px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', fontSize: '10px', color: 'var(--color-text-muted)', textAlign: 'center', letterSpacing: '1px', textTransform: 'uppercase' }}>
          Verified by Velo AI Security Protocol
        </div>
      </div>
    </div>
  );
};

export default StaffProfileModal;
