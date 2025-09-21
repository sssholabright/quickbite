// apps/api/tests/auth.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { AuthService } from '../src/modules/auth/auth.service.js';
import { prisma } from './setup.js';
import { CustomError } from '../src/middlewares/errorHandler.js';

describe('AuthService', () => {
  afterEach(async () => {
    // Clean up after each test
    await prisma.user.deleteMany();
  });

  describe('register', () => {
    it('should register a new customer successfully', async () => {
      const userData = {
        email: 'customer@test.com',
        password: 'Password123!',
        name: 'John Doe',
        phone: '+2348012345678',
        role: 'CUSTOMER' as const
      };

      const result = await AuthService.register(userData);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(userData.email);
      expect(result.user.name).toBe(userData.name);
      expect(result.user.role).toBe('CUSTOMER');
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should register a new vendor successfully', async () => {
      const userData = {
        email: 'vendor@test.com',
        password: 'Password123!',
        name: 'Jane Smith',
        phone: '+2348012345679',
        role: 'VENDOR' as const
      };

      const result = await AuthService.register(userData);

      expect(result.user.role).toBe('VENDOR');
      expect(result.tokens).toHaveProperty('accessToken');
    });

    it('should throw error if user already exists', async () => {
      const userData = {
        email: 'existing@test.com',
        password: 'Password123!',
        name: 'Existing User',
        phone: '+2348012345681',
        role: 'CUSTOMER' as const
      };

      // Register first time
      await AuthService.register(userData);

      // Try to register again
      await expect(AuthService.register(userData))
        .rejects
        .toThrow(CustomError);
    });

    it('should throw error for weak password', async () => {
      const userData = {
        email: 'weak@test.com',
        password: 'weak',
        name: 'Weak User',
        phone: '+2348012345682',
        role: 'CUSTOMER' as const
      };

      await expect(AuthService.register(userData))
        .rejects
        .toThrow(CustomError);
    });
  });

  describe('login', () => {
    beforeEach(async () => {
      // Create a test user for login tests
      await AuthService.register({
        email: 'login@test.com',
        password: 'Password123!',
        name: 'Login User',
        phone: '+2348012345684',
        role: 'CUSTOMER'
      });
    });

    it('should login with valid credentials', async () => {
      const credentials = {
        email: 'login@test.com',
        password: 'Password123!'
      };

      const result = await AuthService.login(credentials);

      expect(result).toHaveProperty('user');
      expect(result).toHaveProperty('tokens');
      expect(result.user.email).toBe(credentials.email);
      expect(result.tokens).toHaveProperty('accessToken');
      expect(result.tokens).toHaveProperty('refreshToken');
    });

    it('should throw error for invalid email', async () => {
      const credentials = {
        email: 'nonexistent@test.com',
        password: 'Password123!'
      };

      await expect(AuthService.login(credentials))
        .rejects
        .toThrow(CustomError);
    });

    it('should throw error for invalid password', async () => {
      const credentials = {
        email: 'login@test.com',
        password: 'WrongPassword123!'
      };

      await expect(AuthService.login(credentials))
        .rejects
        .toThrow(CustomError);
    });
  });

  describe('refreshToken', () => {
    let refreshToken: string;

    beforeEach(async () => {
      const result = await AuthService.register({
        email: 'refresh@test.com',
        password: 'Password123!',
        name: 'Refresh User',
        phone: '+2348012345685',
        role: 'CUSTOMER'
      });
      refreshToken = result.tokens.refreshToken;
    });

    it('should refresh access token with valid refresh token', async () => {
      const result = await AuthService.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(typeof result.accessToken).toBe('string');
    });

    it('should throw error for invalid refresh token', async () => {
      await expect(AuthService.refreshToken('invalid-token'))
        .rejects
        .toThrow(CustomError);
    });
  });

  describe('logout', () => {
    it('should logout successfully', async () => {
      const result = await AuthService.register({
        email: 'logout@test.com',
        password: 'Password123!',
        name: 'Logout User',
        phone: '+2348012345686',
        role: 'CUSTOMER'
      });

      const userId = result.user.id;

      // Should not throw error
      await expect(AuthService.logout(userId))
        .resolves
        .toBeUndefined();
    });
  });
});