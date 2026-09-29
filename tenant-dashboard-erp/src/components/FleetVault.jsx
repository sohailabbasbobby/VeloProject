import React, { useState, useCallback } from 'react';
import { Plus, Wrench, FileCheck, Gauge } from 'lucide-react';
import './FleetVault.css';
import AddVehicleModal from './modals/AddVehicleModal';
import { fetchVehicles, fetchFleetCompliance, updateMaintenanceLog, usePolling } from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const daysUntil = (d) => (d ? Math.ceil((new Date(d).getTime() - Date.now()) / 86400e3) : null);

const FleetVault = () => {
  const loadVehicles = useCallback(() => fetchVehicles(), []);
  const loadCompliance = useCallback(() => fetchFleetCompliance(), []);
  const { data: vehicles, loading, error, refresh } = usePolling(loadVehicles, 20000);
  const { data: compliance } = usePolling(loadCompliance, 60000);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const { openVehicleProfile } = useEntityLinker();

  const resolveLog = async (vehicleId, logId) => {
    await updateMaintenanceLog(vehicleId, logId, { status: 'RESOLVED', resolutionNotes: 'Resolved via Fleet Vault' });
    refresh();
  };

  const maintenanceRows = (vehicles || []).flatMap((v) =>
    (v.maintenanceLogs || []).map((m) => ({ ...m, vehicle: v }))
  );

  return (
    <div className="fleet-vault">
      <div className="fv-header">
        <div>
          <h2>FLEET ASSET MANAGEMENT</h2>
          <span className="fv-subtitle">
            {loading ? 'Syncing live fleet data…' : error ? `Live feed error: ${error.message}` : `${(vehicles || []).length} vehicles · live from database`}
          </span>
        </div>
        <button className="fv-add-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} /> Add Vehicle
        </button>
      </div>

      {/* Vehicle grid */}
      <div className="fv-grid">
        {(vehicles || []).map((v) => {
          const leasePct = Number(v.lease_progress_pct || 0);
          const motDays = daysUntil(v.mot_expiry);
          const phvDays = daysUntil(v.phv_expiry);
          return (
            <div key={v.id} className="fv-card" onClick={() => openVehicleProfile(v.reference_code || `${v.make} ${v.model}`)}>
              <div className="fv-card-top">
                <div className="fv-vehicle-name">{v.make} {v.model}</div>
                <span className="fv-ref">{v.reference_code}</span>
              </div>
              <div className="fv-plate">{v.plate_number}</div>
              <div className="fv-lease">
                <div className="fv-lease-label">LEASE PROGRESS</div>
                <div className="fv-lease-bar">
                  <div className="fv-lease-fill" style={{ width: `${Math.min(100, leasePct)}%` }} />
                </div>
                <span className="fv-lease-pct">{leasePct}%</span>
              </div>
              <div className="fv-compliance-row">
                <span className={`fv-comp ${motDays !== null && motDays < 30 ? 'warn' : 'ok'}`}>
                  <FileCheck size={11} /> MOT {motDays !== null ? `${motDays}d` : '—'}
                </span>
                <span className={`fv-comp ${phvDays !== null && phvDays < 30 ? 'warn' : 'ok'}`}>
                  <FileCheck size={11} /> PCO {phvDays !== null ? `${phvDays}d` : '—'}
                </span>
                <span className="fv-comp ok">
                  <Gauge size={11} /> {Number(v.current_odometer || 0).toLocaleString()} mi
                </span>
              </div>
              {v.assigned_driver_name && (
                <div className="fv-driver">Chauffeur: {v.assigned_driver_name} ({v.assigned_driver_code})</div>
              )}
            </div>
          );
        })}
        {!loading && (vehicles || []).length === 0 && (
          <div className="fv-empty">No vehicles in the fleet yet. Use “Add Vehicle” to register the first asset.</div>
        )}
      </div>

      {/* Maintenance logs table: Issue Description / Reported Date / Reported By / Status / Actions */}
      <div className="fv-maintenance">
        <div className="fv-section-title"><Wrench size={14} /> MAINTENANCE LOGS</div>
        <table className="fv-table">
          <thead>
            <tr>
              <th>ISSUE DESCRIPTION</th>
              <th>REPORTED DATE</th>
              <th>REPORTED BY</th>
              <th>VEHICLE</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {maintenanceRows.map((m) => (
              <tr key={m.id}>
                <td>{m.issue_description}</td>
                <td>{new Date(m.reported_date).toLocaleDateString()}</td>
                <td>{m.reported_by_staff || m.reported_by_driver_code || 'Back Office'}</td>
                <td>{m.vehicle.reference_code} · {m.vehicle.make} {m.vehicle.model}</td>
                <td><span className={`fv-status ${m.status === 'RESOLVED' ? 'ok' : 'open'}`}>{m.status}</span></td>
                <td>
                  {m.status !== 'RESOLVED' && (
                    <button className="fv-resolve-btn" onClick={(e) => { e.stopPropagation(); resolveLog(m.vehicle.id, m.id); }}>
                      RESOLVE
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {maintenanceRows.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No maintenance issues logged.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Compliance tracker */}
      {compliance && compliance.length > 0 && (
        <div className="fv-maintenance">
          <div className="fv-section-title"><FileCheck size={14} /> MOT / PCO COMPLIANCE TRACKER</div>
          <table className="fv-table">
            <thead>
              <tr><th>VEHICLE</th><th>MOT</th><th>PHV/PCO</th><th>INSURANCE</th><th>STATUS</th></tr>
            </thead>
            <tbody>
              {compliance.map((c) => (
                <tr key={c.id}>
                  <td>{c.reference_code} · {c.make} {c.model} ({c.plate_number})</td>
                  <td>{c.mot_expiry ? `${new Date(c.mot_expiry).toLocaleDateString()} (${c.mot_days_left}d)` : '—'}</td>
                  <td>{c.phv_expiry ? `${new Date(c.phv_expiry).toLocaleDateString()} (${c.phv_days_left}d)` : '—'}</td>
                  <td>{c.insurance_expiry ? new Date(c.insurance_expiry).toLocaleDateString() : '—'}</td>
                  <td><span className={`fv-status ${c.compliance_status === 'VALID' ? 'ok' : c.compliance_status === 'EXPIRING' ? 'warn' : 'critical'}`}>{c.compliance_status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isAddOpen && (
        <AddVehicleModal
          onClose={() => setIsAddOpen(false)}
          onSaved={() => { setIsAddOpen(false); refresh(); }}
        />
      )}
      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default FleetVault;
