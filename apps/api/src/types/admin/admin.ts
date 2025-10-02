export interface AdminRole {
    id: string;
    name: string;
    permissions: string[];
}

export interface AdminLoginCredentials {
    email: string;
    password: string;
}

export interface CreateAdminData {
    email: string;
    password: string;
    name: string;
    phone: string;
    adminRole: AdminRoleType;
    permissions?: string[];
}

export interface AdminAuthResult {
    user: {
        id: string;
        email: string;
        name: string;
        phone: string | null;
        avatar: string | null;
        role: 'ADMIN';
        adminRole: AdminRoleType; // e.g., 'Super Admin', 'Ops Manager', 'Support Staff'
        permissions: string[]; // e.g., ['orders.read', 'orders.write', 'customers.read']
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        admin?: {
            id: string;
            userId: string;
            permissions: string[];
            createdAt: string;
            updatedAt: string;
        };
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface AdminProfile {
    id: string;
    email: string;
    name: string;
    phone: string | null;
    avatar: string | null;
    role: 'ADMIN';
    adminRole: string;
    permissions: string[];
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    admin?: {
        id: string;
        userId: string;
        permissions: string[];
        createdAt: string;
        updatedAt: string;
    };
}

export interface CreateAdminData {
    email: string;
    password: string;
    name: string;
    phone: string;
    adminRole: AdminRoleType;
    permissions?: string[];
}

export interface AdminPermissions {
    // Dashboard
    'dashboard.read': boolean;
    'dashboard.write': boolean;
    
    // Activity Feed
    'activity.read': boolean;
    'activity.write': boolean;
    
    // Analytics
    'analytics.read': boolean;
    'analytics.write': boolean;
    
    // Orders
    'orders.read': boolean;
    'orders.write': boolean;
    'orders.delete': boolean;
    'orders.refund': boolean;
    
    // Riders
    'riders.read': boolean;
    'riders.write': boolean;
    'riders.suspend': boolean;
    'riders.delete': boolean;
    
    // Logistics Companies
    'logistics.read': boolean;
    'logistics.write': boolean;
    'logistics.suspend': boolean;
    'logistics.block': boolean;
    
    // Vendors
    'vendors.read': boolean;
    'vendors.write': boolean;
    'vendors.approve': boolean;
    'vendors.suspend': boolean;
    'vendors.delete': boolean;
    
    // Customers
    'customers.read': boolean;
    'customers.write': boolean;
    'customers.ban': boolean;
    'customers.delete': boolean;
    
    // Payments
    'payments.read': boolean;
    'payments.write': boolean;
    'payments.refund': boolean;
    'payments.payout': boolean;
    
    // Notifications
    'notifications.read': boolean;
    'notifications.send': boolean;
    'notifications.broadcast': boolean;
    
    // Reports
    'reports.read': boolean;
    'reports.export': boolean;
    
    // Settings
    'settings.read': boolean;
    'settings.write': boolean;
    
    // Audit
    'audit.read': boolean;
}

export type AdminPermissionKey = keyof AdminPermissions;

// Predefined roles with their permissions
export const ADMIN_ROLES = {
    SUPER_ADMIN: {
        name: 'Super Admin',
        permissions: [
            // Full access to everything
            'dashboard.read', 'dashboard.write',
            'activity.read', 'activity.write',
            'analytics.read', 'analytics.write',
            'orders.read', 'orders.write', 'orders.delete', 'orders.refund',
            'riders.read', 'riders.write', 'riders.suspend', 'riders.delete',
            'logistics.read', 'logistics.write', 'logistics.suspend', 'logistics.block',
            'vendors.read', 'vendors.write', 'vendors.approve', 'vendors.suspend', 'vendors.delete',
            'customers.read', 'customers.write', 'customers.ban', 'customers.delete',
            'payments.read', 'payments.write', 'payments.refund', 'payments.payout',
            'notifications.read', 'notifications.send', 'notifications.broadcast',
            'reports.read', 'reports.export',
            'settings.read', 'settings.write',
            'audit.read'
        ]
    },
    OPS_MANAGER: {
        name: 'Ops Manager',
        permissions: [
            // Orders & riders management
            'dashboard.read', 'dashboard.write',
            'activity.read', 'activity.write',
            'analytics.read', 'analytics.write',
            'orders.read', 'orders.write', 'orders.refund',
            'riders.read', 'riders.write', 'riders.suspend',
            'logistics.read', 'logistics.write', 'logistics.suspend',
            'vendors.read', 'vendors.write',
            'customers.read',
            'payments.read',
            'notifications.read', 'notifications.send',
            'reports.read', 'reports.export',
            'audit.read'
        ]
    },
    SUPPORT_STAFF: {
        name: 'Support Staff',
        permissions: [
            // Customer support & basic order management
            'dashboard.read', 'dashboard.write',
            'activity.read', 'activity.write',
            'analytics.read', 'analytics.write',
            'orders.read', 'orders.write',
            'customers.read', 'customers.write',
            'vendors.read',
            'riders.read',
            'logistics.read',
            'notifications.read', 'notifications.send',
            'reports.read'
        ]
    }
} as const;

export type AdminRoleType = keyof typeof ADMIN_ROLES;