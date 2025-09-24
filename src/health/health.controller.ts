import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  MemoryHealthIndicator,
  DiskHealthIndicator,
} from '@nestjs/terminus';
import { PrismaService } from '@/database/prisma.service';
import { IcpAgentService } from '@/icp/services/icp-agent.service';
import { WasmLoaderService } from '@/icp/services/wasm-loader.service';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private memory: MemoryHealthIndicator,
    private disk: DiskHealthIndicator,
    private prismaService: PrismaService,
    private icpAgentService: IcpAgentService,
    private wasmLoaderService: WasmLoaderService,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      // Database check
      async () => {
        const isHealthy = await this.prismaService.isHealthy();
        return {
          database: {
            status: isHealthy ? 'up' : 'down',
          },
        };
      },

      // ICP Agent check
      async () => {
        const isHealthy = await this.icpAgentService.isHealthy();
        return {
          icp_agent: {
            status: isHealthy ? 'up' : 'down',
          },
        };
      },

      // WASM Assets check
      async () => {
        const isHealthy = await this.wasmLoaderService.validateAssets();
        const assetInfo = this.wasmLoaderService.getAssetInfo();
        return {
          wasm_assets: {
            status: isHealthy ? 'up' : 'down',
            ...assetInfo,
          },
        };
      },
    ]);
  }

  @Get('simple')
  simpleCheck() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
