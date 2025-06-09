/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_API_URL?: string
  readonly VITE_TOKEN_ADDRESS?: string
  readonly VITE_STAKE_VAULT_ADDRESS?: string
      // ETH-only staking - no token address needed
  readonly VITE_NETWORK_RPC_URL?: string
  readonly VITE_NETWORK_CHAIN_ID?: string
  readonly VITE_DEBUG_MODE?: string
  readonly DEV?: boolean
  readonly NODE_ENV?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
