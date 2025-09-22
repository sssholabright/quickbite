import { ApiResponse, UserProfile } from '../types/auth';
import { AuthResult, LoginCredentials } from "../types/auth"
import api from "./api"

class AuthService {
    // Login user
    async login(credentials: LoginCredentials): Promise<AuthResult> {
        try {
            const response = await api.post<ApiResponse<AuthResult>>('/auth/login', credentials)
            const { user, tokens } = response.data.data as AuthResult

            // Store tokens in localStorage
            localStorage.setItem('accessToken', tokens.accessToken)
            localStorage.setItem('refreshToken', tokens.refreshToken)

            return { user, tokens }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Login failed')
        }
    }

    // Get current user profile
    async getProfile(): Promise<UserProfile> {
        try {
            const response = await api.get<ApiResponse<UserProfile>>('/auth/me')
            return response.data.data as UserProfile
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get profile')
        }
    }

     // Logout user
     async logout(): Promise<void> {
        try {
            await api.post<ApiResponse<void>>('/auth/logout')
        } catch (error) {
            // Even if logout fails on server, clear local tokens
            console.error('Logout error:', error)
        } finally {
            // Clear tokens from localStorage
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        }
    }
}

export const authService = new AuthService()