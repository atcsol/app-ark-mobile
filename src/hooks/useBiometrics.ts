import { useState, useEffect, useCallback } from 'react';
import * as LocalAuthentication from 'expo-local-authentication';
import * as SecureStore from 'expo-secure-store';

const BIOMETRIC_CREDENTIALS_KEY = 'ark_biometric_credentials';
const BIOMETRIC_ENABLED_KEY = 'ark_biometric_enabled';

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
      setIsBiometricAvailable(compatible && enrolled);

      if (compatible && enrolled) {
        const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
        if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
          setBiometricType('Face ID');
        } else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
          setBiometricType('Touch ID');
        }
      }

      // Check if user has enabled biometrics
      const enabled = await SecureStore.getItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(enabled === 'true');
    } catch (error) {
      console.error('Biometric check failed:', error);
    }
  };

  const enableBiometrics = useCallback(async (email: string, password: string) => {
    try {
      await SecureStore.setItemAsync(
        BIOMETRIC_CREDENTIALS_KEY,
        JSON.stringify({ email, password })
      );
      await SecureStore.setItemAsync(BIOMETRIC_ENABLED_KEY, 'true');
      setIsBiometricEnabled(true);
      return true;
    } catch (error) {
      console.error('Failed to enable biometrics:', error);
      return false;
    }
  }, []);

  const disableBiometrics = useCallback(async () => {
    try {
      await SecureStore.deleteItemAsync(BIOMETRIC_CREDENTIALS_KEY);
      await SecureStore.deleteItemAsync(BIOMETRIC_ENABLED_KEY);
      setIsBiometricEnabled(false);
      return true;
    } catch (error) {
      console.error('Failed to disable biometrics:', error);
      return false;
    }
  }, []);

  const authenticateWithBiometrics = useCallback(async (): Promise<{ email: string; password: string } | null> => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Autenticar com biometria',
        cancelLabel: 'Cancelar',
        disableDeviceFallback: false,
        fallbackLabel: 'Usar senha',
      });

      if (result.success) {
        const raw = await SecureStore.getItemAsync(BIOMETRIC_CREDENTIALS_KEY);
        if (raw) {
          return JSON.parse(raw);
        }
      }
      return null;
    } catch (error) {
      console.error('Biometric auth failed:', error);
      return null;
    }
  }, []);

  return {
    isBiometricAvailable,
    isBiometricEnabled,
    biometricType,
    enableBiometrics,
    disableBiometrics,
    authenticateWithBiometrics,
  };
}
