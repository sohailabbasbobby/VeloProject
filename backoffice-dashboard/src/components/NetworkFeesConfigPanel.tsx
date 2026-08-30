import React, { useState } from 'react';
import './NetworkFeesConfigPanel.css';

export const NetworkFeesConfigPanel: React.FC = () => {
    const [statusText, setStatusText] = useState<string | null>(null);

    // State blocks mapping directly to backend FeeSettings
    const [creatorFeeMode, setCreatorFeeMode] = useState<'FLAT' | 'PERCENTAGE' | 'HYBRID'>('FLAT');
    const [creatorFlatValue, setCreatorFlatValue] = useState<string>('1.00');
    const [creatorPercentageValue, setCreatorPercentageValue] = useState<string>('0.00');

    const [fulfillerFeeMode, setFulfillerFeeMode] = useState<'FLAT' | 'PERCENTAGE' | 'HYBRID'>('FLAT');
    const [fulfillerFlatValue, setFulfillerFlatValue] = useState<string>('1.00');
    const [fulfillerPercentageValue, setFulfillerPercentageValue] = useState<string>('0.00');

    const handleSave = async () => {
        setStatusText("Saving configurations...");
        try {
            const payload = {
                creatorFeeMode,
                creatorFlatValue: parseFloat(creatorFlatValue),
                creatorPercentageValue: parseFloat(creatorPercentageValue),
                fulfillerFeeMode,
                fulfillerFlatValue: parseFloat(fulfillerFlatValue),
                fulfillerPercentageValue: parseFloat(fulfillerPercentageValue)
            };

            const response = await fetch('http://localhost:8000/api/network-clear/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': process.env.REACT_APP_ADMIN_KEY
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatusText("SYSTEM OVERRIDE SUCCESSFUL. NEW PARAMETERS ACTIVE.");
                setTimeout(() => setStatusText(null), 3000);
            } else {
                setStatusText("ERROR: FAILED TO PUSH OVERRIDE.");
            }
        } catch (error) {
            console.error(error);
            setStatusText("ERROR: NETWORK DISCONNECT.");
        }
    };

    return (
        <div className="velo-panel">
            <div className="velo-panel-header">
                <h2>Network Fees Configuration Workspace</h2>
                <p>Master Control Override for Global B2B Trading Mathematics.</p>
            </div>

            <div className="velo-split-view">
                {/* CREATOR CONFIGURATION BLOCK */}
                <div className="velo-config-block">
                    <h3>Job Creator Parameters</h3>
                    
                    <div className="velo-form-group">
                        <label>Calculation Mode</label>
                        <select 
                            className="velo-input" 
                            value={creatorFeeMode} 
                            onChange={(e) => setCreatorFeeMode(e.target.value as any)}
                        >
                            <option value="FLAT">Absolute Flat Fee</option>
                            <option value="PERCENTAGE">Gross Percentage Cut</option>
                            <option value="HYBRID">Hybrid (Flat + Percentage)</option>
                        </select>
                    </div>

                    <div className="velo-form-group">
                        <label>Flat Value Extraction (£)</label>
                        <input 
                            type="number" 
                            className="velo-input" 
                            value={creatorFlatValue} 
                            onChange={(e) => setCreatorFlatValue(e.target.value)}
                            disabled={creatorFeeMode === 'PERCENTAGE'}
                        />
                    </div>

                    <div className="velo-form-group">
                        <label>Percentage Extraction (%)</label>
                        <input 
                            type="number" 
                            className="velo-input" 
                            value={creatorPercentageValue} 
                            onChange={(e) => setCreatorPercentageValue(e.target.value)}
                            disabled={creatorFeeMode === 'FLAT'}
                        />
                    </div>
                </div>

                <div className="velo-divider"></div>

                {/* FULFILLER CONFIGURATION BLOCK */}
                <div className="velo-config-block">
                    <h3>Job Fulfiller Parameters</h3>
                    
                    <div className="velo-form-group">
                        <label>Calculation Mode</label>
                        <select 
                            className="velo-input" 
                            value={fulfillerFeeMode} 
                            onChange={(e) => setFulfillerFeeMode(e.target.value as any)}
                        >
                            <option value="FLAT">Absolute Flat Fee</option>
                            <option value="PERCENTAGE">Gross Percentage Cut</option>
                            <option value="HYBRID">Hybrid (Flat + Percentage)</option>
                        </select>
                    </div>

                    <div className="velo-form-group">
                        <label>Flat Value Extraction (£)</label>
                        <input 
                            type="number" 
                            className="velo-input" 
                            value={fulfillerFlatValue} 
                            onChange={(e) => setFulfillerFlatValue(e.target.value)}
                            disabled={fulfillerFeeMode === 'PERCENTAGE'}
                        />
                    </div>

                    <div className="velo-form-group">
                        <label>Percentage Extraction (%)</label>
                        <input 
                            type="number" 
                            className="velo-input" 
                            value={fulfillerPercentageValue} 
                            onChange={(e) => setFulfillerPercentageValue(e.target.value)}
                            disabled={fulfillerFeeMode === 'FLAT'}
                        />
                    </div>
                </div>
            </div>

            <div className="velo-panel-footer">
                {statusText && <span className="velo-status-text">{statusText}</span>}
                <button className="velo-action-btn" onClick={handleSave}>SAVE SYSTEM SETTINGS</button>
            </div>
        </div>
    );
};
