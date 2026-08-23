import React, { useState, useEffect } from 'react';
import { Activity, Server, Database, Smartphone, Globe, AlertTriangle, FileCode2, Copy, Check, ChevronDown, ChevronUp } from 'lucide-react';
import './PlatformHealthWidget.css';

const PlatformHealthWidget = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [expandedService, setExpandedService] = useState(null);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const fetchHealth = async (simulate = false) => {
    setLoading(true);
    try {
      // Typically would fetch from env variable API URL, but we use localhost or relative here
      const url = simulate ? 'http://localhost:8000/api/v1/health/detailed?simulateFailure=true' : 'http://localhost:8000/api/v1/health/detailed';
      const res = await fetch(url);
      const data = await res.json();
      setHealthData(data);
    } catch (error) {
      console.error("Health check failed:", error);
      // Fallback if backend is unreachable (Reconnecting state)
      setHealthData({
        status: 'offline',
        overallLatencyMs: '-',
        summary: { totalServices: 0, healthy: 0, failing: 0 },
        services: []
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(() => fetchHealth(), 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status) => {
    if (status === 'operational' || status === 'healthy') return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (status === 'degraded' || status === 'offline') return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const getStatusDot = (status) => {
    if (status === 'healthy' || status === 'operational') return <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />;
    if (status === 'degraded' || status === 'offline') return <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse" />;
    return <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />;
  };

  const generatePrompt = (service) => {
    const prompt = `The platform diagnostic reported an error in ${service.name}:
- Error: ${service.error}
- Affected Files: ${(service.affectedFiles || []).join(', ')}
- Stack Trace: ${service.stackTrace || 'N/A'}

Please review ${(service.affectedFiles || []).join(', ')}, resolve the error, ensure strict TypeScript typing, and verify proper database transaction rollbacks.`;
    navigator.clipboard.writeText(prompt);
    setCopiedPrompt(true);
    setTimeout(() => setCopiedPrompt(false), 2000);
  };

  if (!healthData) return null;

  return (
    <>
      {/* Widget on Dashboard */}
      <div 
        className={`health-widget-card cursor-pointer border rounded-lg p-4 flex items-center justify-between transition-all hover:bg-white/5 ${
          healthData.status === 'healthy' ? 'border-green-500/30' : 
          healthData.status === 'degraded' ? 'border-yellow-500/50' : 'border-red-500/50'
        }`}
        onClick={() => setShowModal(true)}
      >
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${getStatusColor(healthData.status)}`}>
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold tracking-wider text-gray-300">PLATFORM HEALTH</h3>
            <div className="flex items-center gap-2 mt-1">
              {getStatusDot(healthData.status)}
              <span className={`text-xs font-bold uppercase tracking-widest ${
                healthData.status === 'healthy' ? 'text-green-500' : 
                healthData.status === 'offline' ? 'text-yellow-500' :
                healthData.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'
              }`}>
                {healthData.status === 'healthy' ? 'ALL SYSTEMS OPERATIONAL' : 
                 healthData.status === 'offline' ? 'RECONNECTING...' :
                 healthData.status === 'degraded' ? 'DEGRADED PERFORMANCE' : 'SYSTEM CRITICAL'}
              </span>
            </div>
          </div>
        </div>
        <div className="text-right flex flex-col items-end">
           <span className="text-xs text-gray-500 font-mono">{healthData.overallLatencyMs}{healthData.status !== 'offline' && 'ms ping'}</span>
           <span className="text-xs text-gray-500">{healthData.summary.healthy}/{healthData.summary.totalServices} Services Online</span>
        </div>
      </div>

      {/* Detailed Diagnostic Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#111112] border border-gray-800 rounded-xl w-full max-w-3xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            {/* Modal Header */}
            <div className="p-5 border-b border-gray-800 flex items-center justify-between bg-[#070708]">
              <div className="flex items-center gap-3">
                <Activity className="text-gold" size={24} />
                <h2 className="text-lg font-bold tracking-widest text-white uppercase">Diagnostic Hub</h2>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={() => fetchHealth(true)} className="text-xs font-mono text-gray-400 hover:text-white px-3 py-1 border border-gray-700 rounded hover:bg-gray-800">
                  Simulate Failure
                </button>
                <button onClick={() => fetchHealth()} className="text-xs font-mono text-gold hover:text-white px-3 py-1 border border-gold/30 rounded hover:bg-gold/10">
                  Run Diagnostic
                </button>
                <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-white">✕</button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1">
              {/* Summary Cards */}
              <div className="grid grid-cols-3 gap-4 mb-8">
                <div className="bg-[#070708] border border-gray-800 rounded-lg p-4 text-center">
                  <div className="text-3xl font-light text-white mb-1">{healthData.summary.totalServices}</div>
                  <div className="text-xs font-bold text-gray-500 tracking-wider">TOTAL MONITORS</div>
                </div>
                <div className="bg-green-500/5 border border-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-light text-green-500 mb-1">{healthData.summary.healthy}</div>
                  <div className="text-xs font-bold text-green-600/70 tracking-wider">HEALTHY</div>
                </div>
                <div className={`border rounded-lg p-4 text-center ${healthData.summary.failing > 0 ? 'bg-red-500/10 border-red-500/30' : 'bg-[#070708] border-gray-800'}`}>
                  <div className={`text-3xl font-light mb-1 ${healthData.summary.failing > 0 ? 'text-red-500' : 'text-gray-600'}`}>{healthData.summary.failing}</div>
                  <div className="text-xs font-bold text-gray-500 tracking-wider">FAILING</div>
                </div>
              </div>

              {/* Services List */}
              <div className="space-y-3">
                <h3 className="text-xs font-bold tracking-widest text-gray-500 mb-4 uppercase">Subsystem Diagnostics</h3>
                {healthData.services.map((service, idx) => (
                  <div key={idx} className={`border rounded-lg overflow-hidden transition-all ${
                    service.status === 'operational' ? 'border-gray-800 bg-[#070708]' :
                    service.status === 'degraded' ? 'border-yellow-500/30 bg-yellow-500/5' :
                    'border-red-500/30 bg-red-500/5'
                  }`}>
                    {/* Row Header */}
                    <div 
                      className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/5"
                      onClick={() => setExpandedService(expandedService === idx ? null : idx)}
                    >
                      <div className="flex items-center gap-4">
                        <div className={getStatusColor(service.status) + ' p-2 rounded'}>
                          {service.category === 'database' ? <Database size={16} /> :
                           service.category === 'mobile-services' ? <Smartphone size={16} /> :
                           service.category === 'external-api' ? <Globe size={16} /> : <Server size={16} />}
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-200">{service.name}</h4>
                          <span className="text-xs text-gray-500 font-mono">{service.latencyMs}ms latency • {service.details}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          service.status === 'operational' ? 'text-green-500' :
                          service.status === 'degraded' ? 'text-yellow-500' : 'text-red-500'
                        }`}>
                          {service.status}
                        </span>
                        {service.status !== 'operational' && (
                          expandedService === idx ? <ChevronUp size={16} className="text-gray-500"/> : <ChevronDown size={16} className="text-gray-500"/>
                        )}
                      </div>
                    </div>

                    {/* Expanded Error Info */}
                    {expandedService === idx && service.status !== 'operational' && (
                      <div className="p-4 border-t border-gray-800/50 bg-[#0a0a0c]">
                        <div className="flex items-start gap-2 mb-4 text-red-400">
                          <AlertTriangle size={16} className="mt-0.5 shrink-0" />
                          <span className="text-sm font-mono">{service.error}</span>
                        </div>
                        
                        {service.affectedFiles && (
                          <div className="mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Affected Files</span>
                            <div className="flex items-center gap-2 text-xs font-mono text-gray-300 bg-[#111112] p-2 rounded border border-gray-800">
                              <FileCode2 size={14} className="text-blue-400" />
                              {service.affectedFiles.join(', ')}
                            </div>
                          </div>
                        )}

                        {service.stackTrace && (
                          <div className="mb-4">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-2">Stack Trace</span>
                            <pre className="text-[10px] font-mono text-red-300/80 bg-red-950/20 p-3 rounded border border-red-900/30 overflow-x-auto whitespace-pre-wrap">
                              {service.stackTrace}
                            </pre>
                          </div>
                        )}

                        <button 
                          onClick={(e) => { e.stopPropagation(); generatePrompt(service); }}
                          className="mt-2 flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold tracking-wider uppercase rounded transition-colors"
                        >
                          {copiedPrompt ? <Check size={14} /> : <Copy size={14} />}
                          {copiedPrompt ? 'Prompt Copied' : 'Generate AI Fix Prompt'}
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default PlatformHealthWidget;
