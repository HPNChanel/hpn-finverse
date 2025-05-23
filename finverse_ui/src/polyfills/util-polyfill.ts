// Util polyfills for browser environment
import * as utilOriginal from 'util';

// Create a wrapper for the util module with simplified types
type SimpleDebugLogger = (...args: unknown[]) => void;
type SimpleDebugLoggerFn = (section: string) => SimpleDebugLogger;
type SimpleInspectFn = (obj: unknown, options?: unknown) => string;

interface UtilPolyfillType extends Omit<typeof utilOriginal, 'debuglog' | 'inspect'> {
  debuglog: SimpleDebugLoggerFn;
  inspect: SimpleInspectFn;
}

// Extend Window interface to include util
declare global {
  interface Window {
    util: UtilPolyfillType;
    Buffer: typeof Buffer;
    process: typeof process;
    global: Window;
  }
}

// Create a wrapper for the util module
const utilPolyfill = { ...utilOriginal } as UtilPolyfillType;

// Add debuglog polyfill
if (!utilPolyfill.debuglog) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  utilPolyfill.debuglog = function(_section: string) {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    return function(..._args: unknown[]) { /* noop */ };
  };
}

// Add inspect polyfill
if (!utilPolyfill.inspect) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  utilPolyfill.inspect = function(obj: unknown, _options?: unknown) {
    return typeof obj === 'undefined' ? 'undefined' : JSON.stringify(obj);
  };
}

export default utilPolyfill; 