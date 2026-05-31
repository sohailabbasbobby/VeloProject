import React, { useState } from 'react';
import './TenantTaxProfilePanel.css';

export const TenantTaxProfilePanel: React.FC = () => {
    const [isVatRegistered, setIsVatRegistered] = useState<boolean>(false);
    const [vatNumber, setVatNumber] = useState<string>('');
    const [isSaving, setIsSaving] = useState<boolean>(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const handleSave = () => {
        setIsSaving(true);
        setSaveStatus(null);
        
        // Simulating backend RLS synchronization
        setTimeout(() => {
            setIsSaving(false);
            setSaveStatus("TAX PROFILE SUCCESSFULLY SYNCHRONIZED.");
            setTimeout(() => setSaveStatus(null), 3000);
        }, 1500);
    };

    return (
        <div className="velo-tenant-panel">
            <div className="velo-tenant-panel-header">
                <h2>Tax & Corporate Registry Profile</h2>
                <p>Manage your corporate entity parameters and VAT liability status.</p>
            </div>

            <div className="velo-tenant-config-block">
                
                {/* VAT Toggle Section */}
                <div className="velo-toggle-group">
                    <div className="velo-toggle-text">
                        <h4>VAT Registered Status</h4>
                        <p>Enable this if your fleet is officially VAT registered with HMRC.</p>
                    </div>
                    <label className="velo-switch">
                        <input 
                            type="checkbox" 
                            checked={isVatRegistered} 
                            onChange={(e) => setIsVatRegistered(e.target.checked)}
                        />
                        <span className="velo-slider round"></span>
                    </label>
                </div>

                {/* VAT Number Input Section */}
                <div className={`velo-form-group ${!isVatRegistered ? 'velo-disabled-group' : ''}`}>
                    <label>VAT Registration Number</label>
                    <input 
                        type="text" 
                        className="velo-input-mask" 
                        placeholder="e.g. GB 123 4567 89" 
                        value={vatNumber}
                        onChange={(e) => setVatNumber(e.target.value)}
                        disabled={!isVatRegistered}
                    />
                    <small className="velo-input-hint">
                        Providing this number ensures Velo's network fee extractions are correctly documented on your commercial invoices.
                    </small>
                </div>

            </div>

            <div className="velo-tenant-panel-footer">
                {saveStatus && <span className="velo-tenant-status-text">{saveStatus}</span>}
                <button 
                    className="velo-tenant-action-btn" 
                    onClick={handleSave}
                    disabled={isSaving}
                >
                    {isSaving ? 'SYNCHRONIZING...' : 'SAVE REGISTRY SETTINGS'}
                </button>
            </div>
        </div>
    );
};
