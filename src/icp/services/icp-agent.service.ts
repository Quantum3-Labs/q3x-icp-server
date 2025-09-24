import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpAgent } from '@icp-sdk/core/agent';
import { IdentityService } from './identity.service';

@Injectable()
export class IcpAgentService implements OnModuleInit {
  private readonly logger = new Logger(IcpAgentService.name);
  private agent: HttpAgent | null = null;

  constructor(
    private configService: ConfigService,
    private identityService: IdentityService,
  ) {}

  async onModuleInit() {
    await this.initializeAgent();
  }

  async getAgent(): Promise<HttpAgent> {
    if (!this.agent) {
      await this.initializeAgent();
    }
    return this.agent!;
  }

  private async initializeAgent(): Promise<void> {
    try {
      const replicaUrl = this.configService.get<string>('icp.replicaUrl');
      const fetchRootKey = this.configService.get<boolean>('icp.fetchRootKey');
      const identity = await this.identityService.getIdentity();

      this.agent = await HttpAgent.create({
        host: replicaUrl,
        identity,
      });

      // Fetch root key for local development
      if (fetchRootKey) {
        await this.agent.fetchRootKey();
        this.logger.log('Root key fetched for local development');
      }
    } catch (error) {
      this.logger.error('Failed to initialize ICP Agent', error);
      throw new Error(`Failed to initialize ICP Agent: ${error.message}`);
    }
  }

  // Health check method
  async isHealthy(): Promise<boolean> {
    try {
      const agent = await this.getAgent();
      // Try to get status of the management canister
      await agent.status();
      return true;
    } catch {
      return false;
    }
  }

  // Retry wrapper for network calls
  async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries?: number,
    delayMs?: number,
  ): Promise<T> {
    const retries =
      maxRetries ?? this.configService.get<number>('icp.maxRetries', 3);
    const delay =
      delayMs ?? this.configService.get<number>('icp.retryDelayMs', 1000);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        if (attempt === retries) {
          throw error;
        }

        this.logger.warn(
          `Operation failed (attempt ${attempt}/${retries}), retrying in ${delay}ms...`,
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw new Error('Max retries exceeded');
  }
}
