import React from 'react';
import { Paintbrush, Globe, Eye } from 'lucide-react';
import { MOCK_WHITELABEL } from '../data/mockDatabase';
import './SystemModules.css';

const WhiteLabelPortal = () => {
  return (
    <div className="system-module-container">
      <div className="system-header">
        <div>
          <h2 className="system-title">BRAND IDENTITY & WHITE LABELING</h2>
          <div className="system-subtitle">Client Portal Customization Engine</div>
        </div>
        <Paintbrush size={24} color="var(--color-gold)" />
      </div>

      <div className="wl-config-panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '20px' }}>
          <div style={{ width: '150px', height: '150px', overflow: 'hidden', borderRadius: '50%', border: '4px solid var(--color-gold)' }}>
            {(() => {
              const imgUrl = MOCK_WHITELABEL.logoUrl;
              return (
                <img 
                  src={imgUrl} 
                  srcSet={`${imgUrl} 1x, ${imgUrl} 2x`}
                  loading="eager"
                  onError={(e) => {
                    console.error('Image failed to load:', e.target.src);
                    e.target.src = 'https://images.unsplash.com/photo-1560179707-f14e90ef3623?w=400&q=80';
                  }}
                  alt="Corporate Logo" 
                  style={{width: '100%', height: '100%', objectFit: 'cover'}} 
                />
              );
            })()}
          </div>
        </div>

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="wl-field-group">
            <label className="wl-label">Primary Color</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="wl-color-swatch" style={{ background: MOCK_WHITELABEL.primaryColor }}></div>
              <input type="text" className="wl-input" defaultValue={MOCK_WHITELABEL.primaryColor} style={{ width: '100%' }} />
            </div>
          </div>
          <div className="wl-field-group">
            <label className="wl-label">Secondary Color</label>
            <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <div className="wl-color-swatch" style={{ background: MOCK_WHITELABEL.secondaryColor }}></div>
              <input type="text" className="wl-input" defaultValue={MOCK_WHITELABEL.secondaryColor} style={{ width: '100%' }} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '16px', marginTop: '20px' }}>
          <button className="btn-primary" style={{ flex: 1 }}>Save Changes</button>
          <button className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><Eye size={16} /> Preview Portal</button>
        </div>
      </div>

      <div className="security-footer" style={{ marginTop: 'auto' }}>Verified by Velo AI Security Protocol</div>
    </div>
  );
};

export default WhiteLabelPortal;
