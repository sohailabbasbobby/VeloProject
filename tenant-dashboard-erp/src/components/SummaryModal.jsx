import React from 'react';
import { X, Activity, FileText, Settings, Key, FileCheck, CircleDollarSign } from 'lucide-react';
import './UniversalModal.css';

const SummaryModal = ({ isOpen, onClose, data }) => {
  if (!isOpen || !data) return null;

  const { title, subtitle, status, primaryMetric, icon, fields = [], history = [] } = data;

  const renderIcon = () => {
    switch(icon) {
      case 'activity': return <Activity size={16} />;
      case 'file': return <FileText size={16} />;
      case 'settings': return <Settings size={16} />;
      case 'key': return <Key size={16} />;
      case 'financial': return <CircleDollarSign size={16} />;
      default: return <FileCheck size={16} />;
    }
  };

  const statusClass = status === 'Completed' || status === 'Resolved' || status === 'Paid' ? 'u-modal-badge-valid' : 'u-modal-badge-invalid';

  return (
    <div className="u-modal-overlay" onClick={onClose} style={{ zIndex: 9999 }}>
      <div className="u-modal-container" onClick={e => e.stopPropagation()} style={{ width: '900px', height: '750px', display: 'flex', flexDirection: 'column' }}>
        
        {/* Header */}
        <div className="u-modal-header" style={{ flexShrink: 0 }}>
          <div className="u-modal-title-group">
            <div className="u-modal-icon-container">{renderIcon()}</div>
            <div>
              <h2 className="u-modal-title">{title || 'Summary Detail'}</h2>
              <span className="u-modal-subtitle">{subtitle || 'View full breakdown'}</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            {status && <span className={statusClass}>{status}</span>}
            <button className="u-modal-close" onClick={onClose}><X size={20} /></button>
          </div>
        </div>

        {/* Body */}
        <div className="u-modal-body" style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          
          <div className="u-metric-row" style={{ marginBottom: '24px' }}>
             {primaryMetric && (
               <div className="cc-pulse-card active" style={{ flex: 'none', minWidth: '200px' }}>
                  <div className="cc-pulse-percent">{primaryMetric.value}</div>
                  <div className="cc-pulse-label">{primaryMetric.label}</div>
               </div>
             )}
          </div>

          <div className="u-modal-section">
             <div className="u-modal-section-header">DETAILS</div>
             <div className="u-modal-grid-2">
               {fields.map((field, i) => (
                 <div className="u-modal-field" key={i}>
                   <label className="u-modal-label">{field.label}</label>
                   <input type="text" className="u-modal-input" value={field.value || ''} readOnly />
                 </div>
               ))}
             </div>
          </div>

          {history && history.length > 0 && (
             <div className="u-modal-section" style={{ marginTop: '24px' }}>
                <div className="u-modal-section-header">HISTORY / BREAKDOWN</div>
                <div className="cc-table-container">
                   <table className="cc-table" style={{ width: '100%' }}>
                     <thead>
                       <tr>
                         {Object.keys(history[0]).map((key, idx) => (
                           <th key={idx} style={{ textTransform: 'uppercase' }}>{key}</th>
                         ))}
                       </tr>
                     </thead>
                     <tbody>
                       {history.map((row, rIdx) => (
                         <tr key={rIdx} className="cc-card-row" style={{ cursor: 'default' }}>
                           {Object.values(row).map((val, cIdx) => (
                             <td key={cIdx} className="text-white">{val}</td>
                           ))}
                         </tr>
                       ))}
                     </tbody>
                   </table>
                </div>
             </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default SummaryModal;
