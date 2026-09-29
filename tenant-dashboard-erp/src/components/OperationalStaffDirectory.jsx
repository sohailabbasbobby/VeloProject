import React, { useState, useCallback } from 'react';
import { Plus, Contact } from 'lucide-react';
import './StaffRoster.css';
import { fetchStaff, createStaffMember, usePolling } from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const OperationalStaffDirectory = () => {
  const load = useCallback(() => fetchStaff(), []);
  const { data: staff, loading, error, refresh } = usePolling(load, 45000);
  const { openStaffProfile } = useEntityLinker();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="staff-directory">
      <div className="sd-header">
        <div>
          <h2>OPERATIONAL STAFF DIRECTORY</h2>
          <span className="sd-subtitle">
            {loading ? 'Syncing live directory…' : error ? `Live feed error: ${error.message}` : `${(staff || []).length} operational staff · live from database`}
          </span>
        </div>
        <button className="sd-add-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} /> Add New Staff
        </button>
      </div>

      <table className="sd-table">
        <thead>
          <tr>
            <th>STAFF</th>
            <th>REF</th>
            <th>ROLE</th>
            <th>DEPARTMENT</th>
            <th>CONTACT</th>
            <th>UPCOMING SHIFTS</th>
            <th>STATUS</th>
          </tr>
        </thead>
        <tbody>
          {(staff || []).map((s) => (
            <tr key={s.id} onClick={() => openStaffProfile(s.reference_code || `${s.first_name} ${s.last_name}`)}>
              <td style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Contact size={14} className="text-gold" />
                {s.first_name} {s.last_name}
              </td>
              <td>{s.reference_code}</td>
              <td>{String(s.role || '').replace('_', ' ')}</td>
              <td>{s.department || '—'}</td>
              <td>{s.email || s.phone || '—'}</td>
              <td>{s.upcoming_shifts || 0}</td>
              <td><span className={`fv-status ${s.status === 'ACTIVE' ? 'ok' : 'warn'}`}>{s.status}</span></td>
            </tr>
          ))}
          {!loading && (staff || []).length === 0 && (
            <tr><td colSpan={7} style={{ textAlign: 'center', color: '#888', padding: 18 }}>No operational staff onboarded yet.</td></tr>
          )}
        </tbody>
      </table>

      {isAddOpen && (
        <OnboardStaffModal
          onClose={() => setIsAddOpen(false)}
          onSaved={() => { setIsAddOpen(false); refresh(); }}
        />
      )}
      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

/** Real onboarding form — POSTs a live staff record (no placeholder). */
const OnboardStaffModal = ({ onClose, onSaved }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('DISPATCHER');
  const [department, setDepartment] = useState('');
  const [hireDate, setHireDate] = useState('');
  const [salary, setSalary] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!firstName || !lastName) { setError('First and last name are required.'); return; }
    setSaving(true);
    try {
      await createStaffMember({
        firstName, lastName, email, phone, role, department: department || undefined,
        hireDate: hireDate || undefined, salary: salary ? Number(salary) : undefined,
      });
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" style={{ maxWidth: 520 }} onClick={(e) => e.stopPropagation()}>
        <div className="u-modal-header">
          <h2 className="u-modal-title">Onboard Operational Staff</h2>
          <button className="u-modal-btn-close" onClick={onClose}><Plus size={18} style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        <div className="u-modal-body" style={{ display: 'grid', gap: 10 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>FIRST NAME *</label>
              <input style={inp} value={firstName} onChange={(e) => setFirstName(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>LAST NAME *</label>
              <input style={inp} value={lastName} onChange={(e) => setLastName(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>ROLE</label>
              <select style={inp} value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="DISPATCHER">Dispatcher</option>
                <option value="OPERATIONS_MANAGER">Operations Manager</option>
                <option value="FINANCE">Finance</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <label style={lbl}>DEPARTMENT</label>
              <input style={inp} value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="Control Room" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>EMAIL</label>
              <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>PHONE</label>
              <input style={inp} value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>HIRE DATE</label>
              <input style={inp} type="date" value={hireDate} onChange={(e) => setHireDate(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>SALARY (£)</label>
              <input style={inp} type="number" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} />
            </div>
          </div>
          {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}
        </div>
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>CANCEL</button>
          <button className="ob-btn-complete" onClick={submit} disabled={saving}>{saving ? 'SAVING…' : 'ONBOARD STAFF'}</button>
        </div>
        <div className="security-footer">Verified by Velo AI Security Protocol</div>
      </div>
    </div>
  );
};

const lbl = { fontSize: 10, color: '#888', letterSpacing: '0.08em' };
const inp = {
  backgroundColor: '#0B0B0C', border: '1px solid #2a2a2c', borderRadius: 6, color: '#fff',
  padding: '8px 10px', fontSize: 13, width: '100%', boxSizing: 'border-box',
};

export default OperationalStaffDirectory;
