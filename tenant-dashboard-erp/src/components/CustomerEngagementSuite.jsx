import React from 'react';
import { Users, Mail, AlertTriangle, MessageSquare } from 'lucide-react';
import { MOCK_THREADS } from '../data/mockDatabase';
import './SystemModules.css';

const CustomerEngagementSuite = () => {
  return (
    <div className="system-module-container">
      <div className="system-header">
        <div>
          <h2 className="system-title">CUSTOMER ENGAGEMENT SUITE</h2>
          <div className="system-subtitle">VIP Communications & Concierge Threads</div>
        </div>
        <Users size={24} color="var(--color-gold)" />
      </div>

      <div className="system-grid">
        {MOCK_THREADS.map(thread => {
          let badgeClass = 'badge-active';
          if (thread.status === 'Urgent') badgeClass = 'badge-urgent';
          if (thread.status === 'In-Progress') badgeClass = 'badge-progress';
          if (thread.status === 'Archived') badgeClass = 'badge-archived';

          return (
            <div key={thread.id} className="system-card">
              <div className="system-card-header">
                <span className="system-card-title">{thread.clientName}</span>
                <span className={`system-card-badge ${badgeClass}`}>{thread.status}</span>
              </div>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', color: '#888', fontSize: '11px' }}>
                <span style={{ color: 'var(--color-gold)' }}>{thread.id}</span> • {thread.clientType} • {thread.lastMessageTime}
              </div>

              <div style={{ color: '#fff', fontSize: '14px', fontWeight: '500', marginTop: '8px' }}>
                {thread.subject}
              </div>

              <div className="system-thread-preview">
                "{thread.preview}"
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '16px' }}>
                <button className="btn-primary" style={{ flex: 1, padding: '8px', fontSize: '12px' }}>Open Thread</button>
                <button className="btn-secondary" style={{ padding: '8px' }}><Mail size={14} /></button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default CustomerEngagementSuite;
