import { WalletSigner as PrismaWalletSigner } from '@prisma/client';

export class WalletSigner {
  id: string;
  walletId: string;
  userId: string;

  constructor(prismaWalletSigner: Partial<PrismaWalletSigner>) {
    this.id = prismaWalletSigner.id;
    this.walletId = prismaWalletSigner.walletId;
    this.userId = prismaWalletSigner.userId;
  }
}
