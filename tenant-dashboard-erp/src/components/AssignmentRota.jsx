import React, { useState } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, GripVertical } from 'lucide-react';
import './AssignmentRota.css';

const AssignmentRota = () => {
  const [mode, setMode] = useState('driver'); // 'driver' or 'vehicle'

  return (
    <div className="assignment-rota">
      
      <div className="rota-header flex-row space-between align-center">
        <div>
          <h2 className="text-white" style={{ fontSize: '24px', letterSpacing: '1px' }}>Assignment Rota</h2>
        </div>
        <div className="rota-date-picker surface-panel flex-row align-center gap-md" style={{ padding: '8px 16px', borderRadius: '4px' }}>
          <ChevronLeft size={18} className="text-muted cursor-pointer hover-white" />
          <span className="text-white font-bold" style={{ width: '120px', textAlign: 'center' }}>Date: Today</span>
          <ChevronRight size={18} className="text-muted cursor-pointer hover-white" />
        </div>
      </div>

      <div className="rota-workspace">
        
        {/* Left Column: Available Staff */}
        <div className="available-staff-panel surface-panel">
          <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 className="text-white text-sm" style={{ letterSpacing: '2px', marginBottom: '12px' }}>AVAILABLE STAFF</h3>
            <div className="search-wrapper w-100">
              <Search size={14} className="search-icon text-muted" />
              <input type="text" placeholder="Search drivers/concierge..." className="w-100" />
            </div>
          </div>
          
          <div className="staff-list">
            <div className="staff-draggable">
              <GripVertical size={14} className="drag-handle text-muted" />
              <div className="staff-badge badge-driver">D</div>
              <div className="staff-info">
                <div className="staff-name text-white font-bold text-sm">Alistair B.</div>
                <div className="staff-shift text-muted" style={{ fontSize: '11px' }}>Shift: 06:00 - 14:00</div>
              </div>
            </div>

            <div className="staff-draggable">
              <GripVertical size={14} className="drag-handle text-muted" />
              <div className="staff-badge badge-concierge">C</div>
              <div className="staff-info">
                <div className="staff-name text-white font-bold text-sm">Sophia L.</div>
                <div className="staff-shift text-muted" style={{ fontSize: '11px' }}>Shift: 08:00 - 16:00</div>
              </div>
            </div>

            <div className="staff-draggable">
              <GripVertical size={14} className="drag-handle text-muted" />
              <div className="staff-badge badge-driver">D</div>
              <div className="staff-info">
                <div className="staff-name text-white font-bold text-sm">Marcus T.</div>
                <div className="staff-shift text-muted" style={{ fontSize: '11px' }}>Shift: 14:00 - 22:00</div>
              </div>
            </div>

            <div className="staff-draggable">
              <GripVertical size={14} className="drag-handle text-muted" />
              <div className="staff-badge badge-driver">D</div>
              <div className="staff-info">
                <div className="staff-name text-white font-bold text-sm">Elena V.</div>
                <div className="staff-shift text-muted" style={{ fontSize: '11px' }}>Shift: 18:00 - 02:00</div>
              </div>
            </div>
          </div>

          <div className="conflict-alert mt-4 p-md" style={{ borderLeft: '3px solid var(--color-danger)', backgroundColor: 'rgba(255, 59, 48, 0.05)' }}>
            <div className="flex-row gap-sm align-center mb-1">
              <AlertCircle size={14} color="var(--color-danger)" />
              <span className="text-danger font-bold text-sm">Conflict Alert</span>
            </div>
            <p className="text-muted" style={{ fontSize: '12px', lineHeight: 1.4 }}>
              Marcus T. assigned to overlapping trips at 14:30.
            </p>
          </div>
        </div>

        {/* Right Column: Grid */}
        <div className="rota-grid-panel surface-panel flex-1 flex-col">
          <div className="grid-header flex-row space-between align-center p-md" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-white text-sm" style={{ letterSpacing: '2px' }}>ASSIGNMENT ROTA</h3>
            <div className="mode-toggle flex-row">
              <button 
                className={`toggle-btn ${mode === 'driver' ? 'active' : ''}`}
                onClick={() => setMode('driver')}
              >
                Driver Mode
              </button>
              <button 
                className={`toggle-btn ${mode === 'vehicle' ? 'active' : ''}`}
                onClick={() => setMode('vehicle')}
              >
                Vehicle Mode
              </button>
            </div>
          </div>

          <div className="grid-container flex-1" style={{ overflowX: 'auto' }}>
            <div className="grid-timeline" style={{ minWidth: '800px' }}>
              
              {/* Header Row (Hours) */}
              <div className="grid-row header-row">
                <div className="grid-y-label"></div>
                <div className="grid-hour">06:00</div>
                <div className="grid-hour">08:00</div>
                <div className="grid-hour">10:00</div>
                <div className="grid-hour">12:00</div>
                <div className="grid-hour">14:00</div>
                <div className="grid-hour">16:00</div>
                <div className="grid-hour">18:00</div>
              </div>

              {/* Rows */}
              <div className="grid-row">
                <div className="grid-y-label">
                  <div className="text-white text-sm">Mercedes S-Class</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>(LN25 ABC)</div>
                </div>
                <div className="grid-cells">
                  <div className="grid-lines">
                    <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <div className="trip-pill" style={{ left: '14.28%', width: '21.42%', backgroundColor: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--color-gold)' }}>
                    <div className="text-gold text-xs font-bold truncate">Mayfair → LHR</div>
                    <div className="text-white text-xs truncate">Alistair B.</div>
                  </div>
                </div>
              </div>

              <div className="grid-row">
                <div className="grid-y-label">
                  <div className="text-white text-sm">Range Rover</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>(AB24 XYZ)</div>
                </div>
                <div className="grid-cells">
                  <div className="grid-lines">
                    <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <div className="trip-pill" style={{ left: '28.56%', width: '28.56%', backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.2)' }}>
                    <div className="text-white text-xs font-bold truncate">City → LGW</div>
                    <div className="text-muted text-xs truncate">Sophia L.</div>
                  </div>
                </div>
              </div>

              <div className="grid-row">
                <div className="grid-y-label">
                  <div className="text-white text-sm">Rolls Royce Phantom</div>
                  <div className="text-muted" style={{ fontSize: '11px' }}>(RR01 VIP)</div>
                </div>
                <div className="grid-cells">
                  <div className="grid-lines">
                    <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                  </div>
                  <div className="trip-empty-slot" style={{ left: '57.12%', width: '14.28%' }}>
                    Unassigned
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignmentRota;
