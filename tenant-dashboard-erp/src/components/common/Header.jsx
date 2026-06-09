import React, { useState, useEffect } from 'react';
import { Shield, Home, Plus, Zap, Bell, Settings, Maximize, Minimize } from 'lucide-react';
import '../../styles/Header.css';

const Header = ({ 
  role, 
  setRole, 
  handleHomeClick, 
  setDispatchModalOpen, 
  isAutopilotActive, 
  setIsAutopilotActive, 
  setActiveTab 
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullScreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  return (
    <header className="erp-header">
      <div className="header-left flex-row align-center gap-md">
        <button className="btn-icon" onClick={handleHomeClick} title="Home Dashboard" style={{ padding: '8px', cursor: 'pointer', background: 'transparent', border: 'none' }}>
          <Home size={24} color="#ffffff" className="hover-gold transition-all" />
        </button>
        <div className="brand-logo" style={{ cursor: 'pointer', marginLeft: '12px' }} onClick={handleHomeClick}>
          <Shield size={24} color="var(--color-gold)" />
          <span>VELO EXECUTIVE</span>
        </div>
      </div>
      
      <div className="header-actions">
        <button 
          className="btn-primary flex-row align-center gap-sm" 
          onClick={() => setDispatchModalOpen(true)}
        >
          <Plus size={16} /> New Dispatch
        </button>

        {role !== 'Corporate_Client' && (
          <button 
            className={`btn-autopilot ${isAutopilotActive ? 'active' : ''}`} 
            onClick={() => setIsAutopilotActive(!isAutopilotActive)}
          >
            <Zap size={16} /> Autopilot {isAutopilotActive ? 'ON' : 'OFF'}
          </button>
        )}
        
        <div className="header-icons">
          <button onClick={toggleFullScreen} className="fs-toggle-btn" aria-label="Toggle Full Screen">
            {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
          </button>
          <Bell size={20} className="hover-gold cursor-pointer" />
          <Settings size={20} className="hover-gold cursor-pointer" />
        </div>
        
        <div className="rbac-toggle">
          <select 
            value={role} 
            onChange={(e) => {
              setRole(e.target.value);
              if (e.target.value === 'Corporate_Client') {
                setActiveTab('corp_analytics');
              } else {
                setActiveTab('command_center');
              }
            }}
            className="role-select"
          >
            <option value="Super_Admin">Super Admin</option>
            <option value="Dispatcher">Dispatcher</option>
            <option value="Corporate_Client">Corporate Client</option>
          </select>
          <div className="avatar-mock ml-2">
             <img src="https://i.pravatar.cc/150?u=a042581f4e29026024d" alt="Profile" />
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
