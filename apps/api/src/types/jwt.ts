export interface JWTPayload {
    userId: string;
    email: string;
    role: 'CUSTOMER' | 'RIDER' | 'VENDOR' | 'ADMIN';
    iat?: number;
    exp?: number;
}

export interface TokenPair {
    accessToken: string;
    refreshToken: string;
}