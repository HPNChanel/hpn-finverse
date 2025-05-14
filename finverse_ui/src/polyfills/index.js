// This file contains browser polyfills for Node.js built-ins

import * as path from './path';
import * as stream from './readable-stream';

// Fix for util.debuglog error
import util from 'util';
if (!util.debuglog) {
  util.debuglog = function(section) {
    return function() {
      // No-op in the browser
    };
  };
}

// Fix for util.inspect error
if (!util.inspect) {
  util.inspect = function(obj, options) {
    return typeof obj === 'undefined' ? 'undefined' : JSON.stringify(obj);
  };
}

// Export Node.js built-in module polyfills
export {
  path,
  stream,
  util
};

// Global setup for browser environment
export function setupPolyfills() {
  // Define global Buffer if not present
  if (typeof window.Buffer === 'undefined') {
    const { Buffer } = require('buffer');
    window.Buffer = Buffer;
  }
  
  // Define global process if not present
  if (typeof window.process === 'undefined') {
    const process = require('process/browser');
    window.process = process;
  }
  
  // Define global util if not present
  if (typeof window.util === 'undefined') {
    window.util = util;
  }
  
  // Make global available on window
  window.global = window;
}
