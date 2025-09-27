import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { DeploymentStatus } from '@prisma/client';
import { PrismaService } from '@/database/prisma.service';
import { CanisterManagerService } from '@/icp/services/canister-manager.service';
import { WasmLoaderService } from '@/icp/services/wasm-loader.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { Wallet } from '@/common/models';
import { SimplifiedCanisterStatus } from '@/icp/types/icp.types';

@Injectable()
export class WalletService {
  private readonly logger = new Logger(WalletService.name);

  constructor(
    private prismaService: PrismaService,
    private canisterManagerService: CanisterManagerService,
    private wasmLoaderService: WasmLoaderService,
  ) {}

  async createUserWallet(createWalletDto: CreateWalletDto): Promise<Wallet> {
    const { metadata, name, creatorPrincipal, signers } = createWalletDto;

    try {
      // Step 1: Create canister FIRST, then save to database
      this.logger.log('Creating canister...');
      const createResult = await this.canisterManagerService.createCanister();
      const { canisterId } = createResult;

      this.logger.log(`Canister created: ${canisterId}`);

      // Step 2: Create database record with actual canister ID
      const deployedWallet = await this.prismaService.$transaction(
        async (tx) => {
          // Create/get all users (including creator)
          const users = [];

          // TODO: not want call mutiple times here
          for (const principal of signers) {
            let user = await tx.user.findUnique({
              where: { principal },
            });

            if (!user) {
              user = await tx.user.create({
                data: {
                  principal,
                  displayName: `User ${principal.substring(0, 8)}...`,
                },
              });
              this.logger.log(`Created new user: ${principal}`);
            }
            users.push(user);
          }

          // Create wallet with signers
          const wallet = await tx.deployedWallet.create({
            data: {
              canisterId,
              name: name,
              status: DeploymentStatus.DEPLOYING,
              metadata: {
                ...metadata,
                createdBy: creatorPrincipal,
              },
              signers: {
                create: users.map((user) => ({
                  userId: user.id,
                })),
              },
            },
          });

          return wallet;
        },
      );
      // const deployedWallet = await this.prismaService.deployedWallet.create({
      //   data: {
      //     canisterId,
      //     name: name,
      //     status: DeploymentStatus.DEPLOYING,
      //     metadata: metadata || {},
      //   },
      // });

      try {
        // Step 3: Install WASM code
        const installResult =
          await this.canisterManagerService.installCode(canisterId);

        // Step 4: Update status to DEPLOYED
        const finalWallet = await this.prismaService.deployedWallet.update({
          where: { id: deployedWallet.id },
          data: {
            status: DeploymentStatus.DEPLOYED,
            wasmHash: installResult.wasmHash,
            metadata: {
              ...metadata,
              deployedAt: new Date().toISOString(),
              wasmSize: this.wasmLoaderService.getAssetInfo().wasmSize,
            },
          },
        });

        this.logger.log(`Wallet deployed successfully: ${canisterId}`);
        return new Wallet(finalWallet);
      } catch (deployError) {
        // Update status to FAILED if installation fails
        await this.prismaService.deployedWallet.update({
          where: { id: deployedWallet.id },
          data: {
            status: DeploymentStatus.FAILED,
            metadata: {
              ...metadata,
              error: deployError.message,
              failedAt: new Date().toISOString(),
            },
          },
        });

        throw deployError;
      }
    } catch (error) {
      this.logger.error('Failed to create wallet', error);
      throw new BadRequestException(
        `Failed to create wallet: ${error.message}`,
      );
    }
  }

  async getWallet(canisterId: string): Promise<Wallet> {
    try {
      const wallet = await this.prismaService.deployedWallet.findUnique({
        where: { canisterId },
        select: {
          canisterId: true,
          metadata: true,
          status: true,
          name: true
        },
      });

      if (!wallet) {
        throw new NotFoundException(
          `Wallet with canister ID ${canisterId} not found`,
        );
      }

      return new Wallet(wallet);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to get wallet ${canisterId}`, error);
      throw new BadRequestException(`Failed to get wallet: ${error.message}`);
    }
  }

  async getAllWallets(): Promise<Wallet[]> {
    try {
      const wallets = await this.prismaService.deployedWallet.findMany({
        orderBy: { createdAt: 'desc' },
        select: {
          canisterId: true,
          name: true
        },
      });

      return wallets.map((wallet) => new Wallet(wallet));
    } catch (error) {
      this.logger.error('Failed to get all wallets', error);
      throw new BadRequestException(`Failed to get wallets: ${error.message}`);
    }
  }

  async getWalletsByPrincipal(principal: string): Promise<Wallet[]> {
    const wallets = await this.prismaService.deployedWallet.findMany({
      where: {
        signers: {
          some: {
            user: {
              principal: principal,
            },
          },
        },
      },
      include: {
        signers: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return wallets.map((wallet) => new Wallet(wallet));
  }

  async getWalletById(walletId: string, principal: string): Promise<Wallet> {
    const wallet = await this.prismaService.deployedWallet.findFirst({
      where: {
        id: walletId,
        signers: {
          some: {
            user: {
              principal: principal,
            },
          },
        },
      },
      include: {
        signers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!wallet) {
      throw new NotFoundException('Wallet not found or access denied');
    }

    return new Wallet(wallet);
  }

  async deleteUserWallet(canisterId: string): Promise<boolean> {
    try {
      // Verify wallet exists in database
      await this.getWallet(canisterId);

      // Verify canister exists on IC
      const status =
        await this.canisterManagerService.getCanisterStatus(canisterId);
      if (!status) {
        throw new NotFoundException(
          `Canister ${canisterId} not found on the Internet Computer`,
        );
      }

      this.logger.log(`Deleting wallet canister: ${canisterId}`);

      // Delete canister from IC
      await this.canisterManagerService.deleteCanister(canisterId);

      // Update database status
      await this.prismaService.deployedWallet.update({
        where: { canisterId },
        data: {
          status: DeploymentStatus.STOPPED,
        },
      });

      this.logger.log(`Wallet ${canisterId} deleted successfully`);
      return true;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to delete wallet ${canisterId}`, error);
      throw new BadRequestException(
        `Failed to delete wallet: ${error.message}`,
      );
    }
  }

  async getWalletStatus(canisterId: string): Promise<SimplifiedCanisterStatus> {
    try {
      // Get from database
      await this.getWallet(canisterId);

      // Get live status from ICP
      const icpStatus =
        await this.canisterManagerService.getCanisterStatus(canisterId);

      return icpStatus;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(`Failed to get wallet status ${canisterId}`, error);
      throw new BadRequestException(
        `Failed to get wallet status: ${error.message}`,
      );
    }
  }
}
