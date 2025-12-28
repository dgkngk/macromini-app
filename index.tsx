import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

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
    rootElement.innerHTML = '';
    
    const container = document.createElement('div');
    container.style.padding = '20px';
    container.style.color = 'red';
    container.style.fontFamily = 'sans-serif';
    
    const title = document.createElement('h1');
    title.textContent = 'Startup Error';
    container.appendChild(title);
    
    const pre = document.createElement('pre');
    pre.textContent = e instanceof Error ? e.message : String(e);
    container.appendChild(pre);
    
    rootElement.appendChild(container);
  }
}
