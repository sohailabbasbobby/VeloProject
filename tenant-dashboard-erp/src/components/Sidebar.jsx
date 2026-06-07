import React, { useContext } from 'react';
import { RoleContext } from '../App';
import { 
  LayoutGrid, CalendarDays, Users, ShieldCheck, 
  Car, Briefcase, Building2, ScrollText, BarChart3,
  MapPin, CreditCard, Plus, HelpCircle, LogOut
} from 'lucide-react';
import './Sidebar.css';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { role } = useContext(RoleContext);

  return (
    <aside className="erp-sidebar surface-panel">
      <div className="brand-zone">
        <h2 className="velo-logo">Velo</h2>
      </div>

      {role !== 'Corporate_Client' && (
        <div className="tenant-brand-card">
          <div className="tenant-logo-shield">
            <ShieldCheck size={24} color="var(--color-obsidian)" />
          </div>
          <div className="tenant-info">
            <h3 className="tenant-name">VELO EXECUTIVE</h3>
            <span className="tenant-subtitle">Dispatch Command</span>
          </div>
        </div>
      )}

      <nav className="nav-menu">
        {/* Internal Navigation */}
        {role !== 'Corporate_Client' && (
          <>
            <button className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`} onClick={() => setActiveTab('overview')}>
              <LayoutGrid className="icon" size={18} /> Command Center
            </button>
            <button className={`nav-item ${activeTab === 'fleet_vault' ? 'active' : ''}`} onClick={() => setActiveTab('fleet_vault')}>
              <Car className="icon" size={18} /> Fleet Vault
            </button>
            <button className={`nav-item ${activeTab === 'staff' ? 'active' : ''}`} onClick={() => setActiveTab('staff')}>
              <Briefcase className="icon" size={18} /> Chauffeur & Staff
            </button>
            <button className={`nav-item ${activeTab === 'corp_analytics' ? 'active' : ''}`} onClick={() => setActiveTab('corp_analytics')}>
              <Users className="icon" size={18} /> CRM
            </button>
            <button className={`nav-item ${activeTab === 'rota' ? 'active' : ''}`} onClick={() => setActiveTab('rota')}>
              <CalendarDays className="icon" size={18} /> Rota
            </button>
            <button className={`nav-item ${activeTab === 'reporting' ? 'active' : ''}`} onClick={() => setActiveTab('reporting')}>
              <BarChart3 className="icon" size={18} /> Reports & Tax
            </button>
            <button className={`nav-item ${activeTab === 'audit_ledger' ? 'active' : ''}`} onClick={() => setActiveTab('audit_ledger')}>
              <ScrollText className="icon" size={18} /> System Audit
            </button>
          </>
        )}

        {/* Corporate Client Navigation */}
        {role === 'Corporate_Client' && (
          <>
            <button className={`nav-item ${activeTab === 'corp_analytics' ? 'active' : ''}`} onClick={() => setActiveTab('corp_analytics')}>
              <Building2 className="icon" size={18} /> Analytics & Booking
            </button>
            <button className={`nav-item ${activeTab === 'corp_trips' ? 'active' : ''}`} onClick={() => setActiveTab('corp_trips')}>
              <MapPin className="icon" size={18} /> Trip Matrix
            </button>
            <button className={`nav-item ${activeTab === 'corp_roster' ? 'active' : ''}`} onClick={() => setActiveTab('corp_roster')}>
              <Users className="icon" size={18} /> Travel Roster
            </button>
            <button className={`nav-item ${activeTab === 'corp_wallet' ? 'active' : ''}`} onClick={() => setActiveTab('corp_wallet')}>
              <CreditCard className="icon" size={18} /> Account & Wallet
            </button>
          </>
        )}
      </nav>

      <div className="sidebar-bottom-actions">
        {role !== 'Corporate_Client' && (
          <button className="btn-new-dispatch">
            <Plus size={18} /> New Dispatch
          </button>
        )}
        <button className="nav-item">
          <HelpCircle className="icon" size={18} /> Help
        </button>
        <button className="nav-item">
          <LogOut className="icon" size={18} /> Logout
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
