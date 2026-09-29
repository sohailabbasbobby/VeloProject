import React, { useState, useCallback, useEffect } from 'react';
import { Save } from 'lucide-react';
import { fetchSettings, updateSetting, usePolling } from '../utils/api';

/**
 * GLOBAL SETTINGS (§4) — the persisted platform_settings table. Everything here is
 * editable by the platform owner and read live by the engines (no in-memory state).
 */
const KEYS = [
    { key: 'fees', title: 'FEE CONFIGURATION', note: 'VAT applies ONLY to the platform fee charged to drivers. Retail fares never carry VAT. There is no flat fee schedule — every trip price is custom-entered.' },
    { key: 'network_floors', title: 'NETWORK FLOOR PRICING (per vehicle tier)', note: 'base + per-mile + per-hour × minimum-hours. Pool submissions below the floor are blocked server-side.' },
    { key: 'negotiation', title: 'NEGOTIATION TIMERS', note: 'Counter-offer window before auto-rollback to the open pool.' },
    { key: 'dispatch', title: 'DISPATCH WINDOWS', note: 'Own-fleet-first acceptance timeouts and nearby-driver radius.' },
    { key: 'payroll', title: 'PAYROLL BASELINE', note: 'Pension / student-loan / simplified net-pay deduction rates.' },
    { key: 'subscription', title: 'SUBSCRIPTION TIER', note: 'Flat weekly fee with 0% commission while ACTIVE.' },
];

const GlobalSettings = () => {
    const load = useCallback(() => fetchSettings(), []);
    const { data: settings, refresh } = usePolling(load, 60000);
    const [drafts, setDrafts] = useState({});
    const [savingKey, setSavingKey] = useState(null);
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (settings) {
            setDrafts((prev) => {
                const next = { ...prev };
                for (const [k, v] of Object.entries(settings)) {
                    if (!(k in next)) next[k] = JSON.stringify(v.value, null, 2);
                }
                return next;
            });
        }
    }, [settings]);

    const save = async (key) => {
        setSavingKey(key);
        try {
            const value = JSON.parse(drafts[key]);
            await updateSetting(key, value);
            setMessage(`${key} saved — engines read this live from the database.`);
            refresh();
        } catch (err) {
            setMessage(err.message.includes('JSON') ? `Invalid JSON for ${key}.` : `Save failed: ${err.message}`);
        } finally {
            setSavingKey(null);
            setTimeout(() => setMessage(null), 4000);
        }
    };

    return (
        <div style={{ padding: 24 }}>
            <div style={{ marginBottom: 18 }}>
                <h2 style={{ margin: 0, color: '#fff', letterSpacing: '0.1em' }}>GLOBAL SETTINGS</h2>
                <span style={{ fontSize: 11, color: '#888' }}>
                    Persisted in the platform_settings table — engines, pools and payroll read these live. Never hardcoded.
                </span>
            </div>

            {message && <div style={{ color: '#D4AF37', fontSize: 12, marginBottom: 10 }}>{message}</div>}

            {KEYS.map(({ key, title, note }) => (
                <div key={key} style={{ marginBottom: 16, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(212,175,55,0.12)', borderRadius: 8, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        <h3 style={{ margin: 0, color: '#D4AF37', fontSize: 12, letterSpacing: '0.12em' }}>{title}</h3>
                        <button
                            className="ob-btn-complete"
                            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6 }}
                            onClick={() => save(key)}
                            disabled={savingKey === key}
                        >
                            <Save size={12} /> {savingKey === key ? 'SAVING…' : 'SAVE'}
                        </button>
                    </div>
                    <div style={{ fontSize: 11, color: '#888', margin: '6px 0 10px' }}>{note}</div>
                    <textarea
                        className="ob-input"
                        style={{ width: '100%', minHeight: 120, fontFamily: 'monospace', fontSize: 12 }}
                        value={drafts[key] || ''}
                        onChange={(e) => setDrafts((d) => ({ ...d, [key]: e.target.value }))}
                        spellCheck={false}
                    />
                    {settings?.[key]?.updated_at && (
                        <div style={{ fontSize: 10, color: '#666', marginTop: 4 }}>
                            Last updated {new Date(settings[key].updated_at).toLocaleString()} by {settings[key].updated_by || 'system'}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default GlobalSettings;
