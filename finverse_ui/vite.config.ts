import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    fs: {
      // Allow serving files from the blockchain directory
      allow: ['..', '../blockchain']
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Serve static files from blockchain directory
  publicDir: 'public',
  define: {
    // Provide environment variables for browser
    'import.meta.env.VITE_TOKEN_ADDRESS': JSON.stringify(process.env.VITE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'),
    'import.meta.env.VITE_STAKE_VAULT_ADDRESS': JSON.stringify(process.env.VITE_STAKE_VAULT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'),
    'import.meta.env.VITE_FVT_TOKEN_ADDRESS': JSON.stringify(process.env.VITE_FVT_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'),
  }
})
