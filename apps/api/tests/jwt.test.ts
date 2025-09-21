import { describe, it, expect, beforeEach } from '@jest/globals';
import { JWTService } from '../src/utils/jwt.js';

// Mock environment variables
process.env.JWT_SECRET = 'test-jwt-secret-key';

describe('JWTService', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    role: 'CUSTOMER' as const
  };

  describe('generateAccessToken', () => {
    it('should generate a valid access token', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate a valid refresh token', () => {
      const token = JWTService.generateRefreshToken(mockPayload);
      
      expect(typeof token).toBe('string');
      expect(token.length).toBeGreaterThan(0);
    });
  });

  describe('generateTokenPair', () => {
    it('should generate both access and refresh tokens', () => {
      const tokens = JWTService.generateTokenPair(mockPayload);
      
      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');
    });
  });

  describe('verifyAccessToken', () => {
    it('should verify a valid access token', () => {
      const token = JWTService.generateAccessToken(mockPayload);
      const decoded = JWTService.verifyAccessToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid token', () => {
      expect(() => JWTService.verifyAccessToken('invalid-token'))
        .toThrow();
    });
  });

  describe('verifyRefreshToken', () => {
    it('should verify a valid refresh token', () => {
      const token = JWTService.generateRefreshToken(mockPayload);
      const decoded = JWTService.verifyRefreshToken(token);
      
      expect(decoded.userId).toBe(mockPayload.userId);
      expect(decoded.email).toBe(mockPayload.email);
      expect(decoded.role).toBe(mockPayload.role);
    });

    it('should throw error for invalid refresh token', () => {
      expect(() => JWTService.verifyRefreshToken('invalid-token'))
        .toThrow();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from valid Authorization header', () => {
      const token = JWTService.extractTokenFromHeader('Bearer valid-token');
      expect(token).toBe('valid-token');
    });

    it('should throw error for missing Authorization header', () => {
      expect(() => JWTService.extractTokenFromHeader(undefined))
        .toThrow('Authorization header is required');
    });

    it('should throw error for invalid header format', () => {
      expect(() => JWTService.extractTokenFromHeader('Invalid valid-token'))
        .toThrow('Invalid authorization header format');
    });
  });
});