import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Error Trap for Mobile Debugging
window.onerror = function(message, source, lineno, colno, error) {
  const root = document.getElementById('root');
  if (root) {
    root.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Application Error</h1>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Source:</strong> ${source}:${lineno}:${colno}</p>
        <pre style="background: #eee; padding: 10px; overflow: auto;">${error?.stack || 'No stack trace'}</pre>
      </div>
    `;
  }
};

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

try {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} catch (e) {
  console.error("Mounting error:", e);
  if (rootElement) {
     rootElement.innerHTML = `
      <div style="padding: 20px; color: red; font-family: sans-serif;">
        <h1>Startup Error</h1>
        <pre>${e instanceof Error ? e.message : String(e)}</pre>
      </div>
    `;
  }
}
