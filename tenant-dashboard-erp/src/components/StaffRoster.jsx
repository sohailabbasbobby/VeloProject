import React, { useState } from 'react';
import { Search, User, ShieldCheck, FileText, Settings, AlertCircle, CheckCircle2, MessageSquare, BookOpen, Clock, Plus } from 'lucide-react';
import './StaffRoster.css';
import OnboardChauffeurModal from './modals/OnboardChauffeurModal';

const StaffRoster = () => {
  const [activeStaff, setActiveStaff] = useState(1);
  const [isOnboardModalOpen, setIsOnboardModalOpen] = useState(false);

  const staffList = [
    {
      id: 1,
      name: 'Alistair B.',
      role: 'Senior Chauffeur • VIP Certified',
      status: 'AVAILABLE',
      rating: '4.9/5.0',
      trips: 120
    },
    {
      id: 2,
      name: 'Sophia L.',
      role: 'Concierge Manager',
      status: 'ON DUTY',
      rating: '5.0/5.0',
      trips: 340
    },
    {
      id: 3,
      name: 'Marcus T.',
      role: 'Chauffeur',
      status: 'OFF DUTY',
      rating: '4.7/5.0',
      trips: 85
    }
  ];

  return (
    <div className="staff-roster">
      <div className="roster-header flex-row space-between align-center">
        <div>
          <h2 className="text-white" style={{ fontSize: '24px', letterSpacing: '1px' }}>Personnel Directory</h2>
        </div>
        <button className="btn-primary flex-row align-center gap-sm" onClick={() => setIsOnboardModalOpen(true)}>
          <Plus size={16} /> Add New Staff
        </button>
      </div>

      <OnboardChauffeurModal isOpen={isOnboardModalOpen} onClose={() => setIsOnboardModalOpen(false)} />

      <div className="roster-workspace">
        
        {/* Left Column: Active Staff */}
        <div className="staff-list-panel surface-panel">
          <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 className="text-white text-sm" style={{ letterSpacing: '2px', marginBottom: '12px' }}>ACTIVE STAFF</h3>
            <div className="search-wrapper w-100">
              <Search size={14} className="search-icon text-muted" />
              <input type="text" placeholder="Search personnel..." className="w-100" />
            </div>
          </div>
          
          <div className="staff-list">
            {staffList.map(staff => (
              <div 
                key={staff.id} 
                className={`staff-card ${activeStaff === staff.id ? 'active' : ''}`}
                onClick={() => setActiveStaff(staff.id)}
              >
                <div className="staff-card-icon">
                  <User size={24} color={activeStaff === staff.id ? 'var(--color-obsidian)' : 'var(--color-gold)'} />
                </div>
                <div className="staff-card-info">
                  <div className={`font-bold text-sm ${activeStaff === staff.id ? 'text-obsidian' : 'text-white'}`}>
                    {staff.name}
                  </div>
                  <div className={`text-xs ${activeStaff === staff.id ? 'text-obsidian' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                    {staff.role}
                  </div>
                </div>
                <div className="staff-card-status">
                  <span className={`status-dot ${staff.status.toLowerCase().replace(' ', '-')}`}></span>
                  <span className={`text-xs ${activeStaff === staff.id ? 'text-obsidian' : 'text-muted'}`} style={{ opacity: 0.8 }}>
                    {staff.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Personnel Profile */}
        <div className="personnel-profile-panel surface-panel flex-1 flex-col">
          <div className="profile-header p-xl flex-row space-between align-start" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div className="flex-row gap-lg align-center">
              <div className="profile-large-icon" style={{ backgroundColor: 'rgba(212, 175, 55, 0.1)', padding: '16px', borderRadius: '12px' }}>
                <User size={40} color="var(--color-gold)" />
              </div>
              <div>
                <h2 className="text-gold mb-1" style={{ fontSize: '28px' }}>Alistair B.</h2>
                <div className="text-muted text-sm">Senior Chauffeur • VIP Certified</div>
              </div>
            </div>
            <div className="status-badge bg-gold-dim text-gold" style={{ fontSize: '14px', padding: '8px 16px' }}>AVAILABLE</div>
          </div>

          <div className="profile-actions p-md flex-row gap-md" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
            <button className="btn-outline-gold flex-row align-center gap-sm">
              <MessageSquare size={14} /> Message
            </button>
            <button className="btn-outline-gold flex-row align-center gap-sm">
              <BookOpen size={14} /> View Logbook
            </button>
            <button className="btn-outline-gold flex-row align-center gap-sm">
              <Clock size={14} /> Adjust Shift
            </button>
          </div>

          <div className="profile-content p-xl flex-row gap-xl" style={{ overflowY: 'auto' }}>
            
            {/* KYC & Compliance */}
            <div className="flex-1">
              <h3 className="text-white text-sm mb-lg" style={{ letterSpacing: '2px' }}>KYC & COMPLIANCE</h3>
              
              <div className="compliance-card surface-panel mb-md">
                <div className="flex-row space-between align-center mb-sm">
                  <div className="flex-row align-center gap-sm">
                    <ShieldCheck size={16} color="var(--color-emerald)" />
                    <span className="text-white font-bold text-sm">Chauffeur License</span>
                  </div>
                  <span className="badge-valid flex-row align-center gap-xs"><CheckCircle2 size={12} /> Valid</span>
                </div>
                <div className="text-muted text-xs">Expires: 11 Nov 2025</div>
              </div>

              <div className="compliance-card surface-panel mb-md">
                <div className="flex-row space-between align-center mb-sm">
                  <div className="flex-row align-center gap-sm">
                    <FileText size={16} color="var(--color-emerald)" />
                    <span className="text-white font-bold text-sm">Background Check</span>
                  </div>
                  <span className="badge-valid flex-row align-center gap-xs"><CheckCircle2 size={12} /> Valid</span>
                </div>
                <div className="text-muted text-xs">Cleared: 01 Jan 2024</div>
              </div>
            </div>

            {/* Performance & Ratings */}
            <div className="flex-1">
              <h3 className="text-white text-sm mb-lg" style={{ letterSpacing: '2px' }}>PERFORMANCE & RATINGS</h3>
              
              <div className="performance-card surface-panel mb-md" style={{ padding: 'var(--spacing-lg)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div className="text-white font-bold text-sm mb-1">Client Rating</div>
                <div className="text-gold text-lg font-bold">4.9/5.0 <span className="text-muted text-xs font-normal">(120 Trips)</span></div>
              </div>
              
              <div className="performance-card surface-panel mb-md" style={{ padding: 'var(--spacing-lg)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius-md)', backgroundColor: 'rgba(255,255,255,0.02)' }}>
                <div className="text-white font-bold text-sm mb-1">Punctuality Score</div>
                <div className="text-emerald text-lg font-bold">98.5% <span className="text-muted text-xs font-normal">(Last 30 Days)</span></div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default StaffRoster;
