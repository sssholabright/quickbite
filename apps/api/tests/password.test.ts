import { describe, it, expect } from '@jest/globals';
import { PasswordService } from '../src/utils/password.js';

describe('PasswordService', () => {
  const testPassword = 'TestPassword123!';

  describe('hashPassword', () => {
    it('should hash password successfully', async () => {
      const hash = await PasswordService.hashPassword(testPassword);
      
      expect(typeof hash).toBe('string');
      expect(hash.length).toBeGreaterThan(0);
      expect(hash).not.toBe(testPassword);
    });

    it('should generate different hashes for same password', async () => {
      const hash1 = await PasswordService.hashPassword(testPassword);
      const hash2 = await PasswordService.hashPassword(testPassword);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('should verify correct password', async () => {
      const hash = await PasswordService.hashPassword(testPassword);
      const isValid = await PasswordService.verifyPassword(testPassword, hash);
      
      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const hash = await PasswordService.hashPassword(testPassword);
      const isValid = await PasswordService.verifyPassword('WrongPassword123!', hash);
      
      expect(isValid).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('should validate strong password', () => {
      const result = PasswordService.validatePasswordStrength('StrongPass123!');
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject weak passwords', () => {
      const weakPasswords = [
        'weak',
        '12345678',
        'password',
        'PASSWORD',
        'Password',
        'Password123'
      ];

      weakPasswords.forEach(password => {
        const result = PasswordService.validatePasswordStrength(password);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide specific error messages', () => {
      const result = PasswordService.validatePasswordStrength('weak');
      
      expect(result.errors).toContain('Password must be at least 8 characters long');
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
      expect(result.errors).toContain('Password must contain at least one number');
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });
});