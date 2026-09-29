import React, { useMemo, useState, useCallback } from 'react';
import { Search, ChevronLeft, ChevronRight, AlertCircle, CheckCircle, GripVertical, RefreshCw } from 'lucide-react';
import './AssignmentRota.css';
import { fetchStaff, fetchRoster, fetchTrips, fetchVehicles, usePolling } from '../utils/api';

const DAY_START = 6 * 60;   // grid window 06:00
const DAY_END = 18 * 60;    // grid window 18:00
const GRID_MINUTES = DAY_END - DAY_START;

const UNASSIGNED_STATES = ['PENDING_DISPATCH', 'OFFERING_OWN_FLEET', 'IN_POOL', 'NEGOTIATION'];

const fmtTime = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;

const isoDate = (d) => {
  const dt = d instanceof Date ? d : new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
};

const dayLabel = (dateStr) => {
  const today = isoDate(new Date());
  const tomorrow = isoDate(new Date(Date.now() + 86400000));
  if (dateStr === today) return 'Today';
  if (dateStr === tomorrow) return 'Tomorrow';
  const [y, mo, d] = dateStr.split('-');
  return `${d}/${mo}/${y}`;
};

const roleBadgeClass = (role) => {
  const r = String(role || '').toUpperCase();
  if (r === 'DRIVER' || r === 'CHAUFFEUR') return 'badge-driver';
  if (r === 'CONCIERGE') return 'badge-concierge';
  return 'badge-dispatcher';
};

const tripMinutes = (t) => {
  if (!t.scheduled_at) return null;
  const d = new Date(t.scheduled_at);
  if (Number.isNaN(d.getTime())) return null;
  const start = d.getHours() * 60 + d.getMinutes();
  return { start, end: start + (t.duration_minutes || 60) };
};

const AssignmentRota = () => {
  const [mode, setMode] = useState('driver'); // 'driver' | 'vehicle'
  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => isoDate(new Date()));

  const loadStaff = useCallback(() => fetchStaff(), []);
  const loadRoster = useCallback(() => fetchRoster(selectedDate), [selectedDate]);
  const loadTrips = useCallback(() => fetchTrips(), []);
  const loadVehicles = useCallback(() => fetchVehicles(), []);

  const { data: staff, loading: staffLoading, error: staffError } = usePolling(loadStaff, 30000);
  const { data: roster } = usePolling(loadRoster, 30000);
  const { data: trips, loading: tripsLoading, error: tripsError } = usePolling(loadTrips, 15000);
  const { data: vehicles } = usePolling(loadVehicles, 60000);

  const shifts = useMemo(() => (roster && roster.shifts) || [], [roster]);
  const shiftsByStaff = useMemo(() => {
    const map = new Map();
    shifts.forEach((s) => {
      const list = map.get(s.staff_id) || [];
      list.push(s);
      map.set(s.staff_id, list);
    });
    return map;
  }, [shifts]);

  const todaysTrips = useMemo(
    () => (trips || []).filter((t) => t.scheduled_at && t.scheduled_at.slice(0, 10) === selectedDate),
    [trips, selectedDate]
  );

  const unassignedTrips = useMemo(() => todaysTrips.filter((t) => UNASSIGNED_STATES.includes(t.state)), [todaysTrips]);

  const searchLower = search.trim().toLowerCase();
  const visibleStaff = useMemo(
    () =>
      (staff || []).filter(
        (s) =>
          !searchLower ||
          `${s.first_name} ${s.last_name}`.toLowerCase().includes(searchLower) ||
          String(s.role || '').toLowerCase().includes(searchLower)
      ),
    [staff, searchLower]
  );

  // Real conflict detection: overlapping shifts for the same staff member on the selected date
  const conflicts = useMemo(() => {
    const out = [];
    shiftsByStaff.forEach((list, staffId) => {
      const sorted = [...list].sort((a, b) => a.start_minute - b.start_minute);
      for (let i = 1; i < sorted.length; i++) {
        const prevEnd = sorted[i - 1].start_minute + (sorted[i - 1].duration_minutes || 0);
        if (sorted[i].start_minute < prevEnd) {
          const member = (staff || []).find((s) => s.id === staffId);
          out.push(
            `${member ? `${member.first_name} ${member.last_name}` : 'Staff member'} has overlapping shifts at ${fmtTime(sorted[i].start_minute)}.`
          );
        }
      }
    });
    return out;
  }, [shiftsByStaff, staff]);

  const gridRows = useMemo(() => {
    const pct = (m) => ((m - DAY_START) / GRID_MINUTES) * 100;
    const pillFor = (trip) => {
      const m = tripMinutes(trip);
      if (!m) return null;
      if (m.end <= DAY_START || m.start >= DAY_END) return null;
      const start = Math.max(m.start, DAY_START);
      const end = Math.min(m.end, DAY_END);
      const assigned = trip.driver_name || trip.vehicle_name;
      return {
        left: `${pct(start)}%`,
        width: `${pct(end) - pct(start)}%`,
        gold: Boolean(trip.driver_name && mode === 'driver') || Boolean(trip.vehicle_name && mode === 'vehicle'),
        label: `${trip.pickup_address || 'Pickup'} → ${trip.dropoff_address || 'Dropoff'}`,
        sub: assigned || 'Unassigned',
      };
    };

    if (mode === 'driver') {
      return visibleStaff.map((s) => {
        const memberShifts = shiftsByStaff.get(s.id) || [];
        const pills = todaysTrips
          .filter((t) => t.driver_name === `${s.first_name} ${s.last_name}` || t.driver_code === s.reference_code)
          .map(pillFor)
          .filter(Boolean);
        return {
          key: s.id,
          title: `${s.first_name} ${s.last_name}`,
          subtitle: memberShifts.length
            ? `Shift: ${memberShifts.map((sh) => `${fmtTime(sh.start_minute)}-${fmtTime(sh.start_minute + (sh.duration_minutes || 0))}`).join(', ')}`
            : 'No shift scheduled',
          pills,
        };
      });
    }
    return (vehicles || []).map((v) => ({
      key: v.id,
      title: v.name || `${v.make || ''} ${v.model || ''}`.trim() || 'Vehicle',
      subtitle: v.registration || v.plate || v.reference_code || '',
      pills: todaysTrips
        .filter((t) => t.vehicle_code === v.reference_code)
        .map(pillFor)
        .filter(Boolean),
    }));
  }, [mode, visibleStaff, shiftsByStaff, todaysTrips, vehicles]);

  const moveDay = (delta) => {
    const d = new Date(`${selectedDate}T12:00:00`);
    d.setDate(d.getDate() + delta);
    setSelectedDate(isoDate(d));
  };

  return (
    <div className="assignment-rota">

      <div className="rota-header flex-row space-between align-center">
        <div>
          <h2 className="text-white" style={{ fontSize: '24px', letterSpacing: '1px' }}>Assignment Rota</h2>
          <p className="text-muted" style={{ fontSize: '12px', marginTop: '4px' }}>
            {tripsLoading || staffLoading
              ? 'Syncing live roster data…'
              : staffError || tripsError
                ? `Live feed error: ${(staffError || tripsError).message}`
                : `${visibleStaff.length} staff · ${todaysTrips.length} trips on ${dayLabel(selectedDate)}`}
          </p>
        </div>
        <div className="rota-date-picker surface-panel flex-row align-center gap-md" style={{ padding: '8px 16px', borderRadius: '4px' }}>
          <ChevronLeft size={18} className="text-muted cursor-pointer hover-white" onClick={() => moveDay(-1)} />
          <span className="text-white font-bold" style={{ width: '120px', textAlign: 'center' }}>Date: {dayLabel(selectedDate)}</span>
          <ChevronRight size={18} className="text-muted cursor-pointer hover-white" onClick={() => moveDay(1)} />
          <RefreshCw
            size={14}
            className="text-muted cursor-pointer hover-white"
            onClick={() => setSelectedDate(isoDate(new Date()))}
            title="Back to today"
          />
        </div>
      </div>

      <div className="rota-workspace">

        {/* Left Column: Available Staff */}
        <div className="available-staff-panel surface-panel">
          <div className="panel-header" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', paddingBottom: '16px', marginBottom: '16px' }}>
            <h3 className="text-white text-sm" style={{ letterSpacing: '2px', marginBottom: '12px' }}>AVAILABLE STAFF</h3>
            <div className="search-wrapper w-100">
              <Search size={14} className="search-icon text-muted" />
              <input
                type="text"
                placeholder="Search drivers/concierge..."
                className="w-100"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="staff-list">
            {visibleStaff.length === 0 && (
              <p className="text-muted" style={{ fontSize: '12px' }}>
                {staffLoading ? 'Loading staff…' : 'No staff match the search.'}
              </p>
            )}
            {visibleStaff.map((s) => {
              const memberShifts = shiftsByStaff.get(s.id) || [];
              return (
                <div className="staff-draggable" key={s.id}>
                  <GripVertical size={14} className="drag-handle text-muted" />
                  <div className={`staff-badge ${roleBadgeClass(s.role)}`}>
                    {String(s.first_name || '?').charAt(0).toUpperCase()}
                  </div>
                  <div className="staff-info">
                    <div className="staff-name text-white font-bold text-sm">
                      {s.first_name} {s.last_name}
                    </div>
                    <div className="staff-shift text-muted" style={{ fontSize: '11px' }}>
                      {memberShifts.length
                        ? `Shift: ${fmtTime(memberShifts[0].start_minute)} - ${fmtTime(memberShifts[0].start_minute + (memberShifts[0].duration_minutes || 0))}`
                        : `Role: ${s.role || 'Staff'} · No shift on ${dayLabel(selectedDate)}`}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {conflicts.length > 0 ? (
            <div className="conflict-alert mt-4 p-md" style={{ borderLeft: '3px solid var(--color-danger)', backgroundColor: 'rgba(255, 59, 48, 0.05)' }}>
              <div className="flex-row gap-sm align-center mb-1">
                <AlertCircle size={14} color="var(--color-danger)" />
                <span className="text-danger font-bold text-sm">Conflict Alert</span>
              </div>
              {conflicts.map((c, i) => (
                <p key={i} className="text-muted" style={{ fontSize: '12px', lineHeight: 1.4 }}>{c}</p>
              ))}
            </div>
          ) : (
            <div className="conflict-alert mt-4 p-md" style={{ borderLeft: '3px solid var(--color-success, #30d158)', backgroundColor: 'rgba(48, 209, 88, 0.05)' }}>
              <div className="flex-row gap-sm align-center">
                <CheckCircle size={14} color="var(--color-success, #30d158)" />
                <span className="text-sm font-bold" style={{ color: 'var(--color-success, #30d158)' }}>No Shift Conflicts</span>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Grid */}
        <div className="rota-grid-panel surface-panel flex-1 flex-col">
          <div className="grid-header flex-row space-between align-center p-md" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 className="text-white text-sm" style={{ letterSpacing: '2px' }}>ASSIGNMENT ROTA</h3>
            <div className="mode-toggle flex-row">
              <button className={`toggle-btn ${mode === 'driver' ? 'active' : ''}`} onClick={() => setMode('driver')}>
                Driver Mode
              </button>
              <button className={`toggle-btn ${mode === 'vehicle' ? 'active' : ''}`} onClick={() => setMode('vehicle')}>
                Vehicle Mode
              </button>
            </div>
          </div>

          <div className="grid-container flex-1" style={{ overflowX: 'auto' }}>
            <div className="grid-timeline" style={{ minWidth: '800px' }}>

              {/* Header Row (Hours) */}
              <div className="grid-row header-row">
                <div className="grid-y-label"></div>
                {[6, 8, 10, 12, 14, 16, 18].map((h) => (
                  <div key={h} className="grid-hour">{`${String(h).padStart(2, '0')}:00`}</div>
                ))}
              </div>

              {/* Unassigned trips row (real pending-dispatch trips for the day) */}
              {unassignedTrips.length > 0 && (
                <div className="grid-row">
                  <div className="grid-y-label">
                    <div className="text-white text-sm">Unassigned Trips</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>({unassignedTrips.length})</div>
                  </div>
                  <div className="grid-cells">
                    <div className="grid-lines">
                      <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>
                    {unassignedTrips.map((t) => {
                      const m = tripMinutes(t);
                      if (!m || m.end <= DAY_START || m.start >= DAY_END) return null;
                      const pct = (v) => ((v - DAY_START) / GRID_MINUTES) * 100;
                      return (
                        <div
                          key={t.id || t.task_id}
                          className="trip-empty-slot"
                          style={{ left: `${pct(Math.max(m.start, DAY_START))}%`, width: `${pct(Math.min(m.end, DAY_END)) - pct(Math.max(m.start, DAY_START))}%` }}
                          title={`${t.pickup_address || ''} → ${t.dropoff_address || ''}`}
                        >
                          Unassigned
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Staff or Vehicle rows */}
              {gridRows.map((row) => (
                <div className="grid-row" key={row.key}>
                  <div className="grid-y-label">
                    <div className="text-white text-sm">{row.title}</div>
                    <div className="text-muted" style={{ fontSize: '11px' }}>{row.subtitle}</div>
                  </div>
                  <div className="grid-cells">
                    <div className="grid-lines">
                      <span></span><span></span><span></span><span></span><span></span><span></span><span></span>
                    </div>
                    {row.pills.map((p, i) => (
                      <div
                        key={i}
                        className="trip-pill"
                        style={
                          p.gold
                            ? { left: p.left, width: p.width, backgroundColor: 'rgba(212, 175, 55, 0.15)', border: '1px solid var(--color-gold)' }
                            : { left: p.left, width: p.width, backgroundColor: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255,255,255,0.2)' }
                        }
                      >
                        <div className={p.gold ? 'text-gold text-xs font-bold truncate' : 'text-white text-xs font-bold truncate'}>{p.label}</div>
                        <div className="text-muted text-xs truncate">{p.sub}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {gridRows.length === 0 && (
                <p className="text-muted p-md" style={{ fontSize: '12px' }}>
                  {mode === 'driver' ? 'No staff on the roster yet.' : 'No vehicles registered in the fleet yet.'}
                </p>
              )}

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AssignmentRota;
