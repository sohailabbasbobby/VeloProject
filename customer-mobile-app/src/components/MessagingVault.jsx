import React from 'react';
import './MessagingVault.css';

const MessagingVault = () => {
  return (
    <div className="messaging-vault">
      
      {/* Header Bar */}
      <div className="vault-header">
        <div className="driver-info flex-row">
          <div className="driver-avatar">D</div>
          <div>
            <h3 className="driver-name">Dave</h3>
            <span className="driver-vehicle text-muted text-xs">Mercedes S-Class</span>
          </div>
        </div>
        <button className="call-btn">
          📞 CALL CHAUFFEUR (MASKED)
        </button>
      </div>

      {/* Chat Messages */}
      <div className="chat-window">
        <div className="message received">
          <div className="bubble">
            Good afternoon Mr. John, I am allocated as your chauffeur today. I am currently 15 minutes away from Plumtree Court.
          </div>
          <span className="timestamp">14:02</span>
        </div>

        <div className="message sent">
          <div className="bubble">
            Understood. I will be exiting via the North Bank doors. 
          </div>
          <span className="timestamp">14:05</span>
        </div>

        <div className="message sent media-message">
          <div className="bubble">
            <div className="media-attachment">
              <span className="icon">🖼️</span>
              <div className="file-info">
                <span className="filename">IMG_9402.JPG</span>
                <span className="filedesc text-muted text-xs">Luggage Stack Asset Attached</span>
              </div>
            </div>
          </div>
          <span className="timestamp">14:06</span>
        </div>
      </div>

      {/* Input Area & Disclaimer */}
      <div className="vault-footer">
        <div className="disclaimer">
          🔒 This travel tunnel is securely mirrored in real time onto your dispatch monitoring office for quality assurance and premium safety control.
        </div>
        <div className="input-box">
          <button className="attach-btn">📎</button>
          <input type="text" placeholder="Type instructions..." />
          <button className="send-btn text-action">➤</button>
        </div>
      </div>

    </div>
  );
};

export default MessagingVault;
