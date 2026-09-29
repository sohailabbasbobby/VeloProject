import React, { useState, useCallback } from 'react';
import { Plus, Briefcase, Receipt } from 'lucide-react';
import './CorporateClientHub.css';
import { fetchCorporateAccounts, createCorporateAccount, usePolling } from '../utils/api';
import { useEntityLinker } from '../contexts/EntityLinkerContext';

const CorporateClientHub = () => {
  const load = useCallback(() => fetchCorporateAccounts(), []);
  const { data: accounts, loading, error } = usePolling(load, 30000);
  const { openClientProfile } = useEntityLinker();
  const [isAddOpen, setIsAddOpen] = useState(false);

  const outstanding = (accounts || []).reduce((sum, a) => sum + Number(a.outstanding_total || 0), 0);

  return (
    <div className="corporate-hub">
      <div className="cch-header">
        <div>
          <h2>CORPORATE ACCOUNTS & BILLING</h2>
          <span className="cch-subtitle">
            {loading ? 'Syncing live account data…' : error ? `Live feed error: ${error.message}` : `${(accounts || []).length} corporate accounts · £${outstanding.toFixed(2)} outstanding`}
          </span>
        </div>
        <button className="cch-add-btn" onClick={() => setIsAddOpen(true)}>
          <Plus size={14} /> New Corporate Account
        </button>
      </div>

      <div className="cch-grid">
        {(accounts || []).map((a) => (
          <div key={a.id} className="cch-card half-height" onClick={() => openClientProfile(a.reference_code || a.company_name)}>
            <div className="cch-card-top">
              <Briefcase size={16} className="text-gold" />
              <div className="cch-card-name">{a.company_name}</div>
              <span className="cch-ref">{a.reference_code}</span>
            </div>
            <div className="cch-card-mid">
              <span className={`cch-pill ${a.status === 'ACTIVE' ? 'ok' : 'warn'}`}>{a.status}</span>
              <span className="cch-meta">{a.authorized_user_count || 0} authorized user{(a.authorized_user_count || 0) === 1 ? '' : 's'}</span>
              <span className="cch-meta">Terms {a.payment_terms_days}d{a.purchase_order_required ? ' · PO required' : ''}</span>
            </div>
            <div className="cch-card-bottom">
              <Receipt size={13} />
              <span>{a.open_invoice_count || 0} open invoice{(a.open_invoice_count || 0) === 1 ? '' : 's'}</span>
              <span className="cch-outstanding">£{Number(a.outstanding_total || 0).toFixed(2)}</span>
            </div>
          </div>
        ))}
        {!loading && (accounts || []).length === 0 && (
          <div className="cch-empty">No corporate accounts yet. Create the first B2B billing relationship.</div>
        )}
      </div>

      {isAddOpen && <QuickCorporateForm onClose={() => setIsAddOpen(false)} />}
      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

/** Inline quick-create form — full CRUD (authorized users, credit) lives in CorporateProfileModal. */
const QuickCorporateForm = ({ onClose }) => {
  const [companyName, setCompanyName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [creditLimit, setCreditLimit] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const submit = async () => {
    if (!companyName) { setError('Company name is required.'); return; }
    setSaving(true);
    try {
      await createCorporateAccount({
        companyName, billingEmail, industry,
        lineOfCreditLimit: creditLimit ? Number(creditLimit) : undefined,
      });
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="u-modal-overlay" onClick={onClose}>
      <div className="u-modal-container" style={{ maxWidth: 480 }} onClick={(e) => e.stopPropagation()}>
        <div className="u-modal-header">
          <h2 className="u-modal-title">New Corporate Account</h2>
          <button className="u-modal-btn-close" onClick={onClose}><Plus size={18} style={{ transform: 'rotate(45deg)' }} /></button>
        </div>
        <div className="u-modal-body" style={{ display: 'grid', gap: 10 }}>
          <label style={lbl}>COMPANY NAME *</label>
          <input style={inp} value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Goldman Sachs International" />
          <label style={lbl}>BILLING EMAIL</label>
          <input style={inp} type="email" value={billingEmail} onChange={(e) => setBillingEmail(e.target.value)} placeholder="accounts@company.co.uk" />
          <label style={lbl}>INDUSTRY</label>
          <input style={inp} value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="Investment Banking" />
          <label style={lbl}>LINE OF CREDIT LIMIT (£)</label>
          <input style={inp} type="number" step="0.01" value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} />
          {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}
        </div>
        <div className="u-modal-footer" style={{ justifyContent: 'space-between' }}>
          <button className="ob-btn-draft" onClick={onClose}>CANCEL</button>
          <button className="ob-btn-complete" onClick={submit} disabled={saving}>{saving ? 'CREATING…' : 'CREATE ACCOUNT'}</button>
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

export default CorporateClientHub;
