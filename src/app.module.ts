import { Module } from '@nestjs/common';
import { ConfigModule } from '@/config/config.module';
import { DatabaseModule } from '@/database/database.module';
import { IcpModule } from '@/icp/icp.module';
import { WalletModule } from '@/wallet/wallet.module';
import { HealthModule } from '@/health/health.module';

@Module({
  imports: [
    ConfigModule,
    DatabaseModule,
    IcpModule,
    WalletModule,
    HealthModule,
  ],
})
export class AppModule {}
