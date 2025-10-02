import { ApiResponse } from '../types/auth'
import { AdminAuthResult, AdminProfile, AdminLoginCredentials } from '../types/admin'
import api from './api'

class AdminService {
    // Admin login
    async login(credentials: AdminLoginCredentials): Promise<AdminAuthResult> {
        try {
            const response = await api.post<ApiResponse<AdminAuthResult>>('/login', credentials)
            const { user, tokens } = response.data.data as AdminAuthResult

            // Store tokens in localStorage
            localStorage.setItem('accessToken', tokens.accessToken)
            localStorage.setItem('refreshToken', tokens.refreshToken)

            return { user, tokens }
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Admin login failed')
        }
    }

    // Get admin profile
    async getProfile(): Promise<AdminProfile> {
        try {
            const response = await api.get<ApiResponse<AdminProfile>>('/profile')
            return response.data.data as AdminProfile
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to get admin profile')
        }
    }

    // Update admin profile
    async updateProfile(data: Partial<AdminProfile>): Promise<AdminProfile> {
        try {
            const response = await api.put<ApiResponse<AdminProfile>>('/profile', data)
            return response.data.data as AdminProfile
        } catch (error: any) {
            throw new Error(error.response?.data?.message || 'Failed to update admin profile')
        }
    }

    // Logout admin
    async logout(): Promise<void> {
        try {
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        } catch (error) {
            // Even if logout fails on server, clear local tokens
            console.error('Admin logout error:', error)
        } finally {
            // Clear tokens from localStorage
            localStorage.removeItem('accessToken')
            localStorage.removeItem('refreshToken')
        }
    }

    // Check if admin has permission
    hasPermission(permissions: string[], requiredPermission: string): boolean {
        return permissions.includes(requiredPermission)
    }

    // Check if admin has any of the required permissions
    hasAnyPermission(permissions: string[], requiredPermissions: string[]): boolean {
        return requiredPermissions.some(perm => permissions.includes(perm))
    }

    // Check if admin has all required permissions
    hasAllPermissions(permissions: string[], requiredPermissions: string[]): boolean {
        return requiredPermissions.every(perm => permissions.includes(perm))
    }
}

export const adminService = new AdminService()