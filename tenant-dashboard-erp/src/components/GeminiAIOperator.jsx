import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, Activity, ShieldAlert, UserCheck, Car, CalendarClock, X, Sparkles, Bell } from 'lucide-react';
import './GeminiAIOperator.css';
import { fetchNotifications, fetchCommandMetrics, aiOperatorCommand, usePolling } from '../utils/api';

/**
 * VELO AI OPERATOR — fully live (final-mile pass).
 *  - Event stream: real in-app notifications (job offers, compliance warnings,
 *    payout confirmations) polled from backend-core, with live command metrics.
 *  - Command input: calls the real /api/fm/ai/command endpoint which builds a
 *    live context packet and answers via the LLM when OPENAI_API_KEY is set.
 *    Without a key it returns an honest "AI features need a provider key"
 *    state plus the live snapshot — never a fabricated answer.
 */
const iconFor = (title = '') => {
    const t = title.toLowerCase();
    if (t.includes('conflict') || t.includes('blocked') || t.includes('expired')) return <ShieldAlert size={14} color="var(--color-danger)" />;
    if (t.includes('payout') || t.includes('driver')) return <UserCheck size={14} color="var(--color-gold)" />;
    if (t.includes('vehicle') || t.includes('defect')) return <Car size={14} color="var(--color-muted)" />;
    if (t.includes('shift') || t.includes('roster')) return <CalendarClock size={14} color="var(--color-muted)" />;
    return <Activity size={14} color="var(--color-emerald)" />;
};

const GeminiAIOperator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [reply, setReply] = useState(null);
  const [replyMode, setReplyMode] = useState(null); // 'LIVE' | 'UNCONFIGURED' | null
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const loadNotifications = useCallback(() => fetchNotifications(false), []);
  const { data: notifications } = usePolling(loadNotifications, 15000);
  const loadMetrics = useCallback(() => fetchCommandMetrics(), []);
  const { data: metrics } = usePolling(loadMetrics, 20000);

  const events = (notifications || []).slice(0, 8);
  const sendRef = useRef(null);

  const sendCommand = async () => {
    const cmd = query.trim();
    if (!cmd || busy) return;
    setBusy(true);
    setError(null);
    setReply(null);
    try {
      const res = await aiOperatorCommand(cmd);
      setReply(res.reply);
      setReplyMode(res.mode);
      setQuery('');
    } catch (err) {
      setError(err.message || 'Command failed.');
    } finally {
      setBusy(false);
    }
  };
  sendRef.current = sendCommand;

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className={`ai-fab ${isOpen ? 'hidden' : ''}`} 
        onClick={() => setIsOpen(true)}
      >
        <Sparkles size={24} color="var(--color-obsidian)" />
      </button>

      {/* Floating Panel */}
      <aside className={`erp-ai-panel surface-panel floating-panel ${isOpen ? 'open' : ''}`}>
        <div className="ai-header">
          <div className="flex-row align-center gap-md flex-1">
            <div className="ai-logo-box">
              <Bot size={24} color="var(--color-obsidian)" />
            </div>
            <div className="ai-title-stack">
              <h3>Velo AI Operator</h3>
              <span>{replyMode === 'LIVE' ? 'Live LLM connected' : 'Live operational feed'}</span>
            </div>
          </div>
          <button className="btn-icon" onClick={() => setIsOpen(false)}>
            <X size={20} color="var(--color-text-secondary)" />
          </button>
        </div>

        {/* Live Insights — real command metrics from backend */}
        <div className="ai-insights mb-lg">
          <h4 className="insights-title">LIVE INSIGHTS</h4>
          {metrics ? (
            <>
              <div className="insight-item">
                {metrics.trips.enRoute} active trips · {metrics.trips.upcoming} pending · {metrics.drivers.active}/{metrics.drivers.total} drivers in service · {metrics.vehicles.occupied}/{metrics.vehicles.total} vehicles occupied.
              </div>
              <div className="insight-item">
                Platform fees MTD: £{Number(metrics.platformFeesMtd).toLocaleString('en-GB', { minimumFractionDigits: 2 })}.
              </div>
            </>
          ) : (
            <div className="insight-item">Loading live operational metrics…</div>
          )}
        </div>

        {/* AI Command Input — real backend call */}
        <div className="ai-command-container mb-xl">
          <div className="ai-command-input-wrapper flex-row align-center">
            <input 
              type="text" 
              placeholder="Ask AI or type command..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendRef.current && sendRef.current(); }}
              className="ai-command-input flex-1"
            />
            <button className="btn-ai-send" onClick={sendCommand} disabled={busy || !query.trim()} style={{ opacity: busy || !query.trim() ? 0.5 : 1 }}>
              <Send size={16} color={query.length > 0 ? 'var(--color-gold)' : 'var(--color-muted)'} />
            </button>
          </div>
          {busy && <div className="text-muted" style={{ fontSize: 11, marginTop: 8 }}>Consulting live operational context…</div>}
          {error && <div style={{ color: 'var(--color-danger)', fontSize: 11, marginTop: 8 }}>{error}</div>}
          {reply && (
            <div className="insight-item" style={{ marginTop: 10, borderLeft: '3px solid var(--color-gold)' }}>
              <div className="text-white text-sm">{reply}</div>
              {replyMode === 'UNCONFIGURED' && (
                <div className="text-muted" style={{ fontSize: 10, marginTop: 6 }}>
                  AI provider key not configured — showing live snapshot only. No fabricated answer.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Live Event Stream & Audit */}
        <div className="audit-ledger-container flex-col flex-1" style={{ overflow: 'hidden' }}>
          <div className="flex-row space-between align-center mb-md">
            <h4 className="insights-title m-0">EVENT STREAM & AUDIT</h4>
            <span className="flex-row align-center gap-xs text-muted" style={{ fontSize: 10 }}>
              <Bell size={12} /> {events.length} recent
            </span>
          </div>
          
          <div className="audit-ledger-list flex-1">
            {events.map(event => (
              <div key={event.id} className="audit-event-item flex-row gap-sm align-start p-sm border-bottom-subtle">
                <div className="audit-event-icon mt-xs">
                  {iconFor(event.title)}
                </div>
                <div className="flex-col gap-xs">
                  <span className="text-white text-sm">{event.title}{event.body ? ` — ${event.body}` : ''}</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>
                    {event.sent_at ? new Date(event.sent_at).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
              </div>
            ))}
            {events.length === 0 && (
              <div className="p-md text-muted text-sm">No live events yet. Dispatches, compliance warnings and payouts will appear here as they happen.</div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};

export default GeminiAIOperator;
