import React from 'react';
import './CommHub.css';

const CommHub = () => {
  return (
    <div className="comm-hub">
      <div className="hub-header">
        <h2>Omnichannel Communication Centre</h2>
      </div>

      <div className="comm-layout">
        
        {/* Broadcast Composer */}
        <div className="broadcast-composer surface-panel">
          <h3>New Broadcast</h3>
          
          <div className="form-group">
            <label>Target Audience</label>
            <select className="dark-select">
              <option>All Active Drivers</option>
              <option>All Office Staff</option>
              <option>All Corporate Clients</option>
            </select>
          </div>

          <div className="form-group">
            <label>Channel Type</label>
            <div className="channel-toggles">
              <button className="channel-btn active">WhatsApp</button>
              <button className="channel-btn">Professional Email</button>
              <button className="channel-btn">Mobile Push</button>
            </div>
          </div>

          <div className="form-group">
            <label>Message Content</label>
            <textarea className="dark-textarea" rows="4" placeholder="Type your broadcast message..."></textarea>
          </div>

          <div className="form-group flex-row space-between">
            <button className="btn-outline">📎 Attach Map / PDF</button>
            <button className="btn-primary">Send Broadcast</button>
          </div>
        </div>

        {/* Conversational Inbox */}
        <div className="conversational-inbox surface-panel flex-col">
          <div className="inbox-header flex-row space-between">
            <h3>Active Conversations</h3>
            <span className="unread-badge pulse">💬 3</span>
          </div>
          
          <div className="chat-window">
            <div className="chat-message received">
              <div className="chat-bubble">
                I am stuck in traffic on the M25, might be 5 mins late.
              </div>
              <span className="timestamp">14:20 - David K. (WhatsApp)</span>
            </div>
            
            <div className="chat-message sent">
              <div className="chat-bubble">
                Noted. I've updated the client via SMS. Keep me posted.
              </div>
              <span className="timestamp">14:21 - Dispatch Desk</span>
            </div>

            <div className="chat-message received">
              <div className="chat-bubble">
                <div className="asset-link">📄 Parking_Grid_Updated.pdf</div>
              </div>
              <span className="timestamp">14:25 - Sarah M. (WhatsApp)</span>
            </div>
          </div>

          <div className="chat-input-bar">
            <input type="text" placeholder="Reply via WhatsApp..." />
            <button className="btn-primary btn-sm">Send</button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default CommHub;
