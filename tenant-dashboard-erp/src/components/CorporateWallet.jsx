import React, { useMemo, useState } from 'react';
import './CorporateWallet.css';
import { fetchCorporateAccounts, usePolling } from '../utils/api';

const gbp = (n) =>
  Number(n || 0).toLocaleString('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CorporateWallet = () => {
  const loadAccounts = React.useCallback(() => fetchCorporateAccounts(), []);
  const { data: accounts, loading, error } = usePolling(loadAccounts, 30000);
  const [selectedId, setSelectedId] = useState(null);

  const list = useMemo(() => accounts || [], [accounts]);
  const totals = useMemo(() => {
    const credit = list.reduce((sum, a) => sum + Number(a.line_of_credit_limit || 0), 0);
    const outstanding = list.reduce((sum, a) => sum + Number(a.outstanding_total || 0), 0);
    const openInvoices = list.reduce((sum, a) => sum + Number(a.open_invoice_count || 0), 0);
    return { credit, outstanding, openInvoices };
  }, [list]);

  // Selected account (defaults to the first), for the focused usage card
  const selected = useMemo(
    () => list.find((a) => a.id === selectedId) || list[0] || null,
    [list, selectedId]
  );

  return (
    <div className="corporate-wallet">
      <div className="corp-header">
        <h2>Account &amp; Wallet</h2>
        <p className="text-muted">
          {loading
            ? 'Syncing live billing data…'
            : error
              ? `Live feed error: ${error.message}`
              : 'Corporate credit allocations and billing cycle tracking — live from corporate accounts & invoices.'}
        </p>
      </div>

      {!loading && !error && list.length === 0 && (
        <div className="wallet-card surface-panel">
          <h3>No Corporate Accounts Yet</h3>
          <p className="text-muted text-sm mt-2">
            Credit allocations and billing cycles will appear here once corporate accounts are onboarded via the
            Corporate Accounts &amp; Billing hub.
          </p>
        </div>
      )}

      {list.length > 0 && (
        <>
          <div className="wallet-grid">

            <div className="wallet-card surface-panel">
              <h3>Portfolio Summary</h3>
              <div className="allocation-status mt-4">
                <span className="icon text-gold">🧾</span>
                <div className="status-text">
                  <strong>{list.length} CORPORATE ACCOUNT{list.length === 1 ? '' : 'S'}</strong>
                  <div className="text-muted text-sm mt-2">
                    {totals.openInvoices} open invoice{totals.openInvoices === 1 ? '' : 's'} across all accounts ·
                    Net-{list.length === 1 ? (list[0].payment_terms_days || 30) : '30'}-style terms per account.
                  </div>
                </div>
              </div>
              <div className="usage-meter mt-4">
                <div className="usage-labels flex-row space-between">
                  <span>{gbp(totals.outstanding)} Outstanding</span>
                  <span className="text-muted">{gbp(totals.credit)} Total Credit Limit</span>
                </div>
                <div className="progress-bar-bg mt-2">
                  <div
                    className="progress-bar-fill"
                    style={{ width: `${totals.credit > 0 ? Math.min(100, (totals.outstanding / totals.credit) * 100) : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>

            {selected && (
              <div className="wallet-card surface-panel">
                <h3>{selected.company_name}</h3>
                {list.length > 1 && (
                  <select
                    className="mt-2"
                    style={{
                      background: 'rgba(255,255,255,0.05)',
                      color: 'white',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '4px',
                      padding: '6px 10px',
                      fontSize: '12px',
                    }}
                    value={selected.id}
                    onChange={(e) => setSelectedId(e.target.value)}
                  >
                    {list.map((a) => (
                      <option key={a.id} value={a.id} style={{ background: '#111' }}>{a.company_name}</option>
                    ))}
                  </select>
                )}
                <div className="usage-meter mt-4">
                  <div className="usage-labels flex-row space-between">
                    <span>{gbp(selected.outstanding_total)} Outstanding</span>
                    <span className="text-muted">
                      {selected.line_of_credit_limit ? `${gbp(selected.line_of_credit_limit)} Limit` : 'No credit limit set'}
                    </span>
                  </div>
                  <div className="progress-bar-bg mt-2">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${
                          Number(selected.line_of_credit_limit) > 0
                            ? Math.min(100, (Number(selected.outstanding_total || 0) / Number(selected.line_of_credit_limit)) * 100)
                            : 0
                        }%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div className="text-muted text-sm mt-4">
                  Status: <strong className="text-white">{selected.status || 'ACTIVE'}</strong>
                  {' · '}Payment terms: Net-{selected.payment_terms_days || 30}
                  {' · '}{selected.authorized_user_count || 0} authorized booker{(selected.authorized_user_count || 0) === 1 ? '' : 's'}
                  {selected.billing_email ? ` · ${selected.billing_email}` : ''}
                </div>
              </div>
            )}

          </div>

          {list.length > 1 && (
            <div className="wallet-grid">
              <div className="wallet-card surface-panel" style={{ gridColumn: '1 / -1' }}>
                <h3>All Accounts</h3>
                <div className="mt-4">
                  {list.map((a) => {
                    const usagePct =
                      Number(a.line_of_credit_limit) > 0
                        ? Math.min(100, (Number(a.outstanding_total || 0) / Number(a.line_of_credit_limit)) * 100)
                        : 0;
                    return (
                      <div key={a.id} className="mt-4">
                        <div className="usage-labels flex-row space-between">
                          <span className="text-white text-sm">{a.company_name}</span>
                          <span className="text-muted text-sm">
                            {gbp(a.outstanding_total)} outstanding
                            {a.open_invoice_count ? ` · ${a.open_invoice_count} open invoice${a.open_invoice_count === 1 ? '' : 's'}` : ''}
                          </span>
                        </div>
                        <div className="progress-bar-bg mt-2">
                          <div className="progress-bar-fill" style={{ width: `${usagePct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

export default CorporateWallet;
