import React, { useState, useEffect } from 'react';
import './FleetVault.css';
import VehicleFinancialPanel from './VehicleFinancialPanel';
import ShiftSchedulerPanel from './ShiftSchedulerPanel';

const FleetVault = () => {
    const [vehicles, setVehicles] = useState([]);
    const [issues, setIssues] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusMessage, setStatusMessage] = useState(null);
    const [analyzingVehicleId, setAnalyzingVehicleId] = useState(null);
    const [isScheduling, setIsScheduling] = useState(false);

    const fetchFleetData = async () => {
        try {
            const response = await fetch('http://localhost:8000/api/fleet/vehicles', {
                headers: {
                    'x-tenant-id': 'TENANT-CORP-001'
                }
            });
            const data = await response.json();
            if (response.ok) {
                setVehicles(data.vehicles);
                setIssues(data.openIssues);
            }
        } catch (error) {
            console.error("Failed to fetch fleet data", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFleetData();
    }, []);

    const handleResolve = async (issueId) => {
        try {
            const response = await fetch(`http://localhost:8000/api/fleet/issues/${issueId}/resolve`, {
                method: 'POST',
                headers: {
                    'x-tenant-id': 'TENANT-CORP-001'
                }
            });

            if (response.ok) {
                setStatusMessage(`Issue #${issueId} marked as FIXED.`);
                setTimeout(() => setStatusMessage(null), 3000);
                fetchFleetData(); // Refresh lists
            }
        } catch (error) {
            console.error("Failed to resolve issue", error);
        }
    };

    const isExpiringSoon = (dateStr) => {
        const expiry = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(expiry - now);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays < 30; // Flag if expiring within 30 days
    };

    if (isLoading) return <div className="p-xl text-gold">Loading Fleet Telemetry...</div>;

    if (analyzingVehicleId) {
        return <VehicleFinancialPanel vehicleId={analyzingVehicleId} onBack={() => setAnalyzingVehicleId(null)} />;
    }

    if (isScheduling) {
        return <ShiftSchedulerPanel onBack={() => setIsScheduling(false)} />;
    }

    return (
        <div className="fleet-vault-container">
            <header className="vault-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h1 className="text-gold">Fleet & Maintenance Vault</h1>
                    <p className="text-muted">Manage active assets, monitor compliance expirations, and resolve live defect reports.</p>
                    {statusMessage && <div className="vault-status-alert">{statusMessage}</div>}
                </div>
                <button 
                    style={{ backgroundColor: '#D4AF37', color: '#000', padding: '12px 24px', fontWeight: 'bold', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                    onClick={() => setIsScheduling(true)}
                >
                    📅 MANAGE SHIFT SCHEDULER
                </button>
            </header>

            <div className="vault-grid">
                
                {/* ASSETS PANEL */}
                <div className="vault-panel">
                    <h2 className="panel-title">Asset Register</h2>
                    <div className="table-container">
                        <table className="vault-table">
                            <thead>
                                <tr>
                                    <th>Plate Number</th>
                                    <th>Odometer (Miles)</th>
                                    <th>PHV Expiry</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {vehicles.map(v => (
                                    <tr key={v.id}>
                                        <td className="font-bold text-white">{v.plate_number}</td>
                                        <td className="font-mono text-gold">{v.current_odometer.toLocaleString()}</td>
                                        <td className={isExpiringSoon(v.phv_expiry) ? 'text-danger font-bold' : 'text-muted'}>
                                            {v.phv_expiry} {isExpiringSoon(v.phv_expiry) && '⚠️'}
                                        </td>
                                        <td>
                                            <button 
                                                className="btn-resolve" 
                                                style={{padding: '6px 12px'}}
                                                onClick={() => setAnalyzingVehicleId(v.id)}
                                            >
                                                ANALYZE FINANCES
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {vehicles.length === 0 && <tr><td colSpan="4" className="text-center text-muted">No vehicles registered.</td></tr>}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* DEFECTS PANEL */}
                <div className="vault-panel">
                    <h2 className="panel-title text-danger">Open Defects & Maintenance Logs</h2>
                    <div className="issues-list">
                        {issues.map(issue => (
                            <div key={issue.id} className={`issue-card severity-${issue.severity.toLowerCase()}`}>
                                <div className="issue-header">
                                    <span className="issue-badge">{issue.severity}</span>
                                    <span className="issue-time">{new Date(issue.reported_at).toLocaleString()}</span>
                                </div>
                                <div className="issue-body">
                                    <p><strong>Vehicle:</strong> {issue.vehicle_id}</p>
                                    <p><strong>Driver:</strong> {issue.driver_id}</p>
                                    <p className="issue-desc">{issue.description}</p>
                                </div>
                                <div className="issue-footer">
                                    <button 
                                        className="btn-resolve"
                                        onClick={() => handleResolve(issue.id)}
                                    >
                                        MARK COMPONENT FIXED / RESOLVED
                                    </button>
                                </div>
                            </div>
                        ))}
                        {issues.length === 0 && (
                            <div className="empty-state text-success text-center p-xl">
                                <h3>✅ All Clear</h3>
                                <p>No active vehicle defects reported.</p>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FleetVault;
