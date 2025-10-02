import { adminService } from '../services/adminService'
import { AdminProfile } from '../types/admin'
import { create } from 'zustand'

interface AdminStore {
    user: AdminProfile | null
    isLoading: boolean
    isAuthenticated: boolean
    
    // Actions
    setUser: (user: AdminProfile | null) => void
    setIsLoading: (loading: boolean) => void
    login: (email: string, password: string) => Promise<void>
    logout: (redirectTo?: string) => Promise<void>
    checkAuth: () => Promise<void>
    hasPermission: (permission: string) => boolean
    hasAnyPermission: (permissions: string[]) => boolean
    hasAllPermissions: (permissions: string[]) => boolean
}

export const useAdminStore = create<AdminStore>((set, get) => ({
    user: null,
    isLoading: true,
    
    get isAuthenticated() {
        return !!get().user
    },

    setUser: (user) => set({ user }),
    setIsLoading: (isLoading) => set({ isLoading }),

    login: async (email, password) => {
        try {
            const result = await adminService.login({ email, password })
            set({ user: result.user as AdminProfile })
        } catch (error) {
            throw error
        }
    },
    
    logout: async (redirectTo = '/admin/auth/login') => {
        try {
            // Clear user state immediately for better UX
            set({ user: null })
            
            // Call logout service
            await adminService.logout()
            
            // Redirect to login page or specified route
            window.location.href = redirectTo
        } catch (error) {
            // Even if logout fails on server, clear local state and redirect
            console.error('Admin logout error:', error)
            set({ user: null })
            window.location.href = redirectTo
        }
    },

    checkAuth: async () => {
        set({ isLoading: true })
        try {
            // Check for accessToken in localStorage
            const accessToken = localStorage.getItem('accessToken')
            if (accessToken) {
                try {
                    const userProfile = await adminService.getProfile()
                    set({ user: userProfile })
                } catch (error) {
                    console.error('Failed to get admin profile:', error)
                    await adminService.logout()
                    set({ user: null })
                }
            } else {
                set({ user: null })
            }
        } finally {
            set({ isLoading: false })
        }
    },

    hasPermission: (permission: string) => {
        const { user } = get()
        return user ? adminService.hasPermission(user.permissions, permission) : false
    },

    hasAnyPermission: (permissions: string[]) => {
        const { user } = get()
        return user ? adminService.hasAnyPermission(user.permissions, permissions) : false
    },

    hasAllPermissions: (permissions: string[]) => {
        const { user } = get()
        return user ? adminService.hasAllPermissions(user.permissions, permissions) : false
    }
}))