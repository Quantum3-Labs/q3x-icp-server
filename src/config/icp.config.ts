import { registerAs } from '@nestjs/config';

export default registerAs('icp', () => ({
  replicaUrl: process.env.ICP_REPLICA_URL || 'http://localhost:4943',
  backendPrivateKey: process.env.BACKEND_PRIVATE_KEY,
  canisterWasmPath: process.env.CANISTER_WASM_PATH || './assets/wallet.wasm',
  defaultCanisterCycles: BigInt(
    process.env.DEFAULT_CANISTER_CYCLES || '1000000000000',
  ),
  fetchRootKey: process.env.NODE_ENV === 'development',
  requestTimeoutMs: parseInt(process.env.ICP_REQUEST_TIMEOUT_MS) || 60000,
  maxRetries: parseInt(process.env.ICP_MAX_RETRIES) || 3,
  retryDelayMs: parseInt(process.env.ICP_RETRY_DELAY_MS) || 1000,
}));
