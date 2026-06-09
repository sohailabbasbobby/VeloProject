import React from 'react';
import { Contact, Plus } from 'lucide-react';
import { MOCK_STAFF } from '../data/mockDatabase';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import './SystemModules.css';
import './UniversalGrid.css';

const OperationalStaffDirectory = () => {
  const { openStaffProfile } = useEntityLinker();

  return (
    <div className="system-module-container">
      <div className="system-header">
        <div>
          <h2 className="system-title">OPERATIONAL STAFF DIRECTORY</h2>
          <div className="system-subtitle">HQ Dispatchers, Admins & Compliance Officers</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Contact size={24} color="var(--color-gold)" />
          <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', borderRadius: '4px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }} onClick={() => openStaffProfile('New Team Member')}>
            <Plus size={16} /> ADD NEW TEAM MEMBER
          </button>
        </div>
      </div>

      <div className="u-grid">
        {MOCK_STAFF.map((staff, i) => (
          <div key={i} className="u-card" onClick={() => openStaffProfile(staff.name)} style={{ cursor: 'pointer' }}>
            <div className="u-card-header">
              <div className="u-card-header-left">
                <span className="u-card-id">{staff.id}</span>
              </div>
              <div className={`u-badge ${staff.status === 'Active' ? 'success' : 'neutral'}`}>{staff.status}</div>
            </div>
            
            <div className="u-card-body">
              <div className="u-card-image-container">
                {(() => {
                  const imgUrl = staff.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
                  return (
                    <img 
                      src={imgUrl} 
                      srcSet={`${imgUrl} 1x, ${imgUrl} 2x`}
                      loading="eager"
                      onError={(e) => {
                        console.error('Image failed to load:', e.target.src);
                        e.target.src = 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80';
                      }}
                      alt={staff.name} 
                      className="u-card-image"
                    />
                  );
                })()}
              </div>
              <div className="u-card-title">{staff.name}</div>
              <div className="u-card-subtitle flex-row align-center gap-xs mt-xs justify-center" style={{ marginTop: '4px', fontSize: '11px', color: 'var(--color-text-secondary)' }}>
                {staff.role} • {staff.shiftAvailability}
              </div>
            </div>

            <div className="u-card-footer" onClick={(e) => e.stopPropagation()}>
              <div className="u-card-actions">
                <button className="u-btn primary" onClick={(e) => e.stopPropagation()}>Message</button>
                <button className="u-btn" onClick={(e) => { e.stopPropagation(); openStaffProfile(staff.name); }}>View Profile</button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="security-footer" style={{ marginTop: "auto" }}>Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default OperationalStaffDirectory;
