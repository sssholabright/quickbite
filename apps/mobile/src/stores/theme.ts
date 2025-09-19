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
                    const value = await SecureStore.getItemAsync(name);
                    return value ? JSON.parse(value) : null;
                },
                setItem: async (name, value) => {
                    await SecureStore.setItemAsync(name, JSON.stringify(value));
                },
                removeItem: async (name) => {
                    await SecureStore.deleteItemAsync(name);
                },
            },
        }
    )
);
