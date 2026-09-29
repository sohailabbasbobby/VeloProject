import React, { useCallback, useState } from 'react';
import './CommHub.css';
import { dispatchNotification, fetchNotifications, usePolling } from '../utils/api';

/**
 * OMNICHANNEL COMMUNICATION CENTRE — fully live (final-mile pass).
 * Broadcasts write real `notifications` rows via /api/notifications/dispatch
 * (IN_APP always; SMS/push channels dispatch through the platform services).
 * The thread panel shows the tenant's real dispatched messages — no fake
 * WhatsApp transcript.
 */
const CommHub = () => {
  const [audience, setAudience] = useState('TENANT_ADMIN');
  const [channel, setChannel] = useState('IN_APP');
  const [content, setContent] = useState('');
  const [status, setStatus] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => fetchNotifications(false), []);
  const { data: sent } = usePolling(load, 20000);

  const send = async () => {
    if (!content.trim()) {
      setStatus({ ok: false, text: 'Write a message before sending.' });
      return;
    }
    setBusy(true);
    setStatus(null);
    try {
      await dispatchNotification({
        recipientType: audience,
        title: 'Operator Broadcast',
        body: content.trim(),
        channels: [channel],
      });
      setStatus({ ok: true, text: 'Broadcast dispatched to the live notification service.' });
      setContent('');
    } catch (err) {
      setStatus({ ok: false, text: err.message || 'Dispatch failed.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="comm-hub">
      <div className="hub-header">
        <h2>Omnichannel Communication Centre</h2>
      </div>

      <div className="comm-layout">
        
        {/* Broadcast Composer — real dispatch */}
        <div className="broadcast-composer surface-panel">
          <h3>New Broadcast</h3>
          
          <div className="form-group">
            <label>Target Audience</label>
            <select className="dark-select" value={audience} onChange={e => setAudience(e.target.value)}>
              <option value="TENANT_ADMIN">All Office Staff (Admins)</option>
              <option value="DRIVER">All Active Drivers</option>
              <option value="PASSENGER">All Corporate Clients</option>
            </select>
          </div>

          <div className="form-group">
            <label>Channel Type</label>
            <div className="channel-toggles">
              {[
                { id: 'IN_APP', label: 'In-App' },
                { id: 'SMS', label: 'Professional SMS' },
                { id: 'PUSH', label: 'Mobile Push' },
              ].map(c => (
                <button
                  key={c.id}
                  type="button"
                  className={`channel-btn ${channel === c.id ? 'active' : ''}`}
                  onClick={() => setChannel(c.id)}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>Message Content</label>
            <textarea className="dark-textarea" rows="4" placeholder="Type your broadcast message..." value={content} onChange={e => setContent(e.target.value)}></textarea>
          </div>

          <div className="form-group flex-row space-between">
            <button className="btn-primary" onClick={send} disabled={busy}>
              {busy ? 'Dispatching…' : 'Send Broadcast'}
            </button>
            {status && (
              <span className="text-sm" style={{ color: status.ok ? 'var(--color-emerald)' : 'var(--color-danger)' }}>{status.text}</span>
            )}
          </div>
          {channel === 'PUSH' && (
            <p className="text-muted" style={{ fontSize: 11 }}>
              Push delivery requires platform push credentials; without them the in-app record is still persisted and the OS send no-ops honestly.
            </p>
          )}
        </div>

        {/* Live message log */}
        <div className="chat-preview surface-panel flex-1">
          <h3>Recent Dispatch Log (live)</h3>
          <div className="chat-messages">
            {(sent || []).slice(0, 12).map(n => (
              <div key={n.id} className="chat-message sent">
                <div className="chat-bubble">{n.title}{n.body ? ` — ${n.body}` : ''}</div>
                <span className="timestamp">
                  {n.sent_at ? new Date(n.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''} · {n.channel}
                </span>
              </div>
            ))}
            {(!sent || sent.length === 0) && (
              <div className="text-muted p-md text-sm">No dispatches yet. Sent broadcasts appear here with their channel and timestamp.</div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommHub;
