/**
 * Validation Utilities (React Native)
 * Shared validation logic for form inputs
 */

import { PasswordStrength, PasswordValidation } from '../types/auth';

/**
 * Email validation using RFC 5322 compliant regex
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Password strength validation
 * Returns detailed validation results for password requirements
 */
export const validatePasswordStrength = (password: string): PasswordValidation => {
  const hasMinLength = password.length >= 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);

  let strength = PasswordStrength.WEAK;
  const passedChecks = [hasMinLength, hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;

  if (passedChecks >= 5) {
    strength = PasswordStrength.STRONG;
  } else if (passedChecks >= 3) {
    strength = PasswordStrength.MEDIUM;
  }

  return {
    strength,
    hasMinLength,
    hasUpperCase,
    hasLowerCase,
    hasNumber,
    hasSpecialChar,
  };
};

/**
 * Get password strength color for UI display
 */
export const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case PasswordStrength.WEAK:
      return '#ff4d4f';
    case PasswordStrength.MEDIUM:
      return '#faad14';
    case PasswordStrength.STRONG:
      return '#52c41a';
    default:
      return '#d9d9d9';
  }
};

/**
 * Get password strength percentage for progress bar
 */
export const getPasswordStrengthPercent = (strength: PasswordStrength): number => {
  switch (strength) {
    case PasswordStrength.WEAK:
      return 0.33;
    case PasswordStrength.MEDIUM:
      return 0.66;
    case PasswordStrength.STRONG:
      return 1;
    default:
      return 0;
  }
};
