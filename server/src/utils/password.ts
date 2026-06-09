import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
}

export function validatePassword(password: string): PasswordValidationResult {
  const errors: string[] = [];
  const policy = env.passwordPolicy;

  if (password.length < policy.minLength) {
    errors.push(`Password must be at least ${policy.minLength} characters`);
  }
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Password must include an uppercase letter');
  }
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Password must include a lowercase letter');
  }
  if (policy.requireNumber && !/\d/.test(password)) {
    errors.push('Password must include a number');
  }
  if (policy.requireSpecial && !/[!@#$%^&*(),.?":{}|<>_\-+=[\]\\;/]/.test(password)) {
    errors.push('Password must include a special character');
  }

  return { valid: errors.length === 0, errors };
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
