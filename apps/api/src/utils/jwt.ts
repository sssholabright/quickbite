import jwt from "jsonwebtoken";
import { env } from './../config/env.js';
import { JWTPayload, TokenPair } from "../types/jwt.js";
import { logger } from './logger.js';

export class JWTService {
    private static readonly ACCESS_TOKEN_EXPIRY = '60m';
    private static readonly REFRESH_TOKEN_EXPIRY = '7d';

    // Generate access token
    static generateAccessToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        try {
            return jwt.sign(payload, env.JWT_SECRET, {
                expiresIn: this.ACCESS_TOKEN_EXPIRY,
                issuer: 'quickbite-api',
                audience: 'quickbite-app'
            });
        } catch (error) {
            logger.error({ error }, 'Error generating access token');
            throw new Error('Failed to generate access token');
        }
    }

    // Generate refresh token
    static generateRefreshToken(payload: Omit<JWTPayload, 'iat' | 'exp'>): string {
        try {
            return jwt.sign(payload, env.JWT_SECRET, {
                expiresIn: this.REFRESH_TOKEN_EXPIRY,
                issuer: 'quickbite-api',
                audience: 'quickbite-app'
            });
        } catch (error) {
            logger.error({ error }, 'Error generating refresh token');
            throw new Error('Failed to generate refresh token');
        }
    }

   // Generate token pair (access + refresh)
    static generateTokenPair(payload: Omit<JWTPayload, 'iat' | 'exp'>): TokenPair {
        return {
            accessToken: this.generateAccessToken(payload),
            refreshToken: this.generateRefreshToken(payload)
        };
    }

    // Verify access token
    static verifyAccessToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET, {
                issuer: 'quickbite-api',
                audience: 'quickbite-app'
            }) as JWTPayload;

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Access token has expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid access token');
            } else {
                logger.error({ error }, 'Error verifying access token');
                throw new Error('Token verification failed');
            }
        }
    }

    // Verify refresh token
    static verifyRefreshToken(token: string): JWTPayload {
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET, {
                issuer: 'quickbite-api',
                audience: 'quickbite-app'
            }) as JWTPayload;

            return decoded;
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) {
                throw new Error('Refresh token has expired');
            } else if (error instanceof jwt.JsonWebTokenError) {
                throw new Error('Invalid refresh token');
            } else {
                logger.error({ error }, 'Error verifying refresh token');
                throw new Error('Token verification failed');
            }
        }
    }

    // Extract token from Authorization header
    static extractTokenFromHeader(authHeader: string | undefined): string {
        if (!authHeader) {
            throw new Error('Authorization header is required');
        }

        const parts = authHeader.split(' ');
        if (parts.length !== 2 || parts[0] !== 'Bearer' || !parts[1]) {
            throw new Error('Invalid authorization header format');
        }

        return parts[1];
    }

    // Decode token without verification (for debugging)
    static decodeToken(token: string): JWTPayload | null {
        try {
            return jwt.decode(token) as JWTPayload;
        } catch (error) {
            logger.error({ error }, 'Error decoding token');
            return null;
        }
    }
}