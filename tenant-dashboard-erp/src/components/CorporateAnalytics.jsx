import React, { useState } from 'react';
import CorporateBookingModal from './CorporateBookingModal';
import './CorporateAnalytics.css';

const CorporateAnalytics = () => {
  const [isBookingModalOpen, setBookingModalOpen] = useState(false);

  return (
    <div className="corporate-analytics">
      
      <div className="corp-header flex-row space-between">
        <div>
          <h2 className="text-gold">Acme Corp Global Dashboard</h2>
          <p className="text-muted">High-density corporate usage analytics and deployment console.</p>
        </div>
        <button className="btn-primary pulse" onClick={() => setBookingModalOpen(true)}>
          ➕ BOOK LUXURY RUN
        </button>
      </div>

      {/* Top Metric Cards */}
      <div className="metric-cards">
        <div className="surface-panel corp-metric-card">
          <h4>Total Active Transfers</h4>
          <div className="value">4</div>
          <div className="trend text-success">↑ 2 from yesterday</div>
        </div>
        <div className="surface-panel corp-metric-card">
          <h4>Upcoming Multi-Stop Runs</h4>
          <div className="value">12</div>
          <div className="trend text-muted">Next 7 days</div>
        </div>
        <div className="surface-panel corp-metric-card">
          <h4>Monthly Logged Spend</h4>
          <div className="value text-gold">£4,850.00</div>
          <div className="trend text-danger">↑ 15% vs last month</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="charts-row">
        
        {/* Mock Bar Chart - 6 Month Trend */}
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

        {/* Mock Pie Chart - Department Usage */}
        <div className="surface-panel chart-panel">
          <h3>Usage by Department</h3>
          <div className="mock-pie-container">
            <div className="mock-pie-chart"></div>
            <div className="pie-legend">
              <div className="legend-item"><span className="dot dot-gold"></span> Executive Board (60%)</div>
              <div className="legend-item"><span className="dot dot-blue"></span> Legal & Compliance (25%)</div>
              <div className="legend-item"><span className="dot dot-red"></span> Client Relations (15%)</div>
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
