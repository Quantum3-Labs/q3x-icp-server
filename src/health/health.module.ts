import { Module } from '@nestjs/common';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { IcpModule } from '@/icp/icp.module';

@Module({
  imports: [TerminusModule, IcpModule],
  controllers: [HealthController],
})
export class HealthModule {}
