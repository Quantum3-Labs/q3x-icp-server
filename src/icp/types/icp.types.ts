export interface CanisterCreateResult {
  canisterId: string;
}

export interface CanisterInstallResult {
  success: boolean;
  wasmHash: string;
}

export type CanisterStatus = 'running' | 'stopping' | 'stopped';

export interface SimplifiedCanisterStatus {
  status: CanisterStatus;
  cycles: string;
  memory_size: string;
}
