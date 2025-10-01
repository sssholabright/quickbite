export interface LoginCredentials {
    email: string;
    password: string;
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
  
export interface User {
    id: string;
    email: string;
    name: string;
    phone: string;
    role: string;
    isActive: boolean;
    avatar?: string;
    createdAt: string;
    updatedAt: string;
    rider?: {
        id: string;
        userId: string;
        vehicleType: string;
        isOnline: boolean;
        currentLat: number | null;
        currentLng: number | null;
        bankAccount: string | null;
        earnings: number;
        completedOrders: number;
        rating: number;
        createdAt: string;
        updatedAt: string;
    };
}
  
export interface AuthState {
    user: User | null;
    tokens: {
        accessToken: string | null;
        refreshToken: string | null;
    };
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
}
  
export interface ApiError {
    success: false;
    message: string;
    errors?: string;
}

export interface ChangePasswordData {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}