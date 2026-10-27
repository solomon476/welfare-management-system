import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ErrorBoundary } from './components/ErrorBoundary.tsx'

// Global runtime error fallback - shows a message instead of white screen
window.onerror = function(message, _source, _lineno, _colno, _error) {
  const root = document.getElementById('root');
  if (root && root.children.length === 1 && root.querySelector('div[style]')) {
    // Still showing loading spinner - React hasn't mounted yet; show error
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090d16;color:#fff;font-family:sans-serif;padding:20px;text-align:center;">
        <div>
          <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
          <h3 style="margin:0 0 8px;color:#ef4444;">App failed to start</h3>
          <p style="color:#94a3b8;margin:0 0 16px;font-size:0.85rem;">${String(message).substring(0, 120)}</p>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" 
            style="background:#007a3d;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:0.9rem;">
            Clear Cache &amp; Retry
          </button>
        </div>
      </div>`;
  }
};

try {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  )
} catch (e) {
  console.error('React failed to mount:', e);
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;background:#090d16;color:#fff;font-family:sans-serif;padding:20px;text-align:center;">
        <div>
          <div style="font-size:2rem;margin-bottom:12px;">⚠️</div>
          <h3 style="margin:0 0 8px;color:#ef4444;">Failed to load</h3>
          <p style="color:#94a3b8;margin:0 0 16px;font-size:0.85rem;">Please clear your browser cache and try again.</p>
          <button onclick="localStorage.clear();sessionStorage.clear();location.reload()" 
            style="background:#007a3d;color:#fff;border:none;padding:10px 20px;border-radius:8px;cursor:pointer;font-size:0.9rem;">
            Clear Cache &amp; Retry
          </button>
        </div>
      </div>`;
  }
}
