import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { Request, Response, NextFunction } from 'express';
import { AuthController } from '../src/modules/auth/auth.controller.js';

// Mock the auth service
jest.mock('../src/modules/auth/auth.service.js', () => ({
  AuthService: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    logout: jest.fn()
  }
}));

// Helper to create a mock Response object with correct typing
function createMockResponse(): Response {
  // Create an object with all required methods/properties stubbed
  const res = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    sendStatus: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    set: jest.fn().mockReturnThis(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    get: jest.fn(),
    locals: {},
    // Add any other properties/methods you need for your tests
  } as unknown as Response;
  return res;
}

describe('AuthController', () => {
  let mockReq: Partial<Request>;
  let mockRes: Response;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      body: {},
      user: { userId: 'test-user-id', role: 'CUSTOMER', email: "ar@gmail.com" }
    };
    mockRes = createMockResponse();
    mockNext = jest.fn();
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      const { AuthService } = await import('../src/modules/auth/auth.service.js');
      const mockUserData = {
        email: 'test@example.com',
        password: 'Password123!',
        name: 'Test User',
        phone: '+2348012345678',
        role: 'CUSTOMER' as const
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: mockUserData.email,
          name: mockUserData.name,
          role: mockUserData.role,
          isActive: true
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      };

      (AuthService.register as jest.MockedFunction<typeof AuthService.register>).mockResolvedValue(mockResult);
      mockReq.body = mockUserData;

      await AuthController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(AuthService.register).toHaveBeenCalledWith(mockUserData);
      expect(mockRes.status).toHaveBeenCalledWith(201);
    });

    it('should handle validation errors', async () => {
      const { AuthService } = await import('../src/modules/auth/auth.service.js');
      const invalidData = {
        email: 'invalid-email',
        password: 'weak',
        name: '',
        phone: '123',
        role: 'INVALID' as any
      };

      (AuthService.register as jest.MockedFunction<typeof AuthService.register>).mockRejectedValue(new Error('Validation failed'));
      mockReq.body = invalidData;

      await AuthController.register(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const { AuthService } = await import('../src/modules/auth/auth.service.js');
      const mockCredentials = {
        email: 'test@example.com',
        password: 'Password123!'
      };

      const mockResult = {
        user: {
          id: 'user-id',
          email: mockCredentials.email,
          name: 'Test User',
          role: 'CUSTOMER' as const,
          isActive: true
        },
        tokens: {
          accessToken: 'access-token',
          refreshToken: 'refresh-token'
        }
      };

      (AuthService.login as jest.MockedFunction<typeof AuthService.login>).mockResolvedValue(mockResult);
      mockReq.body = mockCredentials;

      await AuthController.login(mockReq as Request, mockRes as Response, mockNext);

      expect(AuthService.login).toHaveBeenCalledWith(mockCredentials);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      const { AuthService } = await import('../src/modules/auth/auth.service.js');
      const mockRefreshData = {
        refreshToken: 'valid-refresh-token'
      };

      const mockResult = {
        accessToken: 'new-access-token'
      };

      (AuthService.refreshToken as jest.MockedFunction<typeof AuthService.refreshToken>).mockResolvedValue(mockResult);
      mockReq.body = mockRefreshData;

      await AuthController.refreshToken(mockReq as Request, mockRes as Response, mockNext);

      expect(AuthService.refreshToken).toHaveBeenCalledWith(mockRefreshData.refreshToken);
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const { AuthService } = await import('../src/modules/auth/auth.service.js');
      
      (AuthService.logout as jest.MockedFunction<typeof AuthService.logout>).mockResolvedValue(undefined);

      await AuthController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(AuthService.logout).toHaveBeenCalledWith('test-user-id');
      expect(mockRes.status).toHaveBeenCalledWith(200);
    });

    it('should handle logout when user not authenticated', async () => {
      mockReq.user = undefined;

      await AuthController.logout(mockReq as Request, mockRes as Response, mockNext);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        message: 'User not authenticated'
      });
    });
  });
});