import React, { useState, useMemo } from 'react';
import { Mail, MessageSquare, ArrowLeft, Paperclip, Send } from 'lucide-react';
import { MOCK_THREADS } from '../data/mockDatabase';
import './ConciergeFeed.css';

const ConciergeFeed = ({ clientName }) => {
  const [activeThread, setActiveThread] = useState(null);
  const [replyText, setReplyText] = useState('');

  // Filter threads for this specific client
  const clientThreads = useMemo(() => {
    return MOCK_THREADS.filter(t => t.clientName === clientName);
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
          {/* Mock previous messages in thread */}
          <div className="cf-message received">
            <div className="cf-message-bubble">
              {activeThread.preview}
            </div>
            <div className="cf-message-info">
              <span>{clientName}</span> • <span>{activeThread.lastMessageTime}</span>
            </div>
          </div>
          {activeThread.status !== 'Archived' && (
            <div className="cf-message sent">
              <div className="cf-message-bubble">
                We have received your request and our operations team is currently reviewing the vehicle capacity. We will confirm shortly.
              </div>
              <div className="cf-message-info">
                <span>System Admin</span> • <span>Just now</span>
              </div>
            </div>
          )}
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
