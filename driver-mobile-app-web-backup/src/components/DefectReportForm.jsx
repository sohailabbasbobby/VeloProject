import React, { useState } from 'react';
import './DefectReportForm.css';

const DefectReportForm = ({ onClose }) => {
    const [description, setDescription] = useState('');
    const [severity, setSeverity] = useState('LOW'); // LOW, MEDIUM, HIGH, CRITICAL
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [statusText, setStatusText] = useState(null);

    const handleSubmit = async () => {
        if (!description.trim()) {
            setStatusText("Description is required.");
            return;
        }

        setIsSubmitting(true);
        setStatusText("Transmitting to Tenant ERP...");

        try {
            const payload = {
                vehicleId: 'VEH-1111-2222', // Mocked active vehicle
                description,
                severity
            };

            const response = await fetch('http://localhost:8000/api/fleet/issues', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-tenant-id': 'TENANT-CORP-001',
                    'x-driver-id': 'DRV-100'
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatusText("DEFECT LOGGED. DISPATCH NOTIFIED.");
                setTimeout(() => onClose(), 2000);
            } else {
                setStatusText("ERROR: FAILED TO TRANSMIT.");
            }
        } catch (error) {
            console.error(error);
            setStatusText("ERROR: NETWORK TIMEOUT.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="defect-overlay">
            <div className="defect-modal">
                <div className="defect-header">
                    <h2 className="text-gold">Report Vehicle Issue</h2>
                    <p className="text-muted text-sm">Alert the fleet workshop of any mechanical or cosmetic defects.</p>
                </div>

                <div className="defect-content">
                    <div className="input-group">
                        <label>Defect Severity Level</label>
                        <div className="severity-toggles">
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map(level => (
                                <button 
                                    key={level}
                                    className={`severity-btn ${severity === level ? 'active ' + level.toLowerCase() : ''}`}
                                    onClick={() => setSeverity(level)}
                                >
                                    {level}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="input-group">
                        <label>Detailed Description</label>
                        <textarea 
                            className="defect-textarea" 
                            placeholder="Describe the issue clearly..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                        />
                    </div>
                </div>

                <div className="defect-footer">
                    {statusText && <span className="status-indicator">{statusText}</span>}
                    <div className="action-buttons">
                        <button className="btn-cancel" onClick={onClose} disabled={isSubmitting}>CANCEL</button>
                        <button className="btn-submit" onClick={handleSubmit} disabled={isSubmitting}>
                            {isSubmitting ? 'SENDING...' : 'SUBMIT REPORT'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DefectReportForm;
