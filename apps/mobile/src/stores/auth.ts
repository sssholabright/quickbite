import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { AuthResult, AuthState, LoginCredentials, RegisterData } from '../types/auth';
import AuthService from '../services/authService';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AuthStore extends AuthState {
    // Actions
    hydrated: boolean;
    hasSeenOnboarding: boolean;
    login: (credentials: LoginCredentials) => Promise<void>;
    register: (userData: RegisterData) => Promise<void>;
    logout: () => Promise<void>;
    refreshToken: () => Promise<void>;
    clearError: () => void;
    markOnboardingSeen: () => Promise<void>;
    forgotPassword: (identifier: string) => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (profileData: { name?: string; phone?: string; avatar?: string; }) => Promise<void>;
    // Add specific loading states
    isUpdatingProfile: boolean;
    changePassword: (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string; }) => Promise<void>;
    isChangingPassword: boolean;
    // 🚀 NEW: Auto-logout when tokens are invalid
    checkAuthStatus: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
    persist(
        (set, get) => ({
            // Initial state
            user: null,
            tokens: {
                accessToken: null,
                refreshToken: null,
            },
            isAuthenticated: false,
            isLoading: false,
            error: null,
            hydrated: false,
            hasSeenOnboarding: false,
            isUpdatingProfile: false,
            isChangingPassword: false,

            login: async (credentials: LoginCredentials) => {
                try {
                    set({ isLoading: true, error: null });
                    const result: AuthResult = await AuthService.login(credentials);

                    console.log("Login successful: ", result)

                    // Store tokens securely
                    await SecureStore.setItemAsync('access_token', result.tokens.accessToken);
                    await SecureStore.setItemAsync('refresh_token', result.tokens.refreshToken);

                    set({ 
                        user: result.user,
                        tokens: result.tokens,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null 
                    });
                } catch (error: any) {
                    set({
                        error: error.message || 'Login failed',
                        isLoading: false,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // Register action
            register: async (userData: RegisterData) => {
                try {
                    set({ isLoading: true, error: null });
                    
                    const result: AuthResult = await AuthService.register(userData);
                    
                    // Store tokens securely
                    await SecureStore.setItemAsync('access_token', result.tokens.accessToken);
                    await SecureStore.setItemAsync('refresh_token', result.tokens.refreshToken);
                    
                    set({
                        user: result.user,
                        tokens: result.tokens,
                        isAuthenticated: true,
                        isLoading: false,
                        error: null,
                    });
                } catch (error: any) {
                    set({
                        error: error.message || 'Registration failed',
                        isLoading: false,
                        isAuthenticated: false,
                    });
                    throw error;
                }
            },

            // 🚀 ENHANCED: Logout action with proper cleanup
            logout: async () => {
                try {
                    console.log('🚪 Logging out user...');
                    set({ isLoading: true });
                    
                    // Clear stored tokens
                    await SecureStore.deleteItemAsync('access_token');
                    await SecureStore.deleteItemAsync('refresh_token');
                    
                    set({
                        user: null,
                        tokens: {
                            accessToken: null,
                            refreshToken: null,
                        },
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                    
                    console.log('✅ Logout completed successfully');
                } catch (error: any) {
                    console.error('❌ Error during logout:', error);
                    // Even if API call fails, clear local state
                    await SecureStore.deleteItemAsync('access_token');
                    await SecureStore.deleteItemAsync('refresh_token');
                    
                    set({
                        user: null,
                        tokens: {
                            accessToken: null,
                            refreshToken: null,
                        },
                        isAuthenticated: false,
                        isLoading: false,
                        error: null,
                    });
                }
            },

            // 🚀 ENHANCED: Refresh token with auto-logout on failure
            refreshToken: async () => {
                try {
                    const { tokens } = get();
                    if (!tokens.refreshToken) {
                        console.log('🚪 No refresh token available, logging out...');
                        await get().logout();
                        return;
                    }

                    console.log('🔄 Refreshing access token...');
                    const result = await AuthService.refreshToken(tokens.refreshToken);
                    
                    await SecureStore.setItemAsync('access_token', result.accessToken);
                    
                    set({
                        tokens: {
                            ...tokens,
                            accessToken: result.accessToken,
                        },
                    });
                    console.log('✅ Token refreshed successfully');
                } catch (error: any) {
                    console.log('❌ Token refresh failed, logging out:', error.message);
                    // If refresh fails, logout user
                    await get().logout();
                    throw error;
                }
            },

            // Clear error action
            clearError: () => {
                set({ error: null });
            },

            // Fetch user profile
            fetchProfile: async () => {
                try {
                    set({ isLoading: true });
                    const user = await AuthService.getProfile();
                    set({ user, isLoading: false });
                } catch (error: any) {
                    console.error('❌ Failed to fetch profile:', error);
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Update profile action
            updateProfile: async (profileData) => {
                try {
                    set({ isUpdatingProfile: true, error: null });
                    
                    const updatedUser = await AuthService.updateProfile(profileData);
                    
                    set({
                        user: updatedUser,
                        isUpdatingProfile: false,
                        error: null,
                    });
                } catch (error: any) {
                    set({
                        error: error.message || 'Failed to update profile',
                        isUpdatingProfile: false,
                    });
                    throw error;
                }
            },

            // Mark onboarding as seen
            markOnboardingSeen: async () => {
                try {
                    await SecureStore.setItemAsync('onboarding_seen', '1');
                    set({ hasSeenOnboarding: true });
                } catch (error) {
                    console.error('Error saving onboarding status:', error);
                }
            },

            // Forgot password (placeholder for now)
            forgotPassword: async (email: string) => {
                try {
                    set({ isLoading: true, error: null });
                    // TODO: Implement forgot password API call
                    await new Promise(resolve => setTimeout(resolve, 1000)); // Mock delay
                    set({ isLoading: false });
                } catch (error: any) {
                    set({
                        error: error.message || 'Failed to send reset email',
                        isLoading: false,
                    });
                    throw error;
                }
            },

            // Change password action
            changePassword: async (passwordData) => {
                try {
                    set({ isChangingPassword: true, error: null });
                    
                    await AuthService.changePassword(passwordData);
                    
                    set({
                        isChangingPassword: false,
                        error: null,
                    });
                } catch (error: any) {
                    console.error("Change password error: ", error);
                    set({
                        error: error.message || 'Failed to change password',
                        isChangingPassword: false,
                    });
                    throw error;
                }
            },

            // 🚀 NEW: Check auth status and auto-logout if invalid
            checkAuthStatus: async () => {
                try {
                    const { tokens, isAuthenticated } = get();
                    
                    // If no tokens, ensure user is logged out
                    if (!tokens.accessToken || !tokens.refreshToken) {
                        if (isAuthenticated) {
                            console.log('🚪 No tokens found, logging out...');
                            await get().logout();
                        }
                        return;
                    }

                    // Try to fetch profile to validate tokens
                    try {
                        const user = await AuthService.getProfile();
                        // If successful, update user data
                        set({ user, isAuthenticated: true });
                    } catch (error: any) {
                        // If profile fetch fails, tokens might be invalid
                        if (error.response?.status === 401) {
                            console.log('🚪 Invalid tokens detected, logging out...');
                            await get().logout();
                        } else {
                            // Other errors, just update user but keep auth state
                            console.warn('⚠️ Profile fetch failed, but keeping auth state:', error.message);
                        }
                    }
                } catch (error) {
                    console.error('❌ Error checking auth status:', error);
                }
            },
        }),
        {
            name: 'mobile-auth-storage',
            storage: createJSONStorage(() => AsyncStorage),
            partialize: (state) => ({
                // Persist essential auth data
                user: state.user,
                tokens: state.tokens,
                isAuthenticated: state.isAuthenticated,
                hasSeenOnboarding: state.hasSeenOnboarding,
            }),
            // 🚀 ENHANCED: onRehydrateStorage with auth status check
            onRehydrateStorage: () => (state) => {
                if (state) {
                    state.hydrated = true;
                    // 🚀 NEW: Check auth status after rehydration
                    setTimeout(() => {
                        state.checkAuthStatus();
                    }, 100);
                }
            },
        }
    )
);

// Hook to check if store is hydrated
export const useAuthHydration = () => {
    const hydrated = useAuthStore((state) => state.hydrated);
    return hydrated;
};