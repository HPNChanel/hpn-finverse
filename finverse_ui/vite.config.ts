import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import nodeResolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import inject from '@rollup/plugin-inject';

// Create a require function based on the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      // Use browser-compatible versions instead of Node built-ins
      stream: 'stream-browserify',
      buffer: 'buffer',
      util: 'util',
      process: 'process',  // Changed from 'process/browser' to just 'process'
      events: 'events',
      assert: 'assert',
      crypto: 'crypto-browserify',
      path: resolve(__dirname, 'src/polyfills/path.js'),
    }
  },
  define: {
    // Define global variables for browser environment
    'process.env': {},
    'global': 'globalThis',
  },
  optimizeDeps: {
    esbuildOptions: {
      define: {
        global: 'globalThis',
      },
    },
    include: [
      'buffer',
      'process',  // Changed from 'process/browser' to just 'process'
      'util',
      'events',
      'stream-browserify',
      'string_decoder'
    ]
  },
  build: {
    sourcemap: true,
    rollupOptions: {
      plugins: [
        nodeResolve({
          browser: true,
          preferBuiltins: false,
        }),
        commonjs(),
        inject({
          // Inject Buffer globally to fix "buffer.Buffer is undefined" errors
          Buffer: ['buffer', 'Buffer'],
          // Inject process globally
          process: ['process', 'default'],
          // Manually inject util for browserify packages
          util: ['util', '*']
        }),
      ]
    }
  },
});
