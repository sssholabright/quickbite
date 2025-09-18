import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';

type AuthState = {
    token: string | null;
    hydrated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => Promise<void>;
    hydrate: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
    token: null,
    hydrated: false,

    login: async (token) => {
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

    hydrate: async () => {
        try {
            const token = await SecureStore.getItemAsync('access_token');
            set({ token, hydrated: true });
        } catch (error) {
            console.error('Error getting token:', error);
            set({ token: null, hydrated: false });
        }
    }
}));