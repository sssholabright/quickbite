import apiClient from "./api";
import { ApiResponse, AuthResult, LoginCredentials, RegisterData } from "../types/auth";

class AuthService {
    // Login user
    static async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', credentials, {
                headers: {
                    'X-App-Type': 'customer'
                }
            });
            return response.data.data;
        } catch(error: any) {
            console.error("Error logging in: ", error)
            
            // Handle role-based access errors
            if (error.response?.status === 403 && error.response?.data?.message?.includes('Access denied')) {
                throw new Error('This account is not authorized for the mobile app. Please use the web interface.');
            }
            
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    // Register user
    static async register(userData: RegisterData): Promise<AuthResult> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/register', userData);
            return response.data.data;
        } catch (error: any) {
            console.error("Error registering: ", error)
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    // Refresh access token
    static async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
        try {
            const response = await apiClient.post<ApiResponse<{ accessToken: string }>>('/auth/refresh', {
                refreshToken
            });
            return response.data.data;
        } catch (error: any) {
            console.error("Error refreshing token: ", error)
            throw new Error(error.response?.data?.message || 'Token refresh failed');
        }
    }

    // Get current user profile
    static async getProfile(): Promise<any> {
        try {
            const response = await apiClient.get<ApiResponse<any>>('/auth/me');
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get profile');
        }
    }

    // Update user profile
    static async updateProfile(profileData: {
        name?: string;
        phone?: string;
        avatar?: string;
    }) {
        try {
            const response = await apiClient.put('/auth/profile', profileData);
            return response.data.data;
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update profile');
        }
    }

    // Change password
    static async changePassword(passwordData: {
        currentPassword: string;
        newPassword: string;
        confirmPassword: string;
    }): Promise<void> {
        try {
            await apiClient.put('/auth/change-password', passwordData);
        } catch (error: any) {
            console.error("Error changing password: ", error);
            throw new Error(error.response?.data?.message || 'Failed to change password');
        }
    }
}

export default AuthService;