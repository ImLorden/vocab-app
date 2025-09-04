import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

console.log('[RENDERER] Starting React app...');

const rootElement = document.getElementById('root');
console.log('[RENDERER] Root element:', rootElement);

if (!rootElement) {
  console.error('[RENDERER] Root element not found!');
} else {
  console.log('[RENDERER] Creating React root...');
  const root = ReactDOM.createRoot(rootElement);
  console.log('[RENDERER] Rendering App...');
  root.render(<App />);
  console.log('[RENDERER] App rendered successfully');
}