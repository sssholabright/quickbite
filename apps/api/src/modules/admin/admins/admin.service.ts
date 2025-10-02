import { logger } from '../../../utils/logger.js';
import { JWTService } from '../../../utils/jwt.js';
import { PasswordService } from '../../../utils/password.js';
import { CustomError } from '../../../middlewares/errorHandler.js';
import { prisma } from '../../../config/db.js';
import { AdminLoginCredentials, AdminAuthResult, ADMIN_ROLES, AdminRoleType } from '../../../types/admin/admin.js';

export class AdminService {
    // Admin login - authenticate and return JWT with permissions
    static async login(credentials: AdminLoginCredentials): Promise<AdminAuthResult> {
        try {
            // Find user with admin role
            const user = await prisma.user.findUnique({
                where: { email: credentials.email },
                include: {
                    admin: true
                }
            })

            // Check if user exists and is an admin
            if (!user || user.role !== 'ADMIN') {
                throw new CustomError('Invalid Credentials', 401);
            }

            // Check if admin profile exists
            if (!user.admin) {
                throw new CustomError('Admin profile not found', 404);
            }

            // Check if admin is active
            if (!user.isActive) {
                throw new CustomError('Admin account is deactivated', 403);
            }

            // Verify password
            const isPasswordValid = await PasswordService.verifyPassword(
                credentials.password,
                user.password
            )

            if (!isPasswordValid) {
                throw new CustomError('Invalid email or password', 401);
            }

            // Get admin role and permissions
            const adminRole = this.determineAdminRole(user.admin.permissions);
            const permissions = user.admin.permissions;

            // Generate tokens
            const tokens = JWTService.generateTokenPair({
                userId: user.id,
                email: user.email,
                role: 'ADMIN',
                adminRole,
                permissions
            })

            logger.info(`Admin logged in successfully: ${user.email} (${adminRole})`);

            return {
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    avatar: user.avatar,
                    role: 'ADMIN',
                    adminRole: adminRole as AdminRoleType,
                    permissions,
                    isActive: user.isActive,
                    createdAt: user.createdAt.toISOString(),
                    updatedAt: user.updatedAt.toISOString(),
                    admin: {
                        id: user.admin.id,
                        userId: user.admin.userId,
                        permissions: user.admin.permissions,
                        createdAt: user.admin.createdAt.toISOString(),
                        updatedAt: user.admin.updatedAt.toISOString()
                    }
                },
                tokens
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            logger.error({ error }, 'Admin login error');
            throw new CustomError('An error occurred during login', 500);
        }
    }

    // Create new admin user
    static async createAdmin(data: {
        email: string;
        password: string;
        name: string;
        phone: string;
        adminRole: AdminRoleType;
        permissions?: string[];
    }): Promise<any> {
        try {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: data.email }
            });

            if (existingUser) {
                throw new CustomError('Admin with this email already exists', 409);
            }

            // Check if phone already exists
            const existingPhone = await prisma.user.findUnique({
                where: { phone: data.phone }
            });

            if (existingPhone) {
                throw new CustomError('Admin with this phone number already exists', 409);
            }

            // Validate password strength
            const passwordValidation = PasswordService.validatePasswordStrength(data.password);
            if (!passwordValidation.isValid) {
                throw new CustomError(`Password validation failed: ${passwordValidation.errors.join(', ')}`, 400);
            }

            // Hash password
            const hashedPassword = await PasswordService.hashPassword(data.password);

            // Get permissions based on admin role
            const permissions = data.permissions || this.getPermissionsForRole(data.adminRole);

            // Create admin user
            const user = await prisma.user.create({
                data: {
                    email: data.email,
                    password: hashedPassword,
                    name: data.name,
                    phone: data.phone,
                    role: 'ADMIN',
                    isActive: true,
                    admin: {
                        create: {
                            permissions
                        }
                    }
                },
                include: {
                    admin: true
                }
            });

            logger.info(`Admin created successfully: ${user.email} (${data.adminRole})`);

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                role: 'ADMIN',
                adminRole: data.adminRole,
                permissions,
                isActive: user.isActive,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString()
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            logger.error({ error }, 'Create admin error');
            throw new CustomError('Failed to create admin', 500);
        }
    }

    // Get permissions for a specific admin role
    private static getPermissionsForRole(adminRole: AdminRoleType): string[] {
        switch (adminRole) {
            case 'SUPER_ADMIN':
                return ADMIN_ROLES.SUPER_ADMIN.permissions as unknown as string[];
            case 'OPS_MANAGER':
                return ADMIN_ROLES.OPS_MANAGER.permissions as unknown as string[];
            case 'SUPPORT_STAFF':
                return ADMIN_ROLES.SUPPORT_STAFF.permissions as unknown as string[];
            default:
                return ADMIN_ROLES.SUPPORT_STAFF.permissions as unknown as string[]; // Default to support staff permissions
        }
    }
    

    // Determine admin role based on permissions
    private static determineAdminRole(permissions: string[]): string {
        // Check if permissions match Super Admin
        const superAdminPermissions = ADMIN_ROLES.SUPER_ADMIN.permissions;
        const hasSuperAdminPermissions = superAdminPermissions.every(permission => permissions.includes(permission));
        if (hasSuperAdminPermissions) {
            return 'Super Admin';
        }

        // Check if permissions match Ops Manager
        const opsManagerPerms = ADMIN_ROLES.OPS_MANAGER.permissions;
        const hasOpsManagerPerms = opsManagerPerms.every(perm => permissions.includes(perm));
        if (hasOpsManagerPerms) {
            return 'Ops Manager';
        }

        // Check if permissions match Support Staff
        const supportStaffPerms = ADMIN_ROLES.SUPPORT_STAFF.permissions;
        const hasSupportStaffPerms = supportStaffPerms.every(perm => permissions.includes(perm));
        if (hasSupportStaffPerms) {
            return 'Support Staff';
        }

        // Default to Custom Role if no match
        return 'Custom Role';
    }

    // Get admin profile
    static async getProfile(userId: string): Promise<any> {
        try {
            const user = await prisma.user.findUnique({
                where: { id: userId },
                include: {
                    admin: true
                }
            });

            if (!user || user.role !== 'ADMIN') {
                throw new CustomError('Admin not found', 404);
            }

            if (!user.admin) {
                throw new CustomError('Admin profile not found', 404);
            }

            const adminRole = this.determineAdminRole(user.admin.permissions);

            return {
                id: user.id,
                email: user.email,
                name: user.name,
                phone: user.phone,
                avatar: user.avatar,
                role: 'ADMIN',
                adminRole,
                permissions: user.admin.permissions,
                isActive: user.isActive,
                createdAt: user.createdAt.toISOString(),
                updatedAt: user.updatedAt.toISOString(),
                admin: {
                    id: user.admin.id,
                    userId: user.admin.userId,
                    permissions: user.admin.permissions,
                    createdAt: user.admin.createdAt.toISOString(),
                    updatedAt: user.admin.updatedAt.toISOString()
                }
            };
        } catch (error) {
            if (error instanceof CustomError) {
                throw error;
            }
            logger.error({ error }, 'Get admin profile error');
            throw new CustomError('Failed to get admin profile', 500);
        }
    }

    // Check if admin has specific permission
    static hasPermission(adminPermissions: string[], requiredPermission: string): boolean {
        return adminPermissions.includes(requiredPermission);
    }

    // Check if admin has all required permissions
    static hasAllPermissions(adminPermissions: string[], requiredPermissions: string[]): boolean {
        return requiredPermissions.every(perm => adminPermissions.includes(perm));
    }

    // Check if admin has any of the required permissions
    static hasAnyPermission(adminPermissions: string[], requiredPermissions: string[]): boolean {
        return requiredPermissions.some(perm => adminPermissions.includes(perm));
    }
}