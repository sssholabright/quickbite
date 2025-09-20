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
        role: string;
        isActive: boolean;
    };
    tokens: {
        accessToken: string;
        refreshToken: string;
    };
}