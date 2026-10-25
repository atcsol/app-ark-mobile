import * as SecureStore from 'expo-secure-store';
import { STORAGE_KEYS, BIOMETRIC_STORAGE_KEYS, BIOMETRIC_ENABLED_VALUE } from './constants';

// Token operations
export const saveToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const getToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};

export const deleteToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.AUTH_TOKEN);
};

// Refresh token operations
export const saveRefreshToken = async (token: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
};

export const deleteRefreshToken = async (): Promise<void> => {
  await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
};

// User data operations
export const saveUserData = async (data: Record<string, unknown>): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
};

export const getUserData = async (): Promise<Record<string, unknown> | null> => {
  const raw = await SecureStore.getItemAsync(STORAGE_KEYS.USER_DATA);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

// User type operations
export const saveUserType = async (userType: string): Promise<void> => {
  await SecureStore.setItemAsync(STORAGE_KEYS.USER_TYPE, userType);
};

export const getUserType = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(STORAGE_KEYS.USER_TYPE);
};

// Clear all stored data
export const clearAll = async (): Promise<void> => {
  await Promise.all(
    Object.values(STORAGE_KEYS).map((key) => SecureStore.deleteItemAsync(key))
  );
};

// Remove biometric login credentials (every keychain variant, protected or legacy)
export const clearBiometricCredentials = async (): Promise<void> => {
  await Promise.all(
    Object.values(BIOMETRIC_STORAGE_KEYS).map((key) => SecureStore.deleteItemAsync(key))
  );
};

// Runs at app start so legacy unprotected credentials are wiped even if the user never
// opens the login or profile screens again
export const wipeLegacyBiometricCredentials = async (): Promise<void> => {
  const marker = await SecureStore.getItemAsync(BIOMETRIC_STORAGE_KEYS.ENABLED);
  if (marker !== BIOMETRIC_ENABLED_VALUE) {
    await clearBiometricCredentials();
  }
};
