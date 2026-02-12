import { AxiosError } from 'axios';
import { ErrorCode, ErrorCategory } from './errorCodes';

interface BackendErrorResponse {
  success: false;
  message: string;
  error_code?: string;
  errors?: Record<string, string[]>;
}

export class ApiError {
  message: string;
  errorCode?: ErrorCode;
  category: ErrorCategory;
  statusCode?: number;
  validationErrors?: Record<string, string[]>;

  constructor(params: {
    message: string;
    errorCode?: ErrorCode;
    category: ErrorCategory;
    statusCode?: number;
    validationErrors?: Record<string, string[]>;
  }) {
    this.message = params.message;
    this.errorCode = params.errorCode;
    this.category = params.category;
    this.statusCode = params.statusCode;
    this.validationErrors = params.validationErrors;
  }

  static fromError(error: unknown): ApiError {
    if (error instanceof ApiError) return error;

    if (isAxiosError(error)) {
      return ApiError.fromAxiosError(error);
    }

    if (error instanceof Error) {
      return new ApiError({
        message: error.message,
        category: ErrorCategory.SERVER,
      });
    }

    return new ApiError({
      message: 'Ocorreu um erro inesperado.',
      category: ErrorCategory.SERVER,
    });
  }

  static fromAxiosError(error: AxiosError<BackendErrorResponse>): ApiError {
    // Network error (no response)
    if (!error.response) {
      return new ApiError({
        message: 'Sem conexão com o servidor. Verifique sua internet.',
        category: ErrorCategory.NETWORK,
      });
    }

    const { status, data } = error.response;
    const serverMessage = data?.message;
    const errorCodeStr = data?.error_code;
    const errorCode = errorCodeStr ? (errorCodeStr as ErrorCode) : undefined;

    // Categorize by error_code first, then by HTTP status
    const category = errorCode
      ? categorizeByCode(errorCode)
      : categorizeByStatus(status);

    return new ApiError({
      message: serverMessage || defaultMessageForCategory(category),
      errorCode,
      category,
      statusCode: status,
      validationErrors: data?.errors,
    });
  }

  get isNetworkError(): boolean {
    return this.category === ErrorCategory.NETWORK;
  }

  get isAuthError(): boolean {
    return this.category === ErrorCategory.AUTH;
  }

  get isValidationError(): boolean {
    return this.category === ErrorCategory.VALIDATION;
  }

  get isPermissionError(): boolean {
    return this.category === ErrorCategory.PERMISSION;
  }

  get isNotFoundError(): boolean {
    return this.category === ErrorCategory.NOT_FOUND;
  }

  get isServerError(): boolean {
    return this.category === ErrorCategory.SERVER;
  }

  get userMessage(): string {
    if (this.isNetworkError) {
      return 'Sem conexão com o servidor. Verifique sua internet.';
    }
    if (this.isAuthError) {
      return 'Sessão expirada. Faça login novamente.';
    }
    if (this.isServerError) {
      return 'Erro interno do servidor. Tente novamente mais tarde.';
    }
    return this.message;
  }
}

function categorizeByCode(code: string): ErrorCategory {
  if (code.startsWith('AUTH_')) return ErrorCategory.AUTH;
  if (code.startsWith('AUTHZ_')) return ErrorCategory.PERMISSION;
  if (code === ErrorCode.VALIDATION_FAILED) return ErrorCategory.VALIDATION;
  if (code === ErrorCode.RESOURCE_NOT_FOUND) return ErrorCategory.NOT_FOUND;
  if (code.startsWith('RESOURCE_')) return ErrorCategory.BUSINESS;
  if (
    code === ErrorCode.BUSINESS_RULE_VIOLATION ||
    code === ErrorCode.VEHICLE_ALREADY_SOLD ||
    code === ErrorCode.STOCK_INSUFFICIENT
  ) {
    return ErrorCategory.BUSINESS;
  }
  if (code.startsWith('EXTERNAL_') || code === ErrorCode.VIN_DECODE_FAILED) {
    return ErrorCategory.SERVER;
  }
  return ErrorCategory.SERVER;
}

function categorizeByStatus(status: number): ErrorCategory {
  if (status === 401) return ErrorCategory.AUTH;
  if (status === 403) return ErrorCategory.PERMISSION;
  if (status === 404) return ErrorCategory.NOT_FOUND;
  if (status === 422) return ErrorCategory.VALIDATION;
  if (status >= 500) return ErrorCategory.SERVER;
  return ErrorCategory.SERVER;
}

function defaultMessageForCategory(category: ErrorCategory): string {
  switch (category) {
    case ErrorCategory.NETWORK:
      return 'Sem conexão com o servidor. Verifique sua internet.';
    case ErrorCategory.AUTH:
      return 'Sessão expirada. Faça login novamente.';
    case ErrorCategory.VALIDATION:
      return 'Os dados informados são inválidos.';
    case ErrorCategory.PERMISSION:
      return 'Você não tem permissão para realizar esta ação.';
    case ErrorCategory.NOT_FOUND:
      return 'Recurso não encontrado.';
    case ErrorCategory.BUSINESS:
      return 'Operação não permitida.';
    case ErrorCategory.SERVER:
      return 'Erro interno do servidor. Tente novamente mais tarde.';
  }
}

function isAxiosError(error: unknown): error is AxiosError<BackendErrorResponse> {
  return (
    typeof error === 'object' &&
    error !== null &&
    'isAxiosError' in error &&
    (error as AxiosError).isAxiosError === true
  );
}
