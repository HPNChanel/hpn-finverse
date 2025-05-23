// Polyfills need to come first
import { Buffer } from 'buffer';
import process from 'process';
import utilPolyfill from './polyfills/util-polyfill';

// Make Node.js globals available to browser environment
window.Buffer = Buffer;
window.process = process;
window.global = window;
window.util = utilPolyfill;

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
