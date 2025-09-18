import { useColorScheme } from "react-native";
import { createContext, useContext, useMemo } from "react";

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

type ThemeMode = "system" | "light" | "dark";
export const ThemeModeContext = createContext<ThemeMode>("system");

export function useTheme() {
	const sys = useColorScheme(); // "light" | "dark" | null
	const mode = useContext(ThemeModeContext);
	const effective = mode === "system" ? (sys === "dark" ? "dark" : "light") : mode;
	return useMemo(() => (effective === "dark" ? darkTheme : lightTheme), [effective]);
}