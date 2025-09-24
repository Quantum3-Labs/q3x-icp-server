import { ApiResponse, ListResponse } from '../../common/dto/api-response.dto';
import { Wallet } from '../models';
import { SimplifiedCanisterStatus } from '@/icp/types/icp.types';

export class CreateWalletResponseDto extends ApiResponse<Wallet> {
  success: true;
  data: Wallet;
  message: string;
}

export class WalletResponseDto extends ApiResponse<Wallet> {
  success: true;
  data: Wallet;
}

export class WalletsResponseDto extends ListResponse<Wallet> {
  success: true;
  data: Wallet[];
  count: number;
}

export class DeleteWalletResponseDto extends ApiResponse<null> {
  success: true;
  message: string;
}

export class WalletStatusResponseDto extends ApiResponse<any> {
  success: true;
  data: SimplifiedCanisterStatus;
}
