export interface JWTPayload {
    userId: string;
    email: string;
    role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    adminRole?: string; // NEW: Admin role (e.g., 'Super Admin', 'Ops Manager')
    permissions?: string[]; // NEW: Admin permissions array
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}