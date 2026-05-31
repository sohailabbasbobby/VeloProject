import React, { useState } from 'react';
import './EscrowController.css';

const EscrowController = () => {
  const [trades, setTrades] = useState([
    { id: 'TRD-901', origin: 'London Elite', fulfill: 'Paris Chauffeurs', fare: 850.00, status: 'HELD' },
    { id: 'TRD-902', origin: 'NYC Executive', fulfill: 'NYC Executive', fare: 120.00, status: 'RELEASED' },
    { id: 'TRD-903', origin: 'Dubai Prestige', fulfill: 'London Elite', fare: 340.00, status: 'DISPUTE' },
  ]);

  const [arbitrationOpen, setArbitrationOpen] = useState(false);
  const [activeTrade, setActiveTrade] = useState(null);

  const handleFreeze = (id) => {
    setTrades(trades.map(t => t.id === id ? { ...t, status: 'FROZEN' } : t));
  };

  const handleArbitrate = (trade) => {
    setActiveTrade(trade);
    setArbitrationOpen(true);
  };

  return (
    <div className="escrow-controller">
      <div className="view-header">
        <h2>Escrow & Dispute Controller Terminal</h2>
        <p className="text-muted">Global clearinghouse matrix for active and completed network trades.</p>
      </div>

      <div className="escrow-table-wrapper surface-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Booking ID</th>
              <th>Origin Tenant</th>
              <th>Fulfill Tenant</th>
              <th>Wholesale Fare</th>
              <th>Escrow State</th>
              <th>Action Triggers</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(trade => (
              <tr key={trade.id} className={trade.status === 'FROZEN' ? 'row-frozen' : ''}>
                <td className="font-mono">{trade.id}</td>
                <td>{trade.origin}</td>
                <td>{trade.fulfill}</td>
                <td className="text-gold font-mono">£{trade.fare.toFixed(2)}</td>
                <td>
                  <span className={`badge badge-${trade.status.toLowerCase()}`}>
                    {trade.status}
                  </span>
                </td>
                <td>
                  <div className="action-buttons">
                    <button className="btn-danger" onClick={() => handleFreeze(trade.id)}>
                      ⏸️ FREEZE
                    </button>
                    <button className="btn-warning" onClick={() => handleArbitrate(trade)}>
                      ⚠️ ARBITRATE
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Arbitration Slide-Out Panel */}
      <div className={`arbitration-panel ${arbitrationOpen ? 'open' : ''}`}>
        <div className="panel-header">
          <h3>Arbitration Audit Workspace</h3>
          <button className="btn-outline" onClick={() => setArbitrationOpen(false)}>Close</button>
        </div>
        
        {activeTrade && (
          <div className="panel-content">
            <div className="audit-section">
              <h4>Booking Metrics: {activeTrade.id}</h4>
              <p className="font-mono text-muted mt-2">Origin: {activeTrade.origin} | Exec: {activeTrade.fulfill}</p>
            </div>
            
            <div className="audit-section">
              <h4>Telematics GPS Log</h4>
              <div className="log-box font-mono text-sm">
                [14:02:11] VEHICLE ARRIVED AT PICKUP<br/>
                [14:15:00] NO PASSENGER DETECTED<br/>
                [14:22:45] CHAUFFEUR MARKED NO-SHOW
              </div>
            </div>

            <div className="audit-section">
              <h4>Communication Transcript</h4>
              <div className="transcript-box">
                <div className="msg driver">
                  <strong>Driver:</strong> I have been waiting 20 minutes outside departures.
                </div>
                <div className="msg client">
                  <strong>Client:</strong> I am at arrivals, where are you? You went to the wrong terminal.
                </div>
                <div className="msg driver">
                  <span className="asset-link text-action">📍 GPS_Ping_Attachment.png</span>
                </div>
              </div>
            </div>
            
            <div className="panel-footer">
              <button className="btn-danger">Refund Client</button>
              <button className="btn-primary">Payout Driver</button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default EscrowController;
