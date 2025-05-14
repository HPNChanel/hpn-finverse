// Polyfills need to come first
import { Buffer } from 'buffer';
import process from 'process';
import * as util from 'util';

// Make Node.js globals available to browser environment
window.Buffer = Buffer;
window.process = process;
window.global = window;
window.util = util;

// Manually polyfill util.debuglog and util.inspect to fix crypto-browserify errors
util.debuglog = util.debuglog || function(section) {
  return function() { /* noop */ };
};

util.inspect = util.inspect || function(obj, options) {
  return typeof obj === 'undefined' ? 'undefined' : JSON.stringify(obj);
};

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
