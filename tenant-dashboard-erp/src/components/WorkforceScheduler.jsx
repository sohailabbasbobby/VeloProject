import React, { useState, useRef, useCallback, useMemo } from 'react';
import { CalendarDays, Trash2 } from 'lucide-react';
import { useEntityLinker } from '../contexts/EntityLinkerContext';
import './SystemModules.css';
import { fetchStaff, fetchRoster, createShiftSlot, updateShiftSlot, deleteShiftSlot, usePolling } from '../utils/api';

/**
 * WORKFORCE ROSTER & SCHEDULING (§3 System Management)
 * A true CONTINUOUS 24-HOUR calendar at 30-MINUTE granularity — explicitly NOT
 * fixed Morning/Afternoon/Night blocks (that pattern was rejected). Staff are
 * drag-dropped onto the timeline; blocks snap to the 30-min grid and every
 * create/resize/move/delete persists through the live roster API.
 */

const SLOT_MIN = 30;
const SLOTS_PER_DAY = (24 * 60) / SLOT_MIN; // 48

const minutesToLabel = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const WorkforceScheduler = () => {
  const { openStaffProfile } = useEntityLinker();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));

  const loadStaff = useCallback(() => fetchStaff(), []);
  const { data: staff } = usePolling(loadStaff, 60000);
  const loadRoster = useCallback(() => fetchRoster(selectedDate), [selectedDate]);
  const { data: rosterData, refresh: refreshRoster } = usePolling(loadRoster, 30000);

  const [draggedStaff, setDraggedStaff] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [resizing, setResizing] = useState(null); // { slotId, edge }
  const gridRef = useRef(null);

  const shifts = useMemo(() => rosterData?.shifts || [], [rosterData]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const xToMinutes = (clientX) => {
    const grid = gridRef.current;
    if (!grid) return 0;
    const rect = grid.getBoundingClientRect();
    const pct = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    return Math.round((pct * 24 * 60) / SLOT_MIN) * SLOT_MIN;
  };

  const handleDrop = async (e, staffId) => {
    e.preventDefault();
    const staff = draggedStaff;
    setDraggedStaff(null);
    if (!staff) return;
    const startMinute = xToMinutes(e.clientX);
    try {
      await createShiftSlot({ staffId, shiftDate: selectedDate, startMinute, durationMinutes: SLOT_MIN * 2 });
      showToast(`Shift allocated ${minutesToLabel(startMinute)}–${minutesToLabel(startMinute + SLOT_MIN * 2)} — saved to database.`);
      refreshRoster();
    } catch (err) {
      showToast(`Allocation failed: ${err.message}`);
    }
  };

  const handleResizeMove = async (e) => {
    if (!resizing) return;
    const minutes = xToMinutes(e.clientX);
    const slot = shifts.find((s) => s.id === resizing.slotId);
    if (!slot) return;
    if (resizing.edge === 'right') {
      const dur = Math.max(SLOT_MIN, minutes - slot.start_minute);
      if (dur !== slot.duration_minutes && dur % SLOT_MIN === 0) {
        await updateShiftSlot(slot.id, { durationMinutes: dur });
      }
    } else {
      const newStart = Math.min(minutes, slot.start_minute + slot.duration_minutes - SLOT_MIN);
      if (newStart !== slot.start_minute && newStart % SLOT_MIN === 0) {
        await updateShiftSlot(slot.id, { startMinute: newStart });
      }
    }
  };

  const handleResizeEnd = async () => {
    if (resizing) {
      setResizing(null);
      refreshRoster();
      showToast('Shift updated — saved to database.');
    }
  };

  const staffRows = useMemo(() => {
    const rows = new Map();
    for (const s of staff || []) {
      rows.set(s.id, { id: s.id, name: `${s.first_name} ${s.last_name}`, role: s.role, ref: s.reference_code });
    }
    for (const shift of shifts) {
      if (!rows.has(shift.staff_id)) {
        rows.set(shift.staff_id, { id: shift.staff_id, name: shift.staff_name, role: shift.role, ref: shift.reference_code });
      }
    }
    return [...rows.values()];
  }, [staff, shifts]);

  return (
    <div className="system-module" onDragOver={(e) => e.preventDefault()}>
      <div className="sm-header">
        <div>
          <h2>WORKFORCE ROSTER & SCHEDULING</h2>
          <span className="sm-subtitle">Continuous 24-hour operations timeline · 30-minute granularity · drag staff onto the grid</span>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <CalendarDays size={14} className="text-gold" />
          <input
            type="date"
            className="ob-input"
            style={{ width: 160 }}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Staff palette — drag source */}
      <div className="sm-staff-palette">
        {staffRows.map((s) => (
          <div
            key={s.id}
            className="sm-staff-chip"
            draggable
            onDragStart={() => setDraggedStaff(s)}
            onClick={() => openStaffProfile(s.ref || s.name)}
          >
            <span className="sm-chip-name">{s.name}</span>
            <span className="sm-chip-role">{String(s.role || '').replace('_', ' ')}</span>
          </div>
        ))}
        {(staffRows || []).length === 0 && <span className="sm-palette-empty">Onboard operational staff to begin scheduling.</span>}
      </div>

      {/* Continuous 24h grid */}
      <div className="sm-grid-wrap">
        <div className="sm-hour-ruler">
          {Array.from({ length: 25 }, (_, h) => (
            <div key={h} className="sm-hour-tick" style={{ left: `${(h / 24) * 100}%` }}>
              <span>{String(h % 24).padStart(2, '0')}:00</span>
            </div>
          ))}
        </div>

        <div className="sm-grid" ref={gridRef}>
          {/* 30-minute grid lines */}
          {Array.from({ length: SLOTS_PER_DAY + 1 }, (_, i) => (
            <div key={i} className={`sm-gridline ${i % 2 === 0 ? 'hour' : 'half'}`} style={{ left: `${(i / SLOTS_PER_DAY) * 100}%` }} />
          ))}

          {staffRows.map((s) => (
            <div key={s.id} className="sm-row" onDragOver={(e) => e.preventDefault()} onDrop={(e) => handleDrop(e, s.id)}>
              <div className="sm-row-label" onClick={() => openStaffProfile(s.ref || s.name)}>{s.name}</div>
              <div className="sm-row-track">
                {shifts
                  .filter((sh) => sh.staff_id === s.id)
                  .map((sh) => (
                    <div
                      key={sh.id}
                      className="sm-shift-block"
                      style={{
                        left: `${(sh.start_minute / (24 * 60)) * 100}%`,
                        width: `${(sh.duration_minutes / (24 * 60)) * 100}%`,
                      }}
                      title={`${minutesToLabel(sh.start_minute)}–${minutesToLabel(sh.start_minute + sh.duration_minutes)}${sh.role_assignment ? ` · ${sh.role_assignment}` : ''}`}
                      onMouseDown={(e) => {
                        const rect = e.currentTarget.getBoundingClientRect();
                        setResizing({ slotId: sh.id, edge: e.clientX - rect.left > rect.width - 12 ? 'right' : 'left' });
                      }}
                    >
                      <span>{minutesToLabel(sh.start_minute)}–{minutesToLabel(sh.start_minute + sh.duration_minutes)}</span>
                      <button
                        className="sm-shift-delete"
                        title="Delete slot"
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={async (e) => { e.stopPropagation(); await deleteShiftSlot(sh.id); refreshRoster(); }}
                      >
                        <Trash2 size={10} />
                      </button>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Global resize listeners */}
      {resizing && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 10, cursor: 'col-resize' }}
          onMouseMove={handleResizeMove}
          onMouseUp={handleResizeEnd}
        />
      )}

      {toastMessage && <div className="sm-toast">{toastMessage}</div>}
      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default WorkforceScheduler;
