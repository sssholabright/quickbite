export interface LoginCredentials {
    email: string;
    password: string;
}
  
export interface RegisterData {
    email: string;
    password: string;
    name: string;
    phone: string;
    role: 'CUSTOMER' | 'RIDER' | 'VENDOR';
}
  
export interface AuthResult {
    user: {
        id: string;
        email: string;
        name: string;
        phone: string;
        avatar?: string;
        role: string;
        isActive: boolean;
        createdAt: string;
        updatedAt: string;
        rider?: {
            id: string;
            userId: string;
            vehicleType: string;
            isOnline: boolean;
            isAvailable: boolean;
            currentLat: number | null;
            currentLng: number | null;
            bankAccount: string | null;
            earnings: number;
            completedOrders: number;
            rating: number;
            createdAt: string;
            updatedAt: string;
        };
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}

export interface UpdateUser {
    name?: string | undefined;
    phone?: string | undefined;
    avatar?: string | undefined;
    currentLat?: number | undefined;
    currentLng?: number | undefined;
}