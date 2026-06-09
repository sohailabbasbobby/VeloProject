import React, { useState, useRef, useEffect } from 'react';
import { CalendarDays, Search } from 'lucide-react';
import { MOCK_STAFF } from '../data/mockDatabase';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import './SystemModules.css';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Helper to format time
const formatTime = (hour, percentage) => {
  const totalMins = Math.round(hour * 60 + percentage * 60);
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  // Snap to 30 min increments for display
  const snappedM = m >= 15 && m < 45 ? 30 : m >= 45 ? 0 : 0;
  const snappedH = m >= 45 ? h + 1 : h;
  return `${String(snappedH).padStart(2, '0')}:${String(snappedM).padStart(2, '0')}`;
};

const formatTimeRange = (startPerc, endPerc) => {
  const startHour = startPerc * 24;
  const endHour = endPerc * 24;
  return `${formatTime(startHour, startPerc)} - ${formatTime(endHour, endPerc)}`;
};

const WorkforceScheduler = () => {
  const { openStaffProfile } = useEntityLinker();
  const [searchTerm, setSearchTerm] = useState('');
  const [draggedStaff, setDraggedStaff] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  
  const [shifts, setShifts] = useState(() => {
    // initialize from MOCK_STAFF schedule with percentage positioning (0 to 1)
    const initial = [];
    MOCK_STAFF.forEach(staff => {
      staff.schedule.forEach(sch => {
        if (sch.shift !== 'OFF') {
          // Parse "06:00 - 18:00" to percentages
          let startP = 0.25; // 6am
          let endP = 0.75; // 6pm
          if (sch.shift.includes('Morning')) { startP = 0.25; endP = 0.583; } // 6-14
          if (sch.shift.includes('Afternoon')) { startP = 0.583; endP = 0.916; } // 14-22
          if (sch.shift.includes('Night')) { startP = 0.916; endP = 1.0; } // 22-06
          initial.push({
            id: `S-${staff.id}-${sch.day}`,
            staffId: staff.id,
            staffName: staff.name,
            day: sch.day,
            startPos: startP,
            endPos: endP
          });
        }
      });
    });
    return initial;
  });

  const timelineRef = useRef(null);
  
  // Drag State for resizing/duplicating
  const [activeDrag, setActiveDrag] = useState(null); // { shiftId, type: 'left' | 'right' | 'bottom', initialX, initialY, initialStart, initialEnd }

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const syncToDatabase = (staffName) => {
    showToast(`Shift updated for ${staffName}. Synced to Database.`);
  };

  const handleDragStart = (e, staff) => {
    setDraggedStaff(staff);
    e.dataTransfer.effectAllowed = 'copy';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e, day) => {
    e.preventDefault();
    if (draggedStaff && timelineRef.current) {
      const rect = timelineRef.current.getBoundingClientRect();
      const dropX = e.clientX - rect.left - 80; // offset day label
      const maxW = rect.width - 80;
      let startPos = Math.max(0, dropX / maxW);
      // Snap to nearest 30 mins (1/48)
      startPos = Math.round(startPos * 48) / 48;
      let endPos = Math.min(1, startPos + (8 / 24)); // Default 8 hours

      const newShift = {
        id: `S-${draggedStaff.id}-${Date.now()}`,
        staffId: draggedStaff.id,
        staffName: draggedStaff.name,
        day,
        startPos,
        endPos
      };
      setShifts([...shifts, newShift]);
      syncToDatabase(draggedStaff.name);
      setDraggedStaff(null);
    }
  };

  // Pointer event listeners for resizing and duplicating
  useEffect(() => {
    const handlePointerMove = (e) => {
      if (!activeDrag || !timelineRef.current) return;
      
      const rect = timelineRef.current.getBoundingClientRect();
      const timelineW = rect.width - 80;
      
      if (activeDrag.type === 'left' || activeDrag.type === 'right') {
        const deltaX = e.clientX - activeDrag.initialX;
        const deltaPos = deltaX / timelineW;
        
        setShifts(prev => prev.map(s => {
          if (s.id !== activeDrag.shiftId) return s;
          let newStart = s.startPos;
          let newEnd = s.endPos;
          
          if (activeDrag.type === 'left') {
            newStart = Math.min(activeDrag.initialStart + deltaPos, s.endPos - (1/48));
            newStart = Math.max(0, Math.round(newStart * 48) / 48); // Snap
          } else {
            newEnd = Math.max(activeDrag.initialEnd + deltaPos, s.startPos + (1/48));
            newEnd = Math.min(1, Math.round(newEnd * 48) / 48); // Snap
          }
          return { ...s, startPos: newStart, endPos: newEnd };
        }));
      } else if (activeDrag.type === 'bottom') {
        // Vertical drag for duplication
        const deltaY = e.clientY - activeDrag.initialY;
        const rowsDown = Math.floor(deltaY / 80); // 80px row height
        if (rowsDown > 0 && activeDrag.currentRowsDown !== rowsDown) {
          activeDrag.currentRowsDown = rowsDown; // mutable ref pattern to prevent spam
          const sourceShift = shifts.find(s => s.id === activeDrag.shiftId);
          if (sourceShift) {
            const currentDayIndex = DAYS.indexOf(sourceShift.day);
            const targetDayIndex = currentDayIndex + rowsDown;
            if (targetDayIndex < DAYS.length) {
              const targetDay = DAYS[targetDayIndex];
              // check if it already exists
              if (!shifts.some(s => s.staffId === sourceShift.staffId && s.day === targetDay && s.startPos === sourceShift.startPos)) {
                const clone = { ...sourceShift, id: `S-${sourceShift.staffId}-${Date.now()}-${targetDay}`, day: targetDay };
                setShifts(prev => [...prev, clone]);
              }
            }
          }
        }
      }
    };

    const handlePointerUp = () => {
      if (activeDrag) {
        const shift = shifts.find(s => s.id === activeDrag.shiftId);
        if (shift) syncToDatabase(shift.staffName);
        setActiveDrag(null);
      }
    };

    if (activeDrag) {
      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [activeDrag, shifts]);


  const startResize = (e, shiftId, type, shift) => {
    e.stopPropagation();
    e.preventDefault(); // Prevent text selection
    setActiveDrag({
      shiftId,
      type,
      initialX: e.clientX,
      initialY: e.clientY,
      initialStart: shift.startPos,
      initialEnd: shift.endPos,
      currentRowsDown: 0
    });
  };

  const filteredStaff = MOCK_STAFF.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="system-module-container" style={{ position: 'relative', height: '100%', overflow: 'hidden' }}>
      <div className="system-header">
        <div>
          <h2 className="system-title">WORKFORCE ROSTER & SCHEDULING</h2>
          <div className="system-subtitle">Continuous 24-Hour Interactive Timeline</div>
        </div>
        <CalendarDays size={24} color="var(--color-gold)" />
      </div>

      <div className="roster-layout">
        {/* Left Pane: Staff Search */}
        <div className="roster-sidebar">
          <div className="roster-search">
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', top: 12, left: 10, color: '#888' }} />
              <input 
                type="text" 
                placeholder="Search staff..." 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                style={{ paddingLeft: 32 }}
              />
            </div>
          </div>
          <div className="roster-staff-list">
            {filteredStaff.map(staff => (
              <div 
                key={staff.id} 
                className="roster-staff-item"
                draggable
                onDragStart={(e) => handleDragStart(e, staff)}
              >
                <img src={staff.image || 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&q=80'} alt="" className="roster-staff-avatar" />
                <div className="roster-staff-details">
                  <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>{staff.name}</span>
                  <span style={{ fontSize: '10px', color: '#888' }}>{staff.role}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Pane: 24-Hour Timeline */}
        <div className="roster-timeline-container">
          <div className="roster-timeline-viewport" ref={timelineRef}>
            
            <div className="roster-timeline-header">
              <div className="roster-corner-cell"></div>
              {HOURS.map(h => (
                <div key={h} className="roster-hour-marker">
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            <div className="roster-timeline-body">
              {DAYS.map(day => {
                const dayShifts = shifts.filter(s => s.day === day);
                return (
                  <div 
                    key={day} 
                    className="roster-day-row"
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, day)}
                  >
                    <div className="roster-day-label">{day}</div>
                    <div className="roster-day-dropzone">
                      {dayShifts.map(shift => (
                        <div 
                          key={shift.id} 
                          className="roster-shift-block"
                          style={{
                            left: `${shift.startPos * 100}%`,
                            width: `${(shift.endPos - shift.startPos) * 100}%`
                          }}
                        >
                          <div className="roster-shift-name" onClick={() => openStaffProfile(shift.staffName)} style={{ cursor: 'pointer' }}>{shift.staffName}</div>
                          <div className="roster-shift-time">{formatTimeRange(shift.startPos, shift.endPos)}</div>
                          
                          <div 
                            className="roster-resize-handle-left"
                            onPointerDown={(e) => startResize(e, shift.id, 'left', shift)}
                          />
                          <div 
                            className="roster-resize-handle-right"
                            onPointerDown={(e) => startResize(e, shift.id, 'right', shift)}
                          />
                          <div 
                            className="roster-duplicate-handle-bottom"
                            onPointerDown={(e) => startResize(e, shift.id, 'bottom', shift)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      <div className="security-footer" style={{ marginTop: 'auto' }}>Verified by Velo AI Security Protocol</div>

      {toastMessage && (
        <div style={{ position: 'fixed', bottom: '40px', right: '40px', background: '#34C759', color: '#000', padding: '12px 24px', borderRadius: '4px', fontWeight: 'bold', zIndex: 1000, boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
          {toastMessage}
        </div>
      )}

    </div>
  );
};

export default WorkforceScheduler;
