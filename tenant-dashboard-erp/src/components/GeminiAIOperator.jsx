import React, { useState } from 'react';
import { Bot, Send, Activity, Search, ShieldAlert, UserCheck, Car, CalendarClock, X, Sparkles } from 'lucide-react';
import './GeminiAIOperator.css';

const GeminiAIOperator = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');

  const events = [
    { id: 1, time: '14:32', type: 'system', icon: <Activity size={14} color="var(--color-emerald)"/>, text: 'Autopilot reassigned V-003 to Sector A' },
    { id: 2, time: '14:15', type: 'alert', icon: <ShieldAlert size={14} color="var(--color-danger)"/>, text: 'V-001 approaching MOT expiration window' },
    { id: 3, time: '13:50', type: 'user', icon: <UserCheck size={14} color="var(--color-gold)"/>, text: 'Admin approved new driver: Marcus T.' },
    { id: 4, time: '13:10', type: 'vehicle', icon: <Car size={14} color="var(--color-muted)"/>, text: 'V-004 marked as Deployed (Shift Start)' },
    { id: 5, time: '11:45', type: 'schedule', icon: <CalendarClock size={14} color="var(--color-muted)"/>, text: 'Shift roster generated for tomorrow' }
  ];

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
              <span>Powered by Gemini</span>
            </div>
          </div>
          <button className="btn-icon" onClick={() => setIsOpen(false)}>
            <X size={20} color="var(--color-text-secondary)" />
          </button>
        </div>

        <div className="ai-insights mb-lg">
          <h4 className="insights-title">LIVE INSIGHTS</h4>
          <div className="insight-item">
            Wait times in Mayfair are increasing by 12%. Recommend diverting 3 available vehicles.
          </div>
          <div className="insight-item">
            Staff shift change in 15 mins. Autopilot transition scheduled.
          </div>
        </div>

        {/* AI Command Input */}
        <div className="ai-command-container mb-xl">
          <div className="ai-command-input-wrapper flex-row align-center">
            <input 
              type="text" 
              placeholder="Ask AI or type command..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="ai-command-input flex-1"
            />
            <button className="btn-ai-send">
              <Send size={16} color={query.length > 0 ? 'var(--color-gold)' : 'var(--color-muted)'} />
            </button>
          </div>
        </div>

        {/* Searchable Audit Ledger */}
        <div className="audit-ledger-container flex-col flex-1" style={{ overflow: 'hidden' }}>
          <div className="flex-row space-between align-center mb-md">
            <h4 className="insights-title m-0">EVENT STREAM & AUDIT</h4>
            <button className="btn-icon"><Search size={14} className="text-muted hover-gold" /></button>
          </div>
          
          <div className="audit-ledger-list flex-1">
            {events.map(event => (
              <div key={event.id} className="audit-event-item flex-row gap-sm align-start p-sm border-bottom-subtle">
                <div className="audit-event-icon mt-xs">
                  {event.icon}
                </div>
                <div className="flex-col gap-xs">
                  <span className="text-white text-sm">{event.text}</span>
                  <span className="text-muted" style={{ fontSize: '10px' }}>{event.time}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
};

export default GeminiAIOperator;
