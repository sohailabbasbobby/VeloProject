import React, { useState } from 'react';
import './SystemEnginePanel.css';

export const SystemEnginePanel = () => {
    const [statusText, setStatusText] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Operational Physics State
    const [timeoutMins, setTimeoutMins] = useState('10');
    const [radiusMeters, setRadiusMeters] = useState('5000');
    const [baseFarePence, setBaseFarePence] = useState('500');
    const [perMilePence, setPerMilePence] = useState('250');
    const [perMinutePence, setPerMinutePence] = useState('50');

    const handleSave = async () => {
        setIsSaving(true);
        setStatusText("Saving engine parameters...");
        
        try {
            const payload = {
                b2bNegotiationTimeoutMins: parseInt(timeoutMins, 10),
                nearbyDriverRadiusMeters: parseInt(radiusMeters, 10),
                marketplaceBaseFarePence: parseInt(baseFarePence, 10),
                marketplacePerMilePence: parseInt(perMilePence, 10),
                marketplacePerMinutePence: parseInt(perMinutePence, 10)
            };

            const response = await fetch('http://localhost:8000/api/system/config', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-admin-key': process.env.REACT_APP_ADMIN_KEY
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                setStatusText("ENGINE OVERRIDE SUCCESSFUL. PHYSICS UPDATED.");
                setTimeout(() => setStatusText(null), 4000);
            } else {
                setStatusText("ERROR: FAILED TO PUSH OVERRIDE.");
            }
        } catch (error) {
            console.error(error);
            setStatusText("ERROR: NETWORK DISCONNECT.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="velo-engine-panel">
            <div className="velo-engine-header">
                <h2>System Engine Configuration</h2>
                <p>Master Control Override for Global Network Physics and Operational Constraints.</p>
            </div>

            <div className="velo-engine-content">
                
                <div className="velo-engine-block">
                    <div className="velo-engine-info">
                        <h3>B2B Negotiation Lock Timeout</h3>
                        <p>The duration (in minutes) a job remains masked from the global board while the Originator reviews a counter-offer. If the timer expires, the job forcefully reverts to the open board.</p>
                    </div>
                    <div className="velo-engine-input-wrapper">
                        <input 
                            type="number" 
                            className="velo-engine-input" 
                            value={timeoutMins}
                            onChange={(e) => setTimeoutMins(e.target.value)}
                        />
                        <span className="velo-input-suffix">Minutes</span>
                    </div>
                </div>

                <div className="velo-divider-horizontal"></div>

                <div className="velo-engine-block">
                    <div className="velo-engine-info">
                        <h3>Radar Radial Scan Boundary</h3>
                        <p>The maximum geospatial distance (in meters) the PostGIS algorithm will scan outward from a pickup coordinate to locate online, on-duty chauffeurs.</p>
                    </div>
                    <div className="velo-engine-input-wrapper">
                        <input 
                            type="number" 
                            className="velo-engine-input" 
                            value={radiusMeters}
                            onChange={(e) => setRadiusMeters(e.target.value)}
                        />
                        <span className="velo-input-suffix">Meters</span>
                    </div>
                </div>

                <div className="velo-divider-horizontal"></div>

                <div className="velo-engine-block">
                    <div className="velo-engine-info">
                        <h3>Marketplace Baseline Fare</h3>
                        <p>The absolute minimum flag-drop value (in pence) charged instantly upon job acceptance.</p>
                    </div>
                    <div className="velo-engine-input-wrapper">
                        <input 
                            type="number" 
                            className="velo-engine-input" 
                            value={baseFarePence}
                            onChange={(e) => setBaseFarePence(e.target.value)}
                        />
                        <span className="velo-input-suffix">Pence</span>
                    </div>
                </div>

                <div className="velo-divider-horizontal"></div>

                <div className="velo-engine-block">
                    <div className="velo-engine-info">
                        <h3>Marketplace Per-Mile Floor</h3>
                        <p>The base cost per distance unit (in pence per mile) allowed for a wholesale job submission.</p>
                    </div>
                    <div className="velo-engine-input-wrapper">
                        <input 
                            type="number" 
                            className="velo-engine-input" 
                            value={perMilePence}
                            onChange={(e) => setPerMilePence(e.target.value)}
                        />
                        <span className="velo-input-suffix">Pence / Mi</span>
                    </div>
                </div>

                <div className="velo-divider-horizontal"></div>

                <div className="velo-engine-block">
                    <div className="velo-engine-info">
                        <h3>Marketplace Per-Minute Floor</h3>
                        <p>The base cost per time unit (in pence per minute) accounting for congestion limits.</p>
                    </div>
                    <div className="velo-engine-input-wrapper">
                        <input 
                            type="number" 
                            className="velo-engine-input" 
                            value={perMinutePence}
                            onChange={(e) => setPerMinutePence(e.target.value)}
                        />
                        <span className="velo-input-suffix">Pence / Min</span>
                    </div>
                </div>

            </div>

            <div className="velo-engine-footer">
                {statusText && <span className="velo-engine-status-text">{statusText}</span>}
                <button 
                    className="velo-engine-action-btn" 
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'UPDATING...' : 'SAVE ENGINE SETTINGS'}
                </button>
            </div>
        </div>
    );
};
