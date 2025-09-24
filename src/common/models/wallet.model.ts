import {
  DeployedWallet as PrismaDeployedWallet,
  DeploymentStatus,
} from '@prisma/client';

export class Wallet {
  id: string;
  canisterId: string;
  name?: string;
  status: DeploymentStatus;
  metadata?: any;
  wasmHash?: string;
  createdAt?: Date;
  updatedAt?: Date;
  isActive: boolean;

  constructor(
    prismaWallet: Partial<PrismaDeployedWallet>,
    options?: { name?: string },
  ) {
    this.id = prismaWallet.id || '';
    this.canisterId = prismaWallet.canisterId || '';
    this.name = options?.name || prismaWallet.name || undefined;
    this.status = prismaWallet.status || DeploymentStatus.DEPLOYING;
    this.metadata = prismaWallet.metadata || null;
    this.wasmHash = prismaWallet.wasmHash || undefined;
    this.createdAt = prismaWallet.createdAt || new Date();
    this.updatedAt = prismaWallet.updatedAt || new Date();

    this.isActive = this.status === DeploymentStatus.DEPLOYED;
  }

  isDeployed(): boolean {
    return this.status === DeploymentStatus.DEPLOYED;
  }

  isFailed(): boolean {
    return this.status === DeploymentStatus.FAILED;
  }

  getMetadata<T = any>(): T | null {
    return this.metadata as T;
  }
}
