import React, { useState, useRef, useEffect } from 'react';
import { Paintbrush, Globe, Eye, UploadCloud, X, Info, CheckCircle, ChevronRight, ChevronLeft } from 'lucide-react';
import { MOCK_WHITELABEL } from '../data/mockDatabase';
import './SystemModules.css';

const UploaderZone = ({ label, hint, reqWidth, reqHeight, tooltip, previewUrl, onUpload, onClear }) => {
  const fileInputRef = useRef(null);

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) handleFile(file);
  };

  const handleFile = (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Invalid file type. Please upload an image.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert('File too large. Maximum size is 5MB.');
      return;
    }

    if (reqWidth && reqHeight) {
      const img = new Image();
      const objUrl = URL.createObjectURL(file);
      img.onload = () => {
        if (img.naturalWidth !== reqWidth || img.naturalHeight !== reqHeight) {
          alert(`Dimensions mismatch. Required: ${reqWidth}x${reqHeight}px. Your image is ${img.naturalWidth}x${img.naturalHeight}px.`);
          URL.revokeObjectURL(objUrl);
          return;
        }
        onUpload(objUrl, file);
      };
      img.onerror = () => {
        alert('Invalid image file.');
        URL.revokeObjectURL(objUrl);
      };
      img.src = objUrl;
    } else {
      const mockUrl = URL.createObjectURL(file);
      onUpload(mockUrl, file);
    }
  };

  return (
    <div className="wl-field-group">
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <label className="wl-label" style={{ marginBottom: 0 }}>{label}</label>
        {tooltip && (
          <div title={tooltip} style={{ cursor: 'help', color: 'var(--color-gold)' }}>
            <Info size={14} />
          </div>
        )}
      </div>
      {previewUrl ? (
        <div style={{ position: 'relative', width: '100%', height: '140px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--color-gold)', background: 'rgba(212, 175, 55, 0.05)' }}>
          <img src={previewUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'contain', padding: '8px' }} />
          <button 
            onClick={onClear}
            style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(0,0,0,0.7)', border: 'none', borderRadius: '50%', color: '#fff', cursor: 'pointer', padding: '4px' }}>
            <X size={16} />
          </button>
        </div>
      ) : (
        <div 
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{ width: '100%', height: '140px', border: '2px dashed rgba(212, 175, 55, 0.3)', borderRadius: '8px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', background: 'rgba(212, 175, 55, 0.05)', color: '#888', transition: 'all 0.2s ease' }}
          className="wl-uploader-hover"
        >
          <UploadCloud size={24} color="var(--color-gold)" style={{ marginBottom: '8px' }} />
          <span style={{ fontSize: '11px', fontWeight: 'bold', color: '#fff', marginBottom: '4px' }}>REQUIRED: {reqWidth}x{reqHeight}px {hint}</span>
          <span style={{ fontSize: '11px' }}>Drag & Drop or Click to Upload</span>
          <input type="file" ref={fileInputRef} style={{ display: 'none' }} accept="image/*" onChange={handleChange} />
        </div>
      )}
    </div>
  );
};

const WhiteLabelPortal = () => {
  const [activeStep, setActiveStep] = useState(() => {
    const saved = localStorage.getItem('wl_active_step');
    return saved ? parseInt(saved) : 1;
  });
  useEffect(() => {
    localStorage.setItem('wl_active_step', activeStep);
  }, [activeStep]);

  const [appIcon, setAppIcon] = useState(null);
  const [favicon, setFavicon] = useState(null);
  const [splash, setSplash] = useState(null);
  const [mainLogo, setMainLogo] = useState(null);
  const [corpHeader, setCorpHeader] = useState(null);
  const [heroImg, setHeroImg] = useState(null);

  const steps = [
    { id: 1, title: 'App Identity', subtitle: 'Icon & Favicon' },
    { id: 2, title: 'Launch Assets', subtitle: 'Splash & Platform Logo' },
    { id: 3, title: 'Corporate Branding', subtitle: 'Header & Hero Background' },
    { id: 4, title: 'Business Settings', subtitle: 'Name, Domain & Theme' }
  ];

  return (
    <div className="system-module-container" style={{ height: '100vh', overflowY: 'auto' }}>
      <div className="system-header" style={{ marginBottom: '24px' }}>
        <div>
          <h2 className="system-title">BRAND IDENTITY & WHITE LABELING</h2>
          <div className="system-subtitle">Sequential Configuration Wizard</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Paintbrush size={24} color="var(--color-gold)" />
        </div>
      </div>

      <div style={{ display: 'flex', gap: '32px', flex: 1, minHeight: '500px' }}>
        
        {/* Navigation Sidebar */}
        <nav style={{ width: '250px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {steps.map((step) => {
            const isActive = activeStep === step.id;
            const isPast = step.id < activeStep;
            return (
              <div 
                key={step.id}
                onClick={() => setActiveStep(step.id)}
                style={{
                  padding: '16px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  background: isActive ? 'rgba(212, 175, 55, 0.1)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isActive ? 'var(--color-gold)' : 'rgba(255,255,255,0.05)'}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive || isPast ? 'var(--color-gold)' : 'rgba(255,255,255,0.1)',
                  color: isActive || isPast ? '#000' : '#888',
                  fontSize: '14px', fontWeight: 'bold'
                }}>
                  {isPast ? <CheckCircle size={14} /> : step.id}
                </div>
                <div>
                  <div style={{ color: isActive ? '#fff' : '#aaa', fontWeight: isActive ? 'bold' : 'normal', fontSize: '14px' }}>{step.title}</div>
                  <div style={{ color: '#888', fontSize: '11px' }}>{step.subtitle}</div>
                </div>
              </div>
            );
          })}
        </nav>

        {/* Content Area */}
        <div style={{ flex: 1, background: 'var(--color-panel-bg, #1A1A1A)', borderRadius: '8px', border: '1px solid rgba(212, 175, 55, 0.2)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '32px', flex: 1 }}>
            
            {activeStep === 1 && (
              <div className="wizard-step-content fade-in">
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>App Identity</h3>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '32px' }}>These assets define your identity on mobile devices and browser tabs.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <UploaderZone 
                    label="App Icon" hint="(PNG)" reqWidth={1024} reqHeight={1024}
                    tooltip="This icon appears on home screens and dock bars."
                    previewUrl={appIcon} onUpload={(url) => setAppIcon(url)} onClear={() => setAppIcon(null)}
                  />
                  <UploaderZone 
                    label="Custom Favicon" hint="(ICO/PNG)" reqWidth={48} reqHeight={48}
                    tooltip="Appears in browser tabs and bookmark bars."
                    previewUrl={favicon} onUpload={(url) => setFavicon(url)} onClear={() => setFavicon(null)}
                  />
                </div>
              </div>
            )}

            {activeStep === 2 && (
              <div className="wizard-step-content fade-in">
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>Launch Assets</h3>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '32px' }}>This is what users see when the application initiates.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <UploaderZone 
                    label="App Splash Page" hint="(PNG)" reqWidth={1242} reqHeight={2688}
                    tooltip="The loading screen shown while the app initiates."
                    previewUrl={splash} onUpload={(url) => setSplash(url)} onClear={() => setSplash(null)}
                  />
                  <UploaderZone 
                    label="Main Platform Logo" hint="(SVG)" reqWidth={500} reqHeight={150}
                    tooltip="The primary logo displayed in the main navigation header."
                    previewUrl={mainLogo} onUpload={(url) => setMainLogo(url)} onClear={() => setMainLogo(null)}
                  />
                </div>
              </div>
            )}

            {activeStep === 3 && (
              <div className="wizard-step-content fade-in">
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>Corporate Branding</h3>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '32px' }}>These assets define the professional look of your corporate client portals.</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <UploaderZone 
                    label="Corporate Dashboard Header" hint="(SVG)" reqWidth={500} reqHeight={150}
                    tooltip="The logo displayed specifically inside corporate client portals."
                    previewUrl={corpHeader} onUpload={(url) => setCorpHeader(url)} onClear={() => setCorpHeader(null)}
                  />
                  <UploaderZone 
                    label="Dashboard Hero Image" hint="(PNG)" reqWidth={1920} reqHeight={1080}
                    tooltip="The background hero image for the corporate login and dashboard."
                    previewUrl={heroImg} onUpload={(url) => setHeroImg(url)} onClear={() => setHeroImg(null)}
                  />
                </div>
              </div>
            )}

            {activeStep === 4 && (
              <div className="wizard-step-content fade-in">
                <h3 style={{ color: '#fff', fontSize: '20px', marginBottom: '8px' }}>Business Settings</h3>
                <p style={{ color: '#888', fontSize: '13px', marginBottom: '32px' }}>Finalize your company details and core color themes.</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="wl-field-group">
                    <label className="wl-label">Company Name</label>
                    <input type="text" className="wl-input" defaultValue={MOCK_WHITELABEL.companyName} />
                  </div>
                  <div className="wl-field-group">
                    <label className="wl-label">Custom Domain</label>
                    <div style={{ position: 'relative' }}>
                      <Globe size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                      <input type="text" className="wl-input" defaultValue={MOCK_WHITELABEL.domain} style={{ paddingLeft: '36px', width: '100%' }} />
                    </div>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div className="wl-field-group">
                      <label className="wl-label">Primary Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div className="wl-color-swatch" style={{ background: MOCK_WHITELABEL.primaryColor, width: '32px', height: '32px' }}></div>
                        <input type="text" className="wl-input" defaultValue={MOCK_WHITELABEL.primaryColor} style={{ width: '100%', padding: '8px' }} />
                      </div>
                    </div>
                    <div className="wl-field-group">
                      <label className="wl-label">Secondary Color</label>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <div className="wl-color-swatch" style={{ background: '#070708', width: '32px', height: '32px' }}></div>
                        <input type="text" className="wl-input" defaultValue="#070708" style={{ width: '100%', padding: '8px' }} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Wizard Navigation Footer */}
          <div style={{ padding: '24px 32px', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0,0,0,0.2)' }}>
            <button 
              className="btn-outline" 
              onClick={() => setActiveStep(prev => Math.max(1, prev - 1))}
              disabled={activeStep === 1}
              style={{ display: 'flex', alignItems: 'center', gap: '8px', opacity: activeStep === 1 ? 0.3 : 1, cursor: activeStep === 1 ? 'not-allowed' : 'pointer' }}
            >
              <ChevronLeft size={16} /> Previous
            </button>
            <div style={{ fontSize: '12px', color: '#888' }}>Step {activeStep} of 4</div>
            <button 
              className="btn-primary" 
              onClick={() => setActiveStep(prev => Math.min(4, prev + 1))}
              style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              {activeStep === 4 ? 'Save Configuration' : 'Next Step'} {activeStep !== 4 && <ChevronRight size={16} />}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default WhiteLabelPortal;
