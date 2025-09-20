import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
	token: string | null;
	hydrated: boolean;
	hasSeenOnboarding: boolean;
	login: (t: string) => Promise<void>;
	register: (t: string) => Promise<void>;
	logout: () => Promise<void>;
	markOnboardingSeen: () => Promise<void>;
	hydrate: () => Promise<void>;
	forgotPassword: (identifier: string) => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    hydrated: false,
    hasSeenOnboarding: false,

    login: async (token) => {
        try {
            await SecureStore.setItemAsync('access_token', token);
            set({ token, hydrated: true });
        } catch (error) {
            console.error('Error saving token:', error);
            set({ token: null, hydrated: false });
        }
    },

    register: async (token) => {
        try {
            await SecureStore.setItemAsync('access_token', token);
            set({ token, hydrated: true });
        } catch (error) {
            console.error('Error saving token:', error);
            set({ token: null, hydrated: false });
        }
    },

    logout: async () => {
        try {
            await SecureStore.deleteItemAsync('access_token');
            set({ token: null, hydrated: false });
        } catch (error) {
            console.error('Error deleting token:', error);
        }
    },

    markOnboardingSeen: async () => {
        try {
            await SecureStore.setItemAsync('onboarding_seen', '1');
            set({ hasSeenOnboarding: true });
        } catch (error) {
            console.error('Error onboarding:', error);
            set({ token: null, hydrated: false });
        }
    },

    hydrate: async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            const seen = await SecureStore.getItemAsync('onboarding_seen');
            set({ token: token ?? null, hasSeenOnboarding: !!seen, hydrated: true });
        } catch (error) {
            console.error('Error getting token:', error);
            // set({ token: null, hydrated: false });
        }
    },

    forgotPassword: async () => {
        try {
            const t = await SecureStore.getItemAsync("access_token");
		    const seen = await SecureStore.getItemAsync("onboarding_seen");
            await SecureStore.setItemAsync('onboarding_seen', '1');
            set({ token: t ?? null, hasSeenOnboarding: !!seen, hydrated: true });
        } catch (error) {
            console.error('Error onboarding:', error);
            set({ token: null, hydrated: false });
        }
    }
}));