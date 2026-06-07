import React from 'react';
import { Contact, Shield, Clock } from 'lucide-react';
import { MOCK_STAFF } from '../data/mockDatabase';
import './SystemModules.css';

const OperationalStaffDirectory = () => {
  return (
    <div className="system-module-container">
      <div className="system-header">
        <div>
          <h2 className="system-title">OPERATIONAL STAFF DIRECTORY</h2>
          <div className="system-subtitle">HQ Dispatchers, Admins & Compliance Officers</div>
        </div>
        <Contact size={24} color="var(--color-gold)" />
      </div>

      <div className="system-grid">
        {MOCK_STAFF.map(staff => (
          <div key={staff.id} className="system-card">
            <div className="staff-card-top">
              <div className="staff-avatar">
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
                      style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                    />
                  );
                })()}
              </div>
              <div className="staff-info">
                <span className="staff-name">{staff.name}</span>
                <span className="staff-role">{staff.role}</span>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginTop: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Status</span>
                <span style={{ color: staff.status === 'Active' ? '#34C759' : '#fff', fontSize: '13px' }}>{staff.status}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <span style={{ fontSize: '10px', color: '#888', textTransform: 'uppercase' }}>Shift Avail</span>
                <span style={{ color: '#fff', fontSize: '13px' }}>{staff.shiftAvailability}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
              <button className="btn-secondary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>View Profile</button>
            </div>
          </div>
        ))}
      </div>

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default OperationalStaffDirectory;
