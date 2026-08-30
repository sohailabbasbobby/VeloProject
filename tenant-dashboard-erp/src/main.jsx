import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

window.MOCK_DATA = {};

fetch('/api/system/mock-data', {
  headers: {
    'x-tenant-id': 'TENANT_123'
  }
})
  .then(res => res.json())
  .then(data => {
    window.MOCK_DATA = data;
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  })
  .catch(err => {
    console.error('Failed to load mock data from backend:', err);
    // Render anyway, UI will just be empty
    createRoot(document.getElementById('root')).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    );
  });
