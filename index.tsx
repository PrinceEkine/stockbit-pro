import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Register Service Worker with improved resilience for origin mismatches
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // Using relative path to current origin to avoid domain mismatch errors
    navigator.serviceWorker.register('./sw.js', { scope: './' })
      .then(reg => console.log('SW deployed:', reg.scope))
      .catch(err => {
        // Silently handle development origin mismatches while logging others
        if (!err.message.includes('origin')) {
          console.warn('SW registration failed:', err);
        }
      });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);