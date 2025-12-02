/**
 * Password validation utility
 * Requirements:
 * - Minimum 8 characters
 * - At least 1 uppercase letter
 * - At least 1 lowercase letter
 * - At least 1 number
 * - At least 1 special character
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

export const validatePassword = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (password.length < 8) {
    errors.push('passwordTooShort');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('passwordNoUppercase');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('passwordNoLowercase');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('passwordNoNumber');
  }

  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('passwordNoSpecialChar');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const getPasswordRequirements = (): string[] => {
  return [
    'passwordRequirementLength',
    'passwordRequirementUppercase',
    'passwordRequirementLowercase',
    'passwordRequirementNumber',
    'passwordRequirementSpecialChar'
  ];
};

