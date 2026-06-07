import React, { useState } from 'react';
import CorporateBookingModal from './CorporateBookingModal';
import { Plus } from 'lucide-react';
import './CorporateAnalytics.css';

const CorporateAnalytics = () => {
  const [activeClient, setActiveClient] = useState(1);
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);

  const corporateClients = [
    { id: 1, name: 'Acme Corp', tier: 'Global Partner', arr: '£140k', activeUsers: 45, currentBalance: '£4,850.00' },
    { id: 2, name: 'Stark Industries', tier: 'Enterprise', arr: '£85k', activeUsers: 12, currentBalance: '£1,200.00' },
    { id: 3, name: 'Wayne Enterprises', tier: 'VIP Client', arr: '£210k', activeUsers: 8, currentBalance: '£9,500.00' },
  ];

  const client = corporateClients.find(c => c.id === activeClient);

  return (
    <div className="corporate-crm">
      
      <div className="crm-header flex-row space-between">
        <div>
          <h1 className="text-gold">Corporate CRM Vault</h1>
          <p className="text-muted">Manage B2B accounts, track expenditure, and trigger proxy bookings.</p>
        </div>
        <button className="btn-primary pulse" onClick={() => setBookingModalOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Plus size={18} /> PROXY BOOK FOR CLIENT
        </button>
      </div>

      <div className="crm-layout">
        
        {/* Left Column: Client List */}
        <div className="client-list surface-panel">
          <h3>Active B2B Accounts</h3>
          <input type="text" className="search-box" placeholder="Search accounts..." />
          <div className="client-items">
            {corporateClients.map(c => (
              <div 
                key={c.id} 
                className={`client-item ${activeClient === c.id ? 'selected' : ''}`}
                onClick={() => setActiveClient(c.id)}
              >
                <div className="flex-row space-between w-100">
                  <span className="font-bold">{c.name}</span>
                  <span className="text-gold text-sm">{c.tier}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Analytics & Details */}
        <div className="client-analytics">
          
          {/* Top Metric Cards */}
          <div className="metric-cards">
            <div className="surface-panel corp-metric-card">
              <h4>Annual Recurring Revenue (ARR)</h4>
              <div className="value text-gold">{client?.arr}</div>
              <div className="trend text-success">↑ 12% YOY</div>
            </div>
            <div className="surface-panel corp-metric-card">
              <h4>Current Month Ledger</h4>
              <div className="value text-danger">{client?.currentBalance}</div>
              <div className="trend text-muted">Awaiting Settlement</div>
            </div>
            <div className="surface-panel corp-metric-card">
              <h4>Authorized Bookers</h4>
              <div className="value">{client?.activeUsers}</div>
              <div className="trend text-success">+3 this month</div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="charts-row mt-4">
            
            <div className="surface-panel chart-panel flex-1">
              <h3>6-Month Expenditure Trend</h3>
              <div className="mock-bar-chart">
                <div className="bar-group">
                  <div className="bar" style={{height: '40%'}}></div>
                  <span>Jan</span>
                </div>
                <div className="bar-group">
                  <div className="bar" style={{height: '55%'}}></div>
                  <span>Feb</span>
                </div>
                <div className="bar-group">
                  <div className="bar" style={{height: '35%'}}></div>
                  <span>Mar</span>
                </div>
                <div className="bar-group">
                  <div className="bar" style={{height: '70%'}}></div>
                  <span>Apr</span>
                </div>
                <div className="bar-group">
                  <div className="bar" style={{height: '60%'}}></div>
                  <span>May</span>
                </div>
                <div className="bar-group">
                  <div className="bar" style={{height: '85%'}}></div>
                  <span>Jun</span>
                </div>
              </div>
            </div>

            <div className="surface-panel chart-panel">
              <h3>Usage by Department</h3>
              <div className="mock-pie-container">
                <div className="mock-pie-chart"></div>
                <div className="pie-legend">
                  <div className="legend-item"><span className="dot dot-gold"></span> Executive (60%)</div>
                  <div className="legend-item"><span className="dot dot-blue"></span> Legal (25%)</div>
                  <div className="legend-item"><span className="dot dot-red"></span> Client Relations (15%)</div>
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {isBookingModalOpen && (
        <CorporateBookingModal onClose={() => setBookingModalOpen(false)} />
      )}

    </div>
  );
};

export default CorporateAnalytics;
