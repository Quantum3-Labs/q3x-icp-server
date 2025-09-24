import { User as PrismaUser } from '@prisma/client';

export class User {
  id: string;
  principal: string;
  address?: string;
  displayName?: string;
  createdAt?: Date;
  updatedAt?: Date;

  constructor(prismaUser: Partial<PrismaUser>) {
    this.id = prismaUser.id || '';
    this.principal = prismaUser.principal || '';
    this.address = prismaUser.address;
    this.displayName = prismaUser.displayName || this.formatPrincipal();
    this.createdAt = prismaUser.createdAt || new Date();
    this.updatedAt = prismaUser.updatedAt || new Date();
  }

  private formatPrincipal(): string {
    // Format principal for display: "abc123...def456"
    if (this.principal.length > 16) {
      return `${this.principal.slice(0, 8)}...${this.principal.slice(-8)}`;
    }
    return this.principal;
  }

  getShortPrincipal(): string {
    return this.principal.slice(0, 8);
  }
}
