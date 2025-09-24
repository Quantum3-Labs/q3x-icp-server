export class ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export class ListResponse<T = any> extends ApiResponse<T[]> {
  data: T[];
  count: number;
}

export class ErrorResponse extends ApiResponse<null> {
  success: false;
  error: string;
  data?: null;
}

export class SuccessResponse extends ApiResponse<null> {
  success: true;
  message: string;
  data?: null;
}
