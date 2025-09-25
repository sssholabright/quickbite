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
	hydrate: () => Promise<void>;
	markOnboardingSeen: () => Promise<void>;
	forgotPassword: (identifier: string) => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (profileData: { name?: string; phone?: string; avatar?: string; }) => Promise<void>;
    // Add specific loading states
    isUpdatingProfile: boolean;
    changePassword: (passwordData: { currentPassword: string; newPassword: string; confirmPassword: string; }) => Promise<void>;
    isChangingPassword: boolean;
};

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
            isUpdatingProfile: false, // Add this
            isChangingPassword: false,

            login: async (credentials: LoginCredentials) => {
                try {
                    set({ isLoading: true, error: null });
                    const result: AuthResult = await AuthService.login(credentials);

                    console.log("Dats: ", result)

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

            // Logout action
            logout: async () => {
                try {
                    set({ isLoading: true });
                    
                    // Call logout API
                    await AuthService.logout();
                    
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
                } catch (error: any) {
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

            // Refresh token action
            refreshToken: async () => {
                try {
                    const { tokens } = get();
                    if (!tokens.refreshToken) {
                        throw new Error('No refresh token available');
                    }

                    const result = await AuthService.refreshToken(tokens.refreshToken);
                    
                    await SecureStore.setItemAsync('access_token', result.accessToken);
                    
                    set({
                        tokens: {
                        ...tokens,
                        accessToken: result.accessToken,
                        },
                    });
                } catch (error: any) {
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
                    set({ error: error.message, isLoading: false });
                    throw error;
                }
            },

            // Update profile action - FIXED: Use specific loading state
            updateProfile: async (profileData) => {
                try {
                    set({ isUpdatingProfile: true, error: null }); // Use specific loading state
                    
                    const updatedUser = await AuthService.updateProfile(profileData);
                    
                    set({
                        user: updatedUser,
                        isUpdatingProfile: false, // Use specific loading state
                        error: null,
                    });
                } catch (error: any) {
                    set({
                        error: error.message || 'Failed to update profile',
                        isUpdatingProfile: false, // Use specific loading state
                    });
                    throw error;
                }
            },

            // Hydrate store from secure storage
            hydrate: async () => {
                try {
                    set({ isLoading: true });
                    
                    const accessToken = await SecureStore.getItemAsync('access_token');
                    const refreshToken = await SecureStore.getItemAsync('refresh_token');
                    const seen = await SecureStore.getItemAsync('onboarding_seen');
                
                    if (accessToken && refreshToken) {
                        // Fetch user profile from API
                        try {
                            const user = await AuthService.getProfile();
                            set({
                                user,
                                tokens: {
                                    accessToken,
                                    refreshToken,
                                },
                                isAuthenticated: true,
                                isLoading: false,
                                hydrated: true,
                                hasSeenOnboarding: !!seen,
                            });
                        } catch (error) {
                            // If profile fetch fails, still set auth state but without user data
                            set({
                                user: null,
                                tokens: {
                                    accessToken,
                                    refreshToken,
                                },
                                isAuthenticated: true,
                                isLoading: false,
                                hydrated: true,
                                hasSeenOnboarding: !!seen,
                            });
                        }
                    } else {
                        set({
                            user: null,
                            tokens: {
                                accessToken: null,
                                refreshToken: null,
                            },
                            isAuthenticated: false,
                            isLoading: false,
                            hydrated: true,
                            hasSeenOnboarding: !!seen,
                        });
                    }
                } catch (error) {
                    console.error('Error hydrating auth store:', error);
                    set({
                        user: null,
                        tokens: {
                            accessToken: null,
                            refreshToken: null,
                        },
                        isAuthenticated: false,
                        isLoading: false,
                        hydrated: true,
                        hasSeenOnboarding: false,
                    });
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
        }
    )
);