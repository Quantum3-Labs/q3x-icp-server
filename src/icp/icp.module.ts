import { Module } from '@nestjs/common';
import { IcpAgentService } from './services/icp-agent.service';
import { IdentityService } from './services/identity.service';
import { CanisterManagerService } from './services/canister-manager.service';
import { WasmLoaderService } from './services/wasm-loader.service';

@Module({
  providers: [
    IdentityService,
    IcpAgentService,
    WasmLoaderService,
    CanisterManagerService,
  ],
  exports: [
    IdentityService,
    IcpAgentService,
    WasmLoaderService,
    CanisterManagerService,
  ],
})
export class IcpModule {}
