import React, { useState, useCallback } from 'react';
import { Plus, Key } from 'lucide-react';
import './PrivateClientRegistry.css';
import { fetchPrivateClients, createPrivateClient, usePolling } from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const PrivateClientRegistry = () => {
  const load = useCallback(() => fetchPrivateClients(), []);
  const { data: clients, loading, error, refresh } = usePolling(load, 30000);
  const { openClientProfile } = useEntityLinker();
  const [isAddOpen, setIsAddOpen] = useState(false);

  return (
    <div className="private-registry">
      <div className="pcr-header">
        <div>
          <h2>PRIVATE CLIENT REGISTRY</h2>
          <span className="pcr-subtitle">
            {loading ? 'Syncing live registry…' : error ? `Live feed error: ${error.message}` : `${(clients || []).length} VIP private clients · live from database`}
          </span>
        </div>
        <button className="pcr-add-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} /> Add Private Client
        </button>
      </div>

      <div className="pcr-grid">
        {(clients || []).map((c) => (
          <div key={c.id} className="pcr-card half-height" onClick={() => openClientProfile(c.reference_code || c.full_name)}>
            <div className="pcr-card-top">
              <Key size={15} className="text-gold" />
              <div className="pcr-card-name">{c.full_name}</div>
              <span className={`pcr-tier ${String(c.tier || 'BLACK').toLowerCase()}`}>VELO {String(c.tier || 'BLACK')}</span>
            </div>
            <div className="pcr-card-mid">
              <span className="pcr-meta">{c.preferred_vehicle_tier ? `Prefers ${String(c.preferred_vehicle_tier).replace('_', ' ')}` : 'No class preference'}</span>
              {c.dietary_constraints && <span className="pcr-meta">🍽 {c.dietary_constraints}</span>}
              {c.cabin_constraints && <span className="pcr-meta">🚪 {c.cabin_constraints}</span>}
              {c.privacy_level === 'GHOST' && <span className="pcr-meta gold">GHOST PROTOCOL</span>}
            </div>
            <div className="pcr-card-bottom">
              <span className="pcr-trips">{c.total_trips || 0} lifetime trips</span>
              {c.vip_notes && <span className="pcr-notes" title={c.vip_notes}>{c.vip_notes.slice(0, 60)}{c.vip_notes.length > 60 ? '…' : ''}</span>}
            </div>
          </div>
        ))}
        {!loading && (clients || []).length === 0 && (
          <div className="pcr-empty">No private clients registered yet.</div>
        )}
      </div>

      {isAddOpen && (
        <QuickPrivateClientForm
          onClose={() => setIsAddOpen(false)}
          onSaved={() => { setIsAddOpen(false); refresh(); }}
        />
      )}
      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

const QuickPrivateClientForm = ({ onClose, onSaved }) => {
  const [fullName, setFullName] = useState('');
  const [tier, setTier] = useState('BLACK');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [preferredVehicleTier, setPreferredVehicleTier] = useState('');
  const [dietaryConstraints, setDietaryConstraints] = useState('');
  const [cabinConstraints, setCabinConstraints] = useState('');
  const [vipNotes, setVipNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!fullName) { setError('Full name is required.'); return; }
    setSaving(true);
    try {
      await createPrivateClient({
        fullName, tier, email, phone,
        preferredVehicleTier: preferredVehicleTier || undefined,
        dietaryConstraints: dietaryConstraints || undefined,
        cabinConstraints: cabinConstraints || undefined,
        vipNotes: vipNotes || undefined,
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
          <h2 className="u-modal-title">Add Private Client</h2>
          <button className="u-modal-btn-close" onClick={onClose}><Plus size={18} style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        <div className="u-modal-body" style={{ display: 'grid', gap: 10 }}>
          <label style={lbl}>FULL NAME *</label>
          <input style={inp} value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Lady Violet Ashworth" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>TIER</label>
              <select style={inp} value={tier} onChange={(e) => setTier(e.target.value)}>
                <option value="BLACK">Velo Black</option>
                <option value="GOLD">Velo Gold</option>
                <option value="PLATINUM">Velo Platinum</option>
              </select>
            </div>
            <div>
              <label style={lbl}>VEHICLE CLASS PREFERENCE</label>
              <select style={inp} value={preferredVehicleTier} onChange={(e) => setPreferredVehicleTier(e.target.value)}>
                <option value="">No preference</option>
                <option value="EXECUTIVE">Executive</option>
                <option value="PREMIUM_MPV">Premium MPV</option>
                <option value="FIRST_CLASS">First-Class Luxury</option>
                <option value="ULTRA_LUXURY">Ultra-Luxury</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={lbl}>EMAIL</label>
              <input style={inp} type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>PHONE</label>
              <input style={inp} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+44 7700 900000" />
            </div>
          </div>
          <label style={lbl}>DIETARY / CABIN CONSTRAINTS</label>
          <input style={inp} value={dietaryConstraints} onChange={(e) => setDietaryConstraints(e.target.value)} placeholder="Still water, no mint" />
          <input style={inp} value={cabinConstraints} onChange={(e) => setCabinConstraints(e.target.value)} placeholder="Cabin 20°C, silence protocol" />
          <label style={lbl}>PRIVATE NOTES (never exposed cross-tenant)</label>
          <textarea style={{ ...inp, minHeight: 60 }} value={vipNotes} onChange={(e) => setVipNotes(e.target.value)} />
          {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}
        </div>
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>CANCEL</button>
          <button className="ob-btn-complete" onClick={submit} disabled={saving}>{saving ? 'SAVING…' : 'CREATE CLIENT'}</button>
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

export default PrivateClientRegistry;
