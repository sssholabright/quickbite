export interface AdminLoginCredentials {
    email: string
    password: string
}

export interface AdminAuthResult {
    user: {
        id: string
        email: string
        name: string
        phone: string | null
        avatar: string | null
        role: 'ADMIN'
        adminRole: string // e.g., 'Super Admin', 'Ops Manager', 'Support Staff'
        permissions: string[] // e.g., ['orders.read', 'orders.write', 'customers.read']
        isActive: boolean
        createdAt: string
        updatedAt: string
        admin?: {
            id: string
            userId: string
            permissions: string[]
            createdAt: string
            updatedAt: string
        }
    }
    tokens: {
        accessToken: string
        refreshToken: string
    }
}

export interface AdminProfile {
    id: string
    email: string
    name: string
    phone: string | null
    avatar: string | null
    role: 'ADMIN'
    adminRole: string
    permissions: string[]
    isActive: boolean
    createdAt: string
    updatedAt: string
    admin?: {
        id: string
        userId: string
        permissions: string[]
        createdAt: string
        updatedAt: string
    }
}

// Admin permissions interface
export interface AdminPermissions {
    // Orders
    'orders.read': boolean
    'orders.write': boolean
    'orders.delete': boolean
    'orders.refund': boolean
    
    // Riders
    'riders.read': boolean
    'riders.write': boolean
    'riders.suspend': boolean
    'riders.delete': boolean
    
    // Vendors
    'vendors.read': boolean
    'vendors.write': boolean
    'vendors.approve': boolean
    'vendors.suspend': boolean
    'vendors.delete': boolean
    
    // Customers
    'customers.read': boolean
    'customers.write': boolean
    'customers.ban': boolean
    'customers.delete': boolean
    
    // Payments
    'payments.read': boolean
    'payments.write': boolean
    'payments.refund': boolean
    'payments.payout': boolean
    
    // Notifications
    'notifications.read': boolean
    'notifications.send': boolean
    'notifications.broadcast': boolean
    
    // Reports
    'reports.read': boolean
    'reports.export': boolean
    
    // Settings
    'settings.read': boolean
    'settings.write': boolean
    
    // Audit
    'audit.read': boolean
}

export type AdminPermissionKey = keyof AdminPermissions

// Admin role types
export type AdminRoleType = 'Super Admin' | 'Ops Manager' | 'Support Staff' | 'Custom Role'