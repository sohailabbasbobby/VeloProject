import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Paintbrush, Globe, Eye, UploadCloud, CheckCircle } from 'lucide-react';
import './SystemModules.css';
import { fetchWhiteLabel, updateWhiteLabel, uploadFileBytes, usePolling } from '../utils/api';

/**
 * BRAND IDENTITY & WHITE-LABELING WIZARD (§3) — per-tenant logo/color/domain
 * configuration that generates the ACTUAL white_label_configs record consumed by
 * the mobile apps via the backend API. No local-only state.
 */

const STEPS = ['APP IDENTITY', 'COLOR SYSTEM', 'DOMAIN & FIREBASE', 'REVIEW & PUBLISH'];

const WhiteLabelPortal = () => {
  const load = useCallback(() => fetchWhiteLabel(), []);
  const { data: config, refresh } = usePolling(load, 60000);

  const [step, setStep] = useState(0);
  const [appName, setAppName] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [splashUrl, setSplashUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#D4AF37');
  const [backgroundColor, setBackgroundColor] = useState('#0B0B0C');
  const [panelColor, setPanelColor] = useState('#1A1A1B');
  const [customDomain, setCustomDomain] = useState('');
  const [firebaseGoogleAppId, setFirebaseGoogleAppId] = useState('');
  const [firebaseIosBundle, setFirebaseIosBundle] = useState('');
  const [firebaseAndroidPackage, setFirebaseAndroidPackage] = useState('');
  const [published, setPublished] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const logoInputRef = useRef(null);

  useEffect(() => {
    if (config) {
      setAppName(config.app_name || '');
      setLogoUrl(config.logo_url || '');
      setSplashUrl(config.splash_url || '');
      setPrimaryColor(config.primary_color || '#D4AF37');
      setBackgroundColor(config.background_color || '#0B0B0C');
      setPanelColor(config.panel_color || '#1A1A1B');
      setCustomDomain(config.custom_domain || '');
      setFirebaseGoogleAppId(config.firebase_google_app_id || '');
      setFirebaseIosBundle(config.firebase_ios_bundle || '');
      setFirebaseAndroidPackage(config.firebase_android_package || '');
      setPublished(Boolean(config.published));
    }
  }, [config]);

  const flash = (m) => { setMessage(m); setTimeout(() => setMessage(null), 4000); };

  const handleLogoFile = (file) => {
    if (!file.type.startsWith('image/')) { flash('Logo must be an image.'); return; }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const base64 = String(reader.result).split(',')[1];
        const up = await uploadFileBytes(base64, file.type, 'branding');
        setLogoUrl(up.url);
        flash('Logo uploaded to persistent storage.');
      } catch (err) {
        flash(`Upload failed: ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const save = async (publish = false) => {
    setSaving(true);
    try {
      await updateWhiteLabel({
        appName, logoUrl: logoUrl || undefined, splashUrl: splashUrl || undefined,
        primaryColor, backgroundColor, panelColor,
        customDomain: customDomain || undefined,
        firebaseGoogleAppId: firebaseGoogleAppId || undefined,
        firebaseIosBundle: firebaseIosBundle || undefined,
        firebaseAndroidPackage: firebaseAndroidPackage || undefined,
        ...(publish ? { published: true } : {}),
      });
      await refresh();
      flash(publish ? 'White-label config published — mobile apps will consume this config.' : 'Brand configuration saved.');
    } catch (err) {
      flash(`Save failed: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="system-module">
      <div className="sm-header">
        <div>
          <h2>BRAND IDENTITY & WHITE-LABELING</h2>
          <span className="sm-subtitle">Generates the live white-label config consumed by your branded mobile apps</span>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          {published && <span className="fv-status ok"><CheckCircle size={11} /> PUBLISHED</span>}
        </div>
      </div>

      <div className="sm-tabs">
        {STEPS.map((s, i) => (
          <button key={s} className={`sm-tab ${step === i ? 'active' : ''}`} onClick={() => setStep(i)}>
            {i + 1}. {s}
          </button>
        ))}
      </div>

      <div className="sm-section" style={{ display: 'grid', gap: 12, maxWidth: 640 }}>
        {step === 0 && (
          <>
            <div>
              <label style={lbl}>APP NAME</label>
              <input className="ob-input" value={appName} onChange={(e) => setAppName(e.target.value)} placeholder="Velo Executive" />
            </div>
            <div>
              <label style={lbl}>LOGO</label>
              <div
                className="sm-staff-chip"
                style={{ cursor: 'pointer', padding: 16, justifyContent: 'center' }}
                onClick={() => logoInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); if (e.dataTransfer.files[0]) handleLogoFile(e.dataTransfer.files[0]); }}
              >
                {logoUrl ? <img src={logoUrl} alt="logo" style={{ maxHeight: 42 }} /> : <span><UploadCloud size={14} /> Drop or click to upload logo</span>}
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={(e) => e.target.files[0] && handleLogoFile(e.target.files[0])} />
            </div>
          </>
        )}

        {step === 1 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
            <div>
              <label style={lbl}>PRIMARY / GOLD</label>
              <input type="color" style={colorInput} value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>BACKGROUND</label>
              <input type="color" style={colorInput} value={backgroundColor} onChange={(e) => setBackgroundColor(e.target.value)} />
            </div>
            <div>
              <label style={lbl}>PANEL</label>
              <input type="color" style={colorInput} value={panelColor} onChange={(e) => setPanelColor(e.target.value)} />
            </div>
          </div>
        )}

        {step === 2 && (
          <>
            <div>
              <label style={lbl}>CUSTOM DOMAIN</label>
              <input className="ob-input" value={customDomain} onChange={(e) => setCustomDomain(e.target.value)} placeholder="bookings.yourbrand.co.uk" />
            </div>
            <div>
              <label style={lbl}>FIREBASE GOOGLE APP ID</label>
              <input className="ob-input" value={firebaseGoogleAppId} onChange={(e) => setFirebaseGoogleAppId(e.target.value)} placeholder="1:123:android:abc" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={lbl}>IOS BUNDLE</label>
                <input className="ob-input" value={firebaseIosBundle} onChange={(e) => setFirebaseIosBundle(e.target.value)} placeholder="co.yourbrand.executive" />
              </div>
              <div>
                <label style={lbl}>ANDROID PACKAGE</label>
                <input className="ob-input" value={firebaseAndroidPackage} onChange={(e) => setFirebaseAndroidPackage(e.target.value)} placeholder="co.yourbrand.executive" />
              </div>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <div style={{
              backgroundColor: backgroundColor, border: `1px solid ${panelColor}`, borderRadius: 10,
              padding: 20, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              {logoUrl && <img src={logoUrl} alt="logo" style={{ maxHeight: 40 }} />}
              <span style={{ color: primaryColor, fontWeight: 700, letterSpacing: '0.12em' }}>{(appName || 'YOUR BRAND').toUpperCase()}</span>
              <span style={{ marginLeft: 'auto', color: primaryColor, fontSize: 11, border: `1px solid ${primaryColor}`, borderRadius: 999, padding: '4px 12px' }}>BOOK NOW</span>
            </div>
            <div style={{ color: '#888', fontSize: 12 }}>
              Publishing writes this configuration to the platform database; the mobile apps fetch it from
              <code style={{ color: primaryColor }}> /api/system/whitelabel</code> at startup.
            </div>
          </>
        )}

        {message && <div style={{ color: 'var(--color-gold)', fontSize: 12 }}>{message}</div>}

        <div style={{ display: 'flex', gap: 8 }}>
          {step > 0 && <button className="ob-btn-outline" onClick={() => setStep(step - 1)}>BACK</button>}
          {step < STEPS.length - 1 && <button className="ob-btn-complete" onClick={() => setStep(step + 1)}>NEXT</button>}
          <button className="ob-btn-outline" onClick={() => save(false)} disabled={saving}>{saving ? 'SAVING…' : 'SAVE DRAFT'}</button>
          <button className="ob-btn-complete" onClick={() => save(true)} disabled={saving}>
            <Globe size={13} /> PUBLISH CONFIG
          </button>
        </div>
      </div>

      <div className="security-footer">Verified by Velo AI Security Protocol</div>
    </div>
  );
};

const lbl = { fontSize: 10, color: '#888', letterSpacing: '0.08em', display: 'block', marginBottom: 4 };
const colorInput = { width: '100%', height: 38, backgroundColor: '#0B0B0C', border: '1px solid #2a2a2c', borderRadius: 6, cursor: 'pointer' };

export default WhiteLabelPortal;
