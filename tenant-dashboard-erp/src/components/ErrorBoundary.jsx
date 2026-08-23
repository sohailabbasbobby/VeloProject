import React from 'react';
import { AlertTriangle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Global Error Caught by Boundary:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', backgroundColor: '#070708', color: 'white', padding: '20px', textAlign: 'center' }}>
          <AlertTriangle size={64} color="#FF3B30" style={{ marginBottom: '20px' }} />
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '10px' }}>SYSTEM HALTED: RENDER FAULT</h1>
          <p style={{ color: '#888', marginBottom: '20px', maxWidth: '500px' }}>
            The dashboard encountered an unexpected error and has halted to prevent data corruption.
          </p>
          <pre style={{ backgroundColor: '#111', padding: '15px', borderRadius: '8px', color: '#FF3B30', maxWidth: '80%', overflow: 'auto', textAlign: 'left', fontSize: '12px' }}>
            {this.state.error?.toString()}
          </pre>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#D4AF37', color: 'black', fontWeight: 'bold', borderRadius: '4px' }}
          >
            REBOOT SYSTEM
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
