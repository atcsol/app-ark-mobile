import { Alert } from 'react-native';
import { ApiError } from '@/utils/apiError';
import { ErrorCategory } from '@/utils/errorCodes';
import { captureError } from '@/utils/sentry';

interface ErrorHandlerOptions {
  silent?: boolean;
}

export function useErrorHandler() {
  function handleError(error: unknown, context?: string, options?: ErrorHandlerOptions): ApiError {
    const apiError = ApiError.fromError(error);

    // Log no Sentry para erros de servidor
    if (apiError.isServerError) {
      captureError(new Error(apiError.message), {
        context,
        errorCode: apiError.errorCode,
        statusCode: apiError.statusCode,
        category: apiError.category,
      });
    }

    // Auth errors são tratados pelo interceptor (auto-logout)
    if (apiError.isAuthError) {
      return apiError;
    }

    // Validation errors retornam para o form tratar
    if (apiError.isValidationError) {
      return apiError;
    }

    // Silent mode: retorna sem exibir Alert (para fetch com setError inline)
    if (options?.silent) {
      return apiError;
    }

    // Network errors
    if (apiError.isNetworkError) {
      Alert.alert('Sem conexão', apiError.userMessage);
      return apiError;
    }

    // Demais erros: exibir alerta ao usuário
    Alert.alert('Erro', apiError.userMessage);

    return apiError;
  }

  return { handleError };
}
