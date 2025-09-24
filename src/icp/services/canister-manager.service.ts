import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  CanisterStatusResponse,
  ICManagementCanister,
} from '@dfinity/ic-management';
import { Principal } from '@dfinity/principal';
import { IcpAgentService } from './icp-agent.service';
import { WasmLoaderService } from './wasm-loader.service';
import {
  CanisterCreateResult,
  CanisterInstallResult,
  CanisterStatus,
  SimplifiedCanisterStatus,
} from '../types/icp.types';
import { IDL } from '@dfinity/candid';

@Injectable()
export class CanisterManagerService {
  private readonly logger = new Logger(CanisterManagerService.name);
  private managementCanister: ICManagementCanister | null = null;

  constructor(
    private configService: ConfigService,
    private icpAgentService: IcpAgentService,
    private wasmLoaderService: WasmLoaderService,
  ) {}

  async createCanister(): Promise<CanisterCreateResult> {
    try {
      const management = await this.getManagementCanister();
      const defaultCycles = this.configService.get<bigint>(
        'icp.defaultCanisterCycles',
      );
      const nodeEnv = this.configService.get<string>('app.nodeEnv');

      this.logger.log(`Creating new canister with ${defaultCycles} cycles`);

      const backendPrincipal = await this.getBackendPrincipal();
      const backendPrincipalStr = backendPrincipal.toString();
      this.logger.log(`Backend Principal: ${backendPrincipalStr}`);
      let result;
      let canisterId: string;

      if (nodeEnv === 'development') {
        // Local development - use provisionalCreateCanisterWithCycles
        this.logger.log(
          'Using provisionalCreateCanisterWithCycles for development',
        );

        const principal = await management.provisionalCreateCanisterWithCycles({
          settings: {
            controllers: [backendPrincipalStr],
          },
          amount: defaultCycles,
        });

        canisterId = principal.toString();
      } else {
        // Production/Mainnet - use createCanister
        this.logger.log('Using createCanister for production');

        result = await management.createCanister({
          settings: {
            controllers: [backendPrincipalStr],
          },
        });

        canisterId = result.canister_id.toString();
      }

      this.logger.log(`Canister created successfully: ${canisterId}`);
      this.logger.log(`Controller: ${backendPrincipal.toString()}`);

      return {
        canisterId,
      };
    } catch (error) {
      this.logger.error('Failed to create canister', error);
      throw new Error(`Failed to create canister: ${error.message}`);
    }
  }

  async installCode(
    canisterId: string,
    initArgs?: String,
  ): Promise<CanisterInstallResult> {
    try {
      const management = await this.getManagementCanister();
      const wasmBinary = await this.wasmLoaderService.getWasmBinary();
      const wasmHash = await this.wasmLoaderService.getWasmHash();

      this.logger.log(`Installing code on canister ${canisterId})`);

      const initArgIDL = [IDL.Text];
      const encodedArgs = IDL.encode(initArgIDL, [initArgs || '']);

      await management.installCode({
        mode: { install: null },
        canisterId: Principal.fromText(canisterId),
        wasmModule: wasmBinary,
        arg: encodedArgs,
      });

      this.logger.log(`Code installed successfully on canister ${canisterId}`);

      return {
        success: true,
        wasmHash,
      };
    } catch (error) {
      this.logger.error(
        `Failed to install code on canister ${canisterId}`,
        error,
      );
      throw new Error(`Failed to install code: ${error.message}`);
    }
  }

  async getCanisterStatus(
    canisterId: string,
  ): Promise<SimplifiedCanisterStatus> {
    try {
      const management = await this.getManagementCanister();

      const status: CanisterStatusResponse = await management.canisterStatus(
        Principal.fromText(canisterId),
      );

      const simplifiedStatus: SimplifiedCanisterStatus = {
        status: Object.keys(status.status)[0] as CanisterStatus,
        cycles: status.cycles.toString(),
        memory_size: status.memory_size.toString(),
      };

      return simplifiedStatus;
    } catch (error) {
      this.logger.error(
        `Failed to get canister status for ${canisterId}`,
        error,
      );
      throw new Error(`Failed to get canister status: ${error.message}`);
    }
  }

  async deleteCanister(canisterId: string): Promise<boolean> {
    try {
      const management = await this.getManagementCanister();

      // Stop canister first
      await management.stopCanister(Principal.fromText(canisterId));

      // Then delete
      await management.deleteCanister(Principal.fromText(canisterId));

      this.logger.log(`Canister ${canisterId} deleted successfully`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete canister ${canisterId}`, error);
      throw new Error(`Failed to delete canister: ${error.message}`);
    }
  }

  private async getManagementCanister() {
    if (!this.managementCanister) {
      const agent = await this.icpAgentService.getAgent();
      this.managementCanister = ICManagementCanister.create({
        agent,
      });
    }

    return this.managementCanister;
  }

  private async getBackendPrincipal(): Promise<Principal> {
    const agent = await this.icpAgentService.getAgent();
    return agent.getPrincipal();
  }
}
