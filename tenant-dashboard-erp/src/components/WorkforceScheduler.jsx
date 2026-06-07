import React from 'react';
import { CalendarDays } from 'lucide-react';
import { MOCK_STAFF } from '../data/mockDatabase';
import './SystemModules.css';

const WorkforceScheduler = () => {
  return (
    <div className="system-module-container">
      <div className="system-header">
        <div>
          <h2 className="system-title">WORKFORCE ROSTER & SCHEDULING</h2>
          <div className="system-subtitle">Weekly Visual Shift Allocations</div>
        </div>
        <CalendarDays size={24} color="var(--color-gold)" />
      </div>

      <div className="system-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))' }}>
        {MOCK_STAFF.map(staff => (
          <div key={staff.id} className="system-card">
            <div className="staff-card-top">
              <div className="staff-avatar" style={{ width: '40px', height: '40px' }}>
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
                <span className="staff-role" style={{ fontSize: '10px' }}>{staff.role}</span>
              </div>
            </div>

            <div className="scheduler-timeline">
              {staff.schedule.map((sch, i) => (
                <div key={i} className="scheduler-day">
                  <span className="scheduler-day-name">{sch.day}</span>
                  {sch.shift === 'OFF' ? (
                    <span className="scheduler-day-off">OFF DUTY</span>
                  ) : (
                    <span className="scheduler-day-shift">{sch.shift}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default WorkforceScheduler;
