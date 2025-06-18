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
    },
    proxy: {
      // Proxy avatar uploads to the backend
      '/uploads': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  },
  // Serve static files from blockchain directory
  publicDir: 'public',
  define: {
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL || 'http://localhost:8000/api/v1'),
    'import.meta.env.VITE_TOKEN_ADDRESS': JSON.stringify(process.env.VITE_TOKEN_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'),
    'import.meta.env.VITE_STAKE_VAULT_ADDRESS': JSON.stringify(process.env.VITE_STAKE_VAULT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512'),
          // ETH-only staking - no token address needed
    'import.meta.env.VITE_NETWORK_RPC_URL': JSON.stringify(process.env.VITE_NETWORK_RPC_URL || 'http://localhost:8545'),
    'import.meta.env.VITE_NETWORK_CHAIN_ID': JSON.stringify(process.env.VITE_NETWORK_CHAIN_ID || '31337'),
    'import.meta.env.VITE_TEST_USER_ADDRESS': JSON.stringify(process.env.VITE_TEST_USER_ADDRESS || '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'),
    'import.meta.env.VITE_DEPLOYER_ADDRESS': JSON.stringify(process.env.VITE_DEPLOYER_ADDRESS || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'),
  }
})
