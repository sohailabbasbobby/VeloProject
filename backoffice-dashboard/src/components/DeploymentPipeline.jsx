import React, { useState, useEffect, useRef } from 'react';
import './DeploymentPipeline.css';

const MOCK_LOGS = [
  "[01:22:40] ENGINE: Initializing asset database layout configuration tables for new tenant...",
  "[01:22:45] CLOUD: Generating secure SSL configuration mappings for endpoint subdomain...",
  "[01:22:49] BUILD: Compiling iOS Swift binaries with injected tenant styling...",
  "[01:22:55] BUILD: Android Gradle assembling release APK...",
  "[01:23:02] STRIPE: Provisioning new Stripe Connect Custom Account...",
  "[01:23:05] ENGINE: Synchronizing global rate limit filters...",
  "[01:23:10] DONE: Tenant 'NYC Executive' successfully scaffolded."
];

const DeploymentPipeline = () => {
  const [showProvision, setShowProvision] = useState(false);
  
  // Ticker Logic
  const [logs, setLogs] = useState([]);
  const [logIndex, setLogIndex] = useState(0);
  const tickerRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      if (logIndex < MOCK_LOGS.length) {
        setLogs(prev => [...prev, MOCK_LOGS[logIndex]]);
        setLogIndex(prev => prev + 1);
      } else {
        // Reset loop for simulation purposes
        setLogs([]);
        setLogIndex(0);
      }
    }, 2500);

    return () => clearInterval(timer);
  }, [logIndex]);

  useEffect(() => {
    if (tickerRef.current) {
      tickerRef.current.scrollTop = tickerRef.current.scrollHeight;
    }
  }, [logs]);

  return (
    <div className="deployment-pipeline">
      
      <div className="view-header flex-row space-between">
        <div>
          <h2>White-Label Tenant Deployment Pipeline</h2>
          <p className="text-muted">Automated onboarding matrix for new network partners.</p>
        </div>
        <button className="btn-primary" onClick={() => setShowProvision(true)}>
          ➕ PROVISION NEW TENANT
        </button>
      </div>

      <div className="pipeline-grid surface-panel">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tenant Name</th>
              <th>Custom Domain Mapping</th>
              <th>iOS App Store Status</th>
              <th>Google Play Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>London Elite Chauffeurs</td>
              <td className="font-mono text-muted">londonelite.velo.com</td>
              <td><span className="badge badge-released">LIVE</span></td>
              <td><span className="badge badge-released">LIVE</span></td>
              <td><button className="btn-outline">Manage</button></td>
            </tr>
            <tr>
              <td>Paris VIP Transfers</td>
              <td className="font-mono text-muted">parisvip.velo.com</td>
              <td><span className="badge badge-dispute">PROCESSING</span></td>
              <td><span className="badge badge-released">LIVE</span></td>
              <td><button className="btn-outline">Manage</button></td>
            </tr>
            <tr>
              <td>NYC Executive</td>
              <td className="font-mono text-muted">nycexec.velo.com</td>
              <td><span className="badge badge-held">COMPILING</span></td>
              <td><span className="badge badge-held">COMPILING</span></td>
              <td><button className="btn-outline" disabled>Building...</button></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Provision Overlay Modal */}
      {showProvision && (
        <div className="provision-modal-overlay">
          <div className="provision-modal surface-panel">
            <h3>Provision New Company</h3>
            <div className="form-grid mt-4">
              <div className="input-col">
                <label>Company Legal Name</label>
                <input type="text" placeholder="e.g. Acme Chauffeurs Ltd" />
              </div>
              <div className="input-col">
                <label>Subdomain String</label>
                <input type="text" placeholder="e.g. acme" />
              </div>
              <div className="input-col">
                <label>Primary Brand Color (Hex)</label>
                <input type="text" placeholder="#000000" />
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-outline" onClick={() => setShowProvision(false)}>Cancel</button>
              <button className="btn-primary">Execute Build</button>
            </div>
          </div>
        </div>
      )}

      {/* Automation Ticker Interface */}
      <div className="automation-ticker">
        <div className="ticker-header">
          <span className="blinking-cursor">_</span> DEPLOYMENT ENGINE LOGS
        </div>
        <div className="ticker-window" ref={tickerRef}>
          {logs.map((log, i) => (
            <div key={i} className="log-line">{log}</div>
          ))}
        </div>
      </div>

    </div>
  );
};

export default DeploymentPipeline;
