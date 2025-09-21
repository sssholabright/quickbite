import { logger } from './../../utils/logger.js';
import { JWTService } from './../../utils/jwt.js';
import { PasswordService } from './../../utils/password.js';
import { CustomError } from './../../middlewares/errorHandler.js';
import { prisma } from './../../config/db.js';
import { AuthResult, RegisterData, LoginCredentials, UpdateUser } from './../../types/auth.js';

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

            // Check if phone already exists
            const existingPhone = await prisma.user.findUnique({
                where: { phone: data.phone }
            });

            if (existingPhone) {
                throw new CustomError('User with this phone number already exists', 409);
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
        } catch (error: any) {
            logger.error({ error }, 'Registration error')
            if (error instanceof CustomError) {
                throw error;
            }
            
            // Handle Prisma unique constraint errors
            if (error.code === 'P2002') {
                const target = error.meta?.target;
                if (target?.includes('email')) {
                    throw new CustomError('User with this email already exists', 409);
                }
                if (target?.includes('phone')) {
                    throw new CustomError('User with this phone number already exists', 409);
                }
                throw new CustomError('User with this information already exists', 409);
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

    // Get user profile by ID
    static async getUserProfile(userId: string): Promise<any> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
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

            // Check if user is active
            const isActive = this.checkUserActiveStatus(user);
            if (!isActive) {
                throw new CustomError('Account is deactivated', 403);
            }

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
                role: user.role,
                isActive,
                createdAt: user.createdAt,
                updatedAt: user.updatedAt,
                // Include role-specific data
                ...(user.customer && { customer: user.customer }),
                ...(user.rider && { rider: user.rider }),
                ...(user.vendor && { vendor: user.vendor }),
                ...(user.admin && { admin: user.admin })
            };
        } catch (error: any) {
            logger.error({ error }, 'Get user profile error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to get user profile', 500);
        }
    }

    // Update user profile
    static async updateUserProfile(userId: string, updateData: UpdateUser): Promise<any> {
        try {
            // Check if user exists
            const existingUser = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!existingUser) {
                throw new CustomError('User not found', 404);
            }

            // Check if phone is being updated and if it's already taken
            if (updateData.phone && updateData.phone !== existingUser.phone) {
                const phoneExists = await prisma.user.findUnique({
                    where: { phone: updateData.phone }
                });

                if (phoneExists) {
                    throw new CustomError('Phone number already in use', 409);
                }
            }

            // Update user profile
            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: {
                    ...(updateData.name && { name: updateData.name }),
                    ...(updateData.phone && { phone: updateData.phone }),
                    ...(updateData.avatar && { avatar: updateData.avatar }),
                },
                include: {
                    customer: true,
                    rider: true,
                    vendor: true,
                    admin: true
                }
            });

            // Check if user is active
            const isActive = this.checkUserActiveStatus(updatedUser);
            if (!isActive) {
                throw new CustomError('Account is deactivated', 403);
            }

            logger.info(`User profile updated: ${updatedUser.email}`);

            return {
                id: updatedUser.id,
                email: updatedUser.email,
                name: updatedUser.name,
                phone: updatedUser.phone,
                avatar: updatedUser.avatar,
                role: updatedUser.role,
                isActive,
                createdAt: updatedUser.createdAt,
                updatedAt: updatedUser.updatedAt,
                // Include role-specific data
                ...(updatedUser.customer && { customer: updatedUser.customer }),
                ...(updatedUser.rider && { rider: updatedUser.rider }),
                ...(updatedUser.vendor && { vendor: updatedUser.vendor }),
                ...(updatedUser.admin && { admin: updatedUser.admin })
            };
        } catch (error: any) {
            logger.error({ error }, 'Update user profile error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to update user profile', 500);
        }
    }

    // Change user password
    static async changePassword(userId: string, passwordData: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<void> {
        try {
            // Find user
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                throw new CustomError('User not found', 404);
            }

            // Verify current password
            const isCurrentPasswordValid = await PasswordService.verifyPassword(
                passwordData.currentPassword, 
                user.password
            );

            if (!isCurrentPasswordValid) {
                throw new CustomError('Current password is incorrect', 400);
            }

            // Validate new password strength
            const passwordValidation = PasswordService.validatePasswordStrength(passwordData.newPassword);
            if (!passwordValidation.isValid) {
                throw new CustomError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
            }

            // Hash new password
            const hashedNewPassword = await PasswordService.hashPassword(passwordData.newPassword);

            // Update password
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedNewPassword }
            });

            logger.info(`Password changed for user: ${user.email}`);
        } catch (error: any) {
            logger.error({ error }, 'Change password error');
            if (error instanceof CustomError) {
                throw error;
            }
            throw new CustomError('Failed to change password', 500);
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