import { authService } from '../services/authService';
import { UserProfile } from '../types/auth'
import { create } from 'zustand'

interface AuthStore {
    user: UserProfile | null
    isLoading: boolean
    isAuthenticated: boolean
    setUser: (user: UserProfile | null) => void
    setIsLoading: (loading: boolean) => void
    login: (email: string, password: string) => Promise<void>
    logout: (redirectTo?: string) => Promise<void>
    checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
    user: null,
    isLoading: true,
    get isAuthenticated() {
        return !!get().user
    },
    setUser: (user) => set({ user }),
    setIsLoading: (isLoading) => set({ isLoading }),

    login: async (email, password) => {
        try {
            const result = await authService.login({ email, password })
            console.log("Result: ", result)
            set({ user: result.user as UserProfile })
        } catch (error) {
            throw error
        }
    },
    
    logout: async (redirectTo = '/auth/vendor/login') => {
        try {
            // Clear user state immediately for better UX
            set({ user: null })
            
            // Call logout service
            await authService.logout()
            
            // Redirect to login page or specified route
            window.location.href = redirectTo
        } catch (error) {
            // Even if logout fails on server, clear local state and redirect
            console.error('Logout error:', error)
            set({ user: null })
            window.location.href = redirectTo
        }
    },

    checkAuth: async () => {
        set({ isLoading: true })
        try {
            // Check for accessToken in localStorage as a proxy for "isAuthenticated"
            const accessToken = localStorage.getItem('accessToken')
            if (accessToken) {
                try {
                    const userProfile = await authService.getProfile()
                    set({ user: userProfile })
                } catch (error) {
                    console.error('Failed to get user profile:', error)
                    await authService.logout()
                    set({ user: null })
                }
            } else {
                set({ user: null })
            }
        } finally {
            set({ isLoading: false })
        }
    }
}))