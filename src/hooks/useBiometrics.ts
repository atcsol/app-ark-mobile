import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';
import { BIOMETRIC_STORAGE_KEYS, BIOMETRIC_ENABLED_VALUE } from '@/utils/constants';
import { clearBiometricCredentials } from '@/utils/storage';

// Credentials can only be decrypted after a biometric check (no device passcode fallback),
// never leave this device and require a device passcode to exist.
const CREDENTIALS_WRITE_OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  keychainAccessible: SecureStore.WHEN_PASSCODE_SET_THIS_DEVICE_ONLY,
  authenticationPrompt: 'Confirme a biometria para ativar o login rápido',
};

const CREDENTIALS_READ_OPTIONS: SecureStore.SecureStoreOptions = {
  requireAuthentication: true,
  authenticationPrompt: 'Autenticar com biometria',
};

interface BiometricCredentials {
  email: string;
  password: string;
}

export type BiometricAuthResult =
  | ({ status: 'success' } & BiometricCredentials)
  /** User dismissed the prompt or chose to type the password. */
  | { status: 'cancelled' }
  /** Stored credentials are gone or were invalidated (e.g. biometrics changed); biometrics was disabled. */
  | { status: 'unavailable' }
  | { status: 'error' };

const CANCEL_ERRORS: LocalAuthentication.LocalAuthenticationError[] = [
  'user_cancel',
  'system_cancel',
  'app_cancel',
  'user_fallback',
];

function canStoreWithBiometrics(): boolean {
  try {
    return SecureStore.canUseBiometricAuthentication();
  } catch {
    return false;
  }
}

function isCancelError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? '');
  return /cancel/i.test(message);
}

function parseCredentials(raw: string | null): BiometricCredentials | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed?.email === 'string' && typeof parsed?.password === 'string') {
      return { email: parsed.email, password: parsed.password };
    }
  } catch {
    // fall through
  }
  return null;
}

export function useBiometrics() {
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);

  useEffect(() => {
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    try {
      const compatible = await LocalAuthentication.hasHardwareAsync();
      const enrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(compatible && enrolled && canStoreWithBiometrics());

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }

      // Check if user has enabled biometrics
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_STORAGE_KEYS.ENABLED);
      if (enabled === BIOMETRIC_ENABLED_VALUE) {
        setIsBiometricEnabled(true);
      } else {
        // Wipe legacy credentials (stored without biometric protection) or orphaned entries
        await clearBiometricCredentials();
        setIsBiometricEnabled(false);
      }
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const enableBiometrics = useCallback(async (email: string, password: string) => {
    try {
      // Start clean so no unprotected copy survives and no update of a protected item is needed
      await clearBiometricCredentials();
      await SecureStore.setItemAsync(
        BIOMETRIC_STORAGE_KEYS.CREDENTIALS,
        JSON.stringify({ email, password }),
        CREDENTIALS_WRITE_OPTIONS,
      );
      await SecureStore.setItemAsync(BIOMETRIC_STORAGE_KEYS.ENABLED, BIOMETRIC_ENABLED_VALUE);
      setIsBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Failed to enable biometrics:', error);
      await clearBiometricCredentials().catch(() => {});
      setIsBiometricEnabled(false);
      return false;
    }
  }, []);

  const disableBiometrics = useCallback(async () => {
    try {
      await clearBiometricCredentials();
      setIsBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Failed to disable biometrics:', error);
      return false;
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<BiometricAuthResult> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar com biometria',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: true,
        fallbackLabel: 'Usar senha',
        biometricsSecurityLevel: 'strong',
      });

      if (!result.success) {
        return CANCEL_ERRORS.includes(result.error) ? { status: 'cancelled' } : { status: 'error' };
      }
    } catch (error) {
      console.error('Biometric auth failed:', error);
      return { status: 'error' };
    }

    let raw: string | null;
    try {
      // The OS asks for biometrics again here: the keychain/keystore item itself is protected
      raw = await SecureStore.getItemAsync(BIOMETRIC_STORAGE_KEYS.CREDENTIALS, CREDENTIALS_READ_OPTIONS);
    } catch (error) {
      if (isCancelError(error)) {
        return { status: 'cancelled' };
      }
      console.error('Biometric credentials read failed:', error);
      return { status: 'error' };
    }

    const credentials = parseCredentials(raw);
    if (!credentials) {
      // Missing or invalidated (biometric enrollment changed): force a fresh password login
      await disableBiometrics();
      return { status: 'unavailable' };
    }

    return { status: 'success', ...credentials };
  }, [disableBiometrics]);

  return {
    isBiometricAvailable,
    isBiometricEnabled,
    biometricType,
    enableBiometrics,
    disableBiometrics,
    authenticateWithBiometrics,
  };
}
