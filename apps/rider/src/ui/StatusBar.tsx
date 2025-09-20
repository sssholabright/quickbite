import { useEffect } from "react";
import { StatusBar as RNStatusBar, Platform } from "react-native";
import { useTheme } from "../theme/theme";

interface StatusBarProps {
    style?: "light" | "dark" | "auto";
    backgroundColor?: string;
    translucent?: boolean;
}

export function StatusBar({ 
    style = "auto", 
    backgroundColor,
    translucent = Platform.OS === "android"
}: StatusBarProps) {
    const theme = useTheme();
  
    useEffect(() => {
        const barStyle = style === "auto" 
            ? theme.mode === "dark" ? "light-content" : "dark-content"
            : style === "light" ? "light-content" : "dark-content";
        
        RNStatusBar.setBarStyle(barStyle, true);
        
        if (Platform.OS === "android") {
            RNStatusBar.setBackgroundColor(backgroundColor || theme.colors.background, true);
            RNStatusBar.setTranslucent(translucent);
        }
    }, [style, backgroundColor, theme.mode, theme.colors.background, translucent]);
  
    return null;
}