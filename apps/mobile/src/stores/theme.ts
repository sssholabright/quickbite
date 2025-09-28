import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import * as SecureStore from 'expo-secure-store';

export type ThemeMode = "system" | "light" | "dark";

interface ThemeStore {
    mode: ThemeMode;
    setMode: (mode: ThemeMode) => void;
}

export const useThemeStore = create<ThemeStore>()(
    persist(
        (set) => ({
            mode: "system",
            setMode: (mode) => set({ mode }),
        }),
        {
            name: 'theme-storage',
            storage: {
                getItem: async (name) => {
                    try {
                        const value = await SecureStore.getItemAsync(name);
                        return value ? JSON.parse(value) : null;
                    } catch (error) {
                        console.error('Theme storage getItem error:', error);
                        return null;
                    }
                },
                setItem: async (name, value) => {
                    try {
                        await SecureStore.setItemAsync(name, JSON.stringify(value));
                    } catch (error) {
                        console.error('Theme storage setItem error:', error);
                    }
                },
                removeItem: async (name) => {
                    try {
                        await SecureStore.deleteItemAsync(name);
                    } catch (error) {
                        console.error('Theme storage removeItem error:', error);
                    }
                },
            },
        }
    )
);
