import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, ArrowLeft, Send, Loader2 } from 'lucide-react';
import './ConciergeFeed.css';
import { api } from '../utils/api';

/**
 * CLIENT ENGAGEMENT FEED — real message threads from the `messages` table
 * (thread_type CLIENT_ENGAGEMENT, thread_key = client reference). Sending writes
 * through the live API; the old mock thread generator and alert() sends are gone.
 */
const ConciergeFeed = ({ clientRef, clientName }) => {
  const [activeThreadId, setActiveThreadId] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!clientRef) return;
    setLoading(true);
    try {
      const rows = await api.get(`/api/trips/messages?threadType=CLIENT_ENGAGEMENT&threadKey=${encodeURIComponent(clientRef)}`);
      setMessages(rows || []);
    } catch {
      setMessages([]);
    } finally {
      setLoading(false);
    }
  }, [clientRef]);

  useEffect(() => { load(); }, [load]);

  const send = async () => {
    if (!replyText.trim()) return;
    setSending(true);
    try {
      await api.post('/api/trips/messages', {
        threadType: 'CLIENT_ENGAGEMENT',
        threadKey: clientRef,
        senderType: 'DISPATCHER',
        body: replyText.trim(),
      });
      setReplyText('');
      await load();
    } finally {
      setSending(false);
    }
  };

  const active = messages.find((m) => m.id === activeThreadId);

  if (active) {
    return (
      <div className="cf-thread-view">
        <div className="cf-thread-header">
          <button className="cf-back-btn" onClick={() => setActiveThreadId(null)}>
            <ArrowLeft size={18} />
          </button>
          <div className="cf-thread-title-group">
            <h3 className="cf-thread-subject">Engagement · {clientName || clientRef}</h3>
            <div className="cf-thread-meta">
              <span className="cf-thread-id">{clientRef}</span>
            </div>
          </div>
        </div>
        <div className="cf-message-list">
          {[...messages].filter((m) => m.thread_key === active.thread_key).reverse().map((m) => (
            <div key={m.id} className={`cf-message ${m.sender_type === 'DISPATCHER' ? 'outbound' : 'inbound'}`}>
              <div className="cf-bubble">
                <div className="cf-sender">{m.sender_type}</div>
                <div className="cf-text">{m.body}</div>
                <div className="cf-time">{new Date(m.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="cf-reply-bar">
          <input
            className="cf-reply-input"
            placeholder="Reply to client…"
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
          />
          <button className="cf-send-btn" onClick={send} disabled={sending}>
            {sending ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
          </button>
        </div>
      </div>
    );
  }

  // Group into threads by day for the list view
  const list = messages;
  return (
    <div className="cf-feed">
      <div className="cf-list-header">
        <MessageSquare size={14} />
        <span>ENGAGEMENT & COMMUNICATION · {clientName || clientRef}</span>
      </div>
      {loading && <div style={{ color: '#888', padding: 14, fontSize: 12 }}>Loading live engagement history…</div>}
      <div className="cf-thread-list">
        {list.slice(0, 30).map((m) => (
          <div
            key={m.id}
            className={`cf-thread-row ${activeThreadId === m.id ? 'active' : ''}`}
            onClick={() => setActiveThreadId(m.id)}
          >
            <div className="cf-row-main">
              <div className="cf-row-subject">{m.body.slice(0, 64)}{m.body.length > 64 ? '…' : ''}</div>
              <div className="cf-row-preview">{m.sender_type} · {new Date(m.created_at).toLocaleString()}</div>
            </div>
          </div>
        ))}
        {!loading && list.length === 0 && (
          <div style={{ color: '#888', padding: 14, fontSize: 12 }}>
            No engagement messages yet — replies you send here are stored against this client's live thread.
          </div>
        )}
      </div>
      <div className="cf-reply-bar">
        <input
          className="cf-reply-input"
          placeholder={`Message ${clientName || 'client'}…`}
          value={replyText}
          onChange={(e) => setReplyText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
        />
        <button className="cf-send-btn" onClick={send} disabled={sending}>
          {sending ? <Loader2 size={15} className="spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
};

export default ConciergeFeed;
