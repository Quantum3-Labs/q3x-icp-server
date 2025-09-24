import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Ed25519KeyIdentity } from '@icp-sdk/core/identity';

@Injectable()
export class IdentityService {
  private readonly logger = new Logger(IdentityService.name);
  private identity: Ed25519KeyIdentity | null = null;

  constructor(private configService: ConfigService) {}

  async getIdentity(): Promise<Ed25519KeyIdentity> {
    if (!this.identity) {
      await this.loadIdentity();
    }
    return this.identity!;
  }

  private async loadIdentity(): Promise<void> {
    try {
      const privateKeyHex = this.configService.get<string>(
        'icp.backendPrivateKey',
      );

      if (!privateKeyHex) {
        this.logger.error(
          'BACKEND_PRIVATE_KEY not found in environment variables',
        );
        this.logger.error(
          'Run: yarn generate:identity to create a new identity',
        );
        throw new Error('Backend private key not configured');
      }

      // Convert hex string to Uint8Array
      const secretKey = new Uint8Array(Buffer.from(privateKeyHex, 'hex'));

      // Create identity from secret key
      this.identity = Ed25519KeyIdentity.fromSecretKey(secretKey);

      this.logger.log(
        `Identity loaded successfully. Principal: ${this.identity.getPrincipal().toString()}`,
      );
    } catch (error) {
      this.logger.error('Failed to load identity', error);
      throw new Error(`Failed to load identity: ${error.message}`);
    }
  }

  async getPrincipal(): Promise<string> {
    const identity = await this.getIdentity();
    return identity.getPrincipal().toString();
  }

  // Get public key for reference
  async getPublicKey(): Promise<string> {
    const identity = await this.getIdentity();
    const publicKey = identity.getKeyPair().publicKey;
    return Buffer.from(publicKey.toRaw()).toString('hex');
  }
}
