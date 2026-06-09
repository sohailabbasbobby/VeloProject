import React, { useState, useMemo } from 'react';
import { Mail, MessageSquare, ArrowLeft, Paperclip, Send } from 'lucide-react';
import { MOCK_THREADS } from '../data/mockDatabase';
import './ConciergeFeed.css';

const ConciergeFeed = ({ clientName }) => {
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');

  const clientThreads = useMemo(() => {
    const found = MOCK_THREADS.filter(t => t.clientName === clientName);
    if (found.length > 0) return found;
    
    // Force-inject 10 mock communication threads into the Engagement tab if empty
    return Array.from({length: 10}).map((_, i) => ({
      id: `MSG-F${100+i}`,
      clientName: clientName,
      subject: `Automated Chauffeur Update #${i+1}`,
      status: i === 0 ? 'Urgent' : (i < 3 ? 'In-Progress' : 'Archived'),
      lastMessageTime: `2026-06-0${8-i}`,
      preview: `System notification regarding status update and shift alignment.`,
      messages: [
        { sender: 'System Admin', time: `2026-06-0${8-i}`, text: `System notification regarding status update and shift alignment.` }
      ]
    }));
  }, [clientName]);

  const handleSendReply = () => {
    if (!replyText.trim()) return;
    alert(`[Mock Send] Message sent to ${clientName} on thread ${activeThread.id}`);
    setReplyText('');
  };

  if (activeThread) {
    return (
      <div className="cf-thread-view">
        <div className="cf-thread-header">
          <button className="cf-back-btn" onClick={() => setActiveThread(null)}>
            <ArrowLeft size={18} />
          </button>
          <div className="cf-thread-title-group">
            <h3 className="cf-thread-subject">{activeThread.subject}</h3>
            <div className="cf-thread-meta">
              <span className="cf-thread-id">{activeThread.id}</span>
              <span>•</span>
              <span>{activeThread.lastMessageTime}</span>
            </div>
          </div>
          <div className={`cf-badge ${activeThread.status === 'Urgent' ? 'urgent' : activeThread.status === 'In-Progress' ? 'progress' : 'archived'}`}>
            {activeThread.status}
          </div>
        </div>

        <div className="cf-message-list">
          {activeThread.messages?.map((msg, idx) => (
            <div key={idx} className={`cf-message ${msg.sender === 'System Admin' ? 'sent' : 'received'}`}>
              <div className="cf-message-bubble">
                {msg.text}
              </div>
              <div className="cf-message-info">
                <span>{msg.sender}</span> • <span>{msg.time}</span>
              </div>
            </div>
          ))}
        </div>

        {activeThread.status !== 'Archived' && (
          <div className="cf-reply-box">
            <textarea 
              className="cf-reply-input" 
              placeholder="Type your reply here..." 
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
            />
            <div className="cf-reply-actions">
              <div className="cf-reply-tools">
                <button className="cf-tool-btn"><Paperclip size={16} /></button>
              </div>
              <button className="cf-btn-primary" style={{ flex: 'none' }} onClick={handleSendReply}>
                <Send size={14} /> Send Message
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (clientThreads.length === 0) {
    return (
      <div className="cf-container" style={{ alignItems: 'center', justifyContent: 'center', color: 'var(--color-text-muted)' }}>
        <MessageSquare size={32} style={{ marginBottom: '16px', opacity: 0.5 }} />
        <p>No engagement threads found for {clientName}.</p>
      </div>
    );
  }

  return (
    <div className="cf-container">
      <div className="cf-feed-list">
        {clientThreads.map(thread => {
          let badgeClass = 'archived';
          if (thread.status === 'Urgent') badgeClass = 'urgent';
          if (thread.status === 'In-Progress') badgeClass = 'progress';

          return (
            <div key={thread.id} className="cf-card" onClick={() => setActiveThread(thread)}>
              <div className="cf-card-header">
                <h3 className="cf-card-subject">{thread.subject}</h3>
                <span className={`cf-badge ${badgeClass}`}>{thread.status}</span>
              </div>
              
              <div className="cf-card-meta">
                <span className="cf-thread-sender" style={{fontWeight: 'bold', color: 'var(--color-gold)'}}>{thread.clientName || 'System'}</span>
                <span>•</span>
                <span className="cf-thread-id">{thread.id}</span>
                <span>•</span>
                <span>{thread.lastMessageTime}</span>
              </div>

              <div className="cf-card-preview">
                "{thread.preview}"
              </div>

              <div className="cf-card-actions">
                <button className="cf-btn-primary" onClick={(e) => {
                  e.stopPropagation();
                  setActiveThread(thread);
                }}>
                  Open Thread
                </button>
                <button className="cf-btn-secondary" onClick={(e) => {
                  e.stopPropagation();
                  alert(`[Mock Send] Quick reply to ${thread.id}`);
                }}>
                  <Mail size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ConciergeFeed;
