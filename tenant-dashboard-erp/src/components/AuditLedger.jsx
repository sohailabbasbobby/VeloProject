import React, { useState } from 'react';
import './AuditLedger.css';

const AuditLedger = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const logs = [
    { id: 'AL-9201', time: '10:45:12 AM', actor: 'System (Autopilot)', action: 'Assigned Driver [David K.] to Booking #BK-9021', severity: 'info' },
    { id: 'AL-9202', time: '10:50:00 AM', actor: 'Dispatcher (John D.)', action: 'Modified Booking #BK-9018 destination', severity: 'warning' },
    { id: 'AL-9203', time: '11:05:44 AM', actor: 'Client (Acme Corp)', action: 'Proxy Booking Created', severity: 'info' },
    { id: 'AL-9204', time: '11:15:02 AM', actor: 'Super Admin', action: 'Revoked Access for Driver [Marcus T.]', severity: 'critical' },
  ];

  const filteredLogs = logs.filter(log => 
    log.action.toLowerCase().includes(searchTerm.toLowerCase()) || 
    log.actor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="audit-ledger-container">
      
      <div className="ledger-header space-between flex-row">
        <div>
          <h1 className="text-gold">Global Audit Ledger</h1>
          <p className="text-muted">Immutable record of all tenant ecosystem actions.</p>
        </div>
        <button className="btn-outline">Export CSV</button>
      </div>

      <div className="ledger-controls surface-panel">
        <input 
          type="text" 
          className="search-box" 
          placeholder="Search by actor, action, or booking reference..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
        <div className="flex-row gap-md mt-4">
          <label className="text-sm text-muted">Filter Severity:</label>
          <button className="badge-filter info active">Info</button>
          <button className="badge-filter warning active">Warning</button>
          <button className="badge-filter critical active">Critical</button>
        </div>
      </div>

      <div className="ledger-table-wrapper surface-panel">
        <table className="ledger-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Log ID</th>
              <th>Actor</th>
              <th>Action Details</th>
              <th>Severity</th>
            </tr>
          </thead>
          <tbody>
            {filteredLogs.map(log => (
              <tr key={log.id}>
                <td className="text-muted">{log.time}</td>
                <td className="font-mono text-xs">{log.id}</td>
                <td className="font-bold">{log.actor}</td>
                <td>{log.action}</td>
                <td>
                  <span className={`status-badge ${log.severity}`}>{log.severity}</span>
                </td>
              </tr>
            ))}
            {filteredLogs.length === 0 && (
              <tr>
                <td colSpan="5" className="text-center text-muted p-xl">No logs found matching criteria.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};

export default AuditLedger;
