import { logger } from './../../utils/logger.js';
import { JWTService } from './../../utils/jwt.js';
import { PasswordService } from './../../utils/password.js';
import { CustomError } from './../../middlewares/errorHandler.js';
import { prisma } from './../../config/db.js';
import { AuthResult, RegisterData, LoginCredentials } from './../../types/auth.js';

export class AuthService {
    // Register new user
    static async register(data: RegisterData): Promise<AuthResult> {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                throw new CustomError('User with this email already exists', 409);
            }

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(data.password);
            if (!passwordValidation.isValid) {
                throw new CustomError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
            }

            // Hash password
            const hashedPassword = await PasswordService.hashPassword(data.password);

            // Create user based on role
            let user;
            switch (data.role) {
                case 'CUSTOMER':
                    user = await prisma.user.create({
                        data: {
                            email: data.email,
                            password: hashedPassword,
                            name: data.name,
                            phone: data.phone,
                            role: 'CUSTOMER',
                            customer: {
                                create: {
                                    id: crypto.randomUUID()
                                }
                            }
                        },
                        include: {
                            customer: true
                        }
                    });
                    break;
                case 'RIDER':
                    user = await prisma.user.create({
                        data: {
                            email: data.email,
                            password: hashedPassword,
                            name: data.phone,
                            role: 'RIDER',
                            rider: {
                                create: {
                                    id: crypto.randomUUID(),
                                    vehicleType: 'MOTORCYCLE', // Default, can be updated later
                                    isOnline: false
                                }
                            }
                        },
                        include: {
                            rider: true
                        }
                    });
                    break;
                case 'VENDOR':
                    user = await prisma.user.create({
                        data: {
                            email: data.email,
                            password: hashedPassword,
                            name: data.name,
                            phone: data.phone,
                            role: 'VENDOR',
                            vendor: {
                                create: {
                                    businessName: data.name // Use the user's name as business name
                                }
                            }
                        },
                        include: {
                            vendor: true
                        }
                    });
                    break;

                default:
                    throw new CustomError('Invalid user role', 400)
            }

            // Generate tokens
            const tokens = JWTService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: user.role as 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN'
            });

            logger.info(`New user registered: ${user.email} (${user.role})`);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                    isActive: true
                },
                tokens
            };
        } catch (error) {
            logger.error({ error }, 'Registration error')
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Registration failed', 500);
        }
    }

    // Login user
    static async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            // Find user by email
            const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                include: {
                    customer: true,
                    rider: true,
                    vendor: true,
                    admin: true
                }
            });

            if (!user) {
                throw new CustomError('Invalid email or password', 401);
            }

            // Verify password
            const isPasswordValid = await PasswordService.verifyPassword(credentials.password, user.password);
            if (!isPasswordValid) {
                throw new CustomError('Invalid email or password', 401);
            }

            // Check if user is active
            const isActive = this.checkUserActiveStatus(user);
            if (!isActive) {
                throw new CustomError('Account is deactivated', 403);
            }

            // Generate tokens
            const tokens = JWTService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: user.role as 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN'
            });

            logger.info(`User logged in: ${user.email} (${user.role})`);

            return {
                user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                isActive
            },
            tokens
        };
        } catch (error) {
            logger.error({ error }, 'Login error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Login failed', 500);
        }
    }

    // Refresh access token
    static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            // Verify refresh token
            const payload = JWTService.verifyRefreshToken(refreshToken);

            // Find user to ensure they still exist and are active
            const user = await prisma.user.findUnique({
                where: { id: payload.userId },
                include: {
                    customer: true,
                    rider: true,
                    vendor: true,
                    admin: true
                }
            });

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            const isActive = this.checkUserActiveStatus(user);
            if (!isActive) {
                throw new CustomError('Account is deactivated', 403);
            }

            // Generate new access token
            const accessToken = JWTService.generateAccessToken({
                userId: user.id,
                email: user.email,
                role: user.role as 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN'
            });

            return { accessToken };
        } catch (error) {
            logger.error({ error }, 'Token refresh error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Token refresh failed', 500);
        }
    }

    // Logout user (invalidate tokens)
    static async logout(userId: string): Promise<void> {
        try {
            // In a real app, you might want to store invalidated tokens in Redis
            // For now, we'll just log the logout
            logger.info(`User logged out: ${userId}`);
        } catch (error) {
            logger.error({ error }, 'Logout error');
            throw new CustomError('Logout failed', 500);
        }
    }

    // Check if user is active based on their role
    private static checkUserActiveStatus(user: any): boolean {
        switch (user.role) {
            case 'CUSTOMER':
                return user?.isActive ?? false;
            case 'RIDER':
                return user?.isActive ?? false;
            case 'VENDOR':
                return user?.isActive ?? false;
            case 'ADMIN':
                return user?.isActive ?? false;
            default:
                return false;
            }
    }
}