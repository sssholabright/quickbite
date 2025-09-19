import { useColorScheme, type ColorSchemeName } from "react-native";
import { createContext, useContext, useMemo, useEffect, useState } from "react";
import { useThemeStore, ThemeMode } from "../stores/theme";

export type AppTheme = {
	colors: {
		background: string;
		text: string;
		muted: string;
		primary: string;
		primaryDark: string;
		danger: string;
		surface: string;
		border: string;
	};
	gradient: readonly [string, string];
	cta: readonly [string, string];
	mode: "light" | "dark";
};

export const lightTheme: AppTheme = {
	colors: {
		background: "#ffffff",
		text: "#0f172a",
		muted: "#475569",
		primary: "#16a34a",
		primaryDark: "#15803d",
		danger: "#dc2626",
		surface: "#f8fafc",
		border: "#e2e8f0"
	},
	gradient: ["#f1f5f9", "#ffffff"] as const,
	cta: ["#16a34a", "#22c55e"] as const,
	mode: "light"
};

export const darkTheme: AppTheme = {
	colors: {
		background: "#0b1116",
		text: "#e5e7eb",
		muted: "#94a3b8",
		primary: "#22c55e",
		primaryDark: "#16a34a",
		danger: "#ef4444",
		surface: "#0f172a",
		border: "#1f2937"
	},
	gradient: ["#111827", "#0b1116"] as const,
	cta: ["#22c55e", "#16a34a"] as const,
	mode: "dark"
};

export const ThemeModeContext = createContext<ThemeMode>("system");

// Custom hook to get system color scheme with better handling
function useSystemColorScheme() {
	const [colorScheme, setColorScheme] = useState<ColorSchemeName>(null);
	const rnColorScheme = useColorScheme();

	useEffect(() => {
		setColorScheme(rnColorScheme ?? null); // handle undefined safely
	}, [rnColorScheme]);

	return colorScheme;
}

export function useTheme() {
	const systemColorScheme = useSystemColorScheme();
	const mode = useThemeStore((state) => state.mode);
	
	// Calculate effective theme mode
	const effective = useMemo(() => {
		if (mode === "system") {
			// Default to light if system color scheme is null
			const result = systemColorScheme === "dark" ? "dark" : "light";
			return result;
		}
		return mode;
	}, [mode, systemColorScheme]);
	
	return useMemo(() => (effective === "dark" ? darkTheme : lightTheme), [effective]);
}

export function useThemeMode() {
	return useThemeStore((state) => state.mode);
}

export function useSetThemeMode() {
	return useThemeStore((state) => state.setMode);
}

// Helper hook to get the current effective theme mode
export function useEffectiveThemeMode() {
	const systemColorScheme = useSystemColorScheme();
	const mode = useThemeStore((state) => state.mode);
	
	return useMemo(() => {
		if (mode === "system") {
			return systemColorScheme === "dark" ? "dark" : "light";
		}
		return mode;
	}, [mode, systemColorScheme]);
}