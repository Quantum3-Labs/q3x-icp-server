import { IsOptional, IsObject, IsString, IsNotEmpty, IsArray, IsNumber } from 'class-validator';

export class CreateWalletDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsArray()
  @IsString({ each: true })
  @IsNotEmpty({ each: true })
  signers: string[]; // Array of principal strings

  @IsString()
  @IsNotEmpty()
  creatorPrincipal: string; // Principal of wallet creator

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;
}
