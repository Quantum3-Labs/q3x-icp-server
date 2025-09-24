import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs/promises';
import * as crypto from 'crypto';

@Injectable()
export class WasmLoaderService implements OnModuleInit {
  private readonly logger = new Logger(WasmLoaderService.name);
  private wasmBinary: Uint8Array | null = null;
  private wasmHash: string | null = null;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    await this.loadAssets();
  }

  async getWasmBinary(): Promise<Uint8Array> {
    if (!this.wasmBinary) {
      await this.loadWasm();
    }
    return this.wasmBinary!;
  }

  async getWasmHash(): Promise<string> {
    if (!this.wasmHash) {
      const wasm = await this.getWasmBinary();
      this.wasmHash = crypto.createHash('sha256').update(wasm).digest('hex');
    }
    return this.wasmHash;
  }

  private async loadAssets(): Promise<void> {
    try {
      await Promise.all([this.loadWasm()]);
      this.logger.log('All canister assets loaded successfully');
    } catch (error) {
      this.logger.error('Failed to load canister assets', error);
      throw error;
    }
  }

  private async loadWasm(): Promise<void> {
    try {
      const wasmPath = this.configService.get<string>('icp.canisterWasmPath');

      if (!wasmPath) {
        throw new Error('CANISTER_WASM_PATH not configured');
      }

      // Check if file exists
      await fs.access(wasmPath);

      // Load WASM binary
      const wasmBuffer = await fs.readFile(wasmPath);
      this.wasmBinary = new Uint8Array(wasmBuffer);

      // Calculate hash
      this.wasmHash = crypto
        .createHash('sha256')
        .update(this.wasmBinary)
        .digest('hex');

      this.logger.log(
        `WASM loaded: ${wasmPath} (${this.wasmBinary.length} bytes)`,
      );
      this.logger.log(`WASM hash: ${this.wasmHash}`);
    } catch (error) {
      this.logger.error('Failed to load WASM file', error);
      throw new Error(`Failed to load WASM: ${error.message}`);
    }
  }

  // Reload assets if needed
  async reloadAssets(): Promise<void> {
    this.wasmBinary = null;
    this.wasmHash = null;
    await this.loadAssets();
  }

  // Validate assets
  async validateAssets(): Promise<boolean> {
    try {
      await this.getWasmBinary();
      return true;
    } catch {
      return false;
    }
  }

  // Get asset info
  getAssetInfo(): {
    wasmSize: number;
    wasmHash: string;
  } {
    return {
      wasmSize: this.wasmBinary?.length || 0,
      wasmHash: this.wasmHash || '',
    };
  }
}
