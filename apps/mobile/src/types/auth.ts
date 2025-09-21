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
        role: string;
        isActive: boolean;
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