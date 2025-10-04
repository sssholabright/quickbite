import { ApiResponse, AuthResult, LoginCredentials } from "../types/auth";
import apiClient from "./api";

class AuthService {
    // Login user
    static async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            const response = await apiClient.post<ApiResponse<AuthResult>>('/auth/login', credentials, {
                headers: {
                    'X-App-Type': 'rider'
                }
            });
            return response.data.data;
        } catch(error: any) {
            console.error("Error logging in: ", error)
            
            // Handle role-based access errors
            if (error.response?.status === 403 && error.response?.data?.message?.includes('Access denied')) {
                throw new Error('This account is not authorized for this app. Please use the mobile app or admin interface.');
            }
            
            throw new Error(error.response?.data?.message || 'Login failed');
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

    // Logout user
    static async logout(): Promise<void> {
        try {
            await apiClient.post('/auth/logout');
        } catch (error: any) {
            // Even if logout fails on server, we should clear local tokens
            console.error('Logout error:', error);
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
        currentLat?: number;
        currentLng?: number;
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