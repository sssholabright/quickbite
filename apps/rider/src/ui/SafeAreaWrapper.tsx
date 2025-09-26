import { ReactNode } from "react";
import { SafeAreaView, StatusBar, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme } from "../theme/theme";

interface SafeAreaWrapperProps {
    children: ReactNode;
    backgroundColor?: string;
    statusBarStyle?: "light" | "dark" | "auto";
    statusBarBackgroundColor?: string;
    edges?: ("top" | "bottom" | "left" | "right")[];
}

export function SafeAreaWrapper({
    children,
    backgroundColor,
    statusBarStyle = "auto",
    statusBarBackgroundColor,
    edges = ["top", "bottom", "left", "right"]
}: SafeAreaWrapperProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    
    const bgColor = backgroundColor || theme.colors.background;
    const statusBarBg = statusBarBackgroundColor || bgColor;
    
    // Auto-determine status bar style based on theme
    const getStatusBarStyle = () => {
        if (statusBarStyle === "auto") {
            // Use light content for dark themes, dark content for light themes
            return theme.mode === "dark" ? "light-content" : "dark-content";
        }
        return statusBarStyle === "light" ? "light-content" : "dark-content";
    };

    return (
        <>
            <StatusBar
                barStyle={getStatusBarStyle()}
                backgroundColor={statusBarBg}
                translucent={false}
            />
            <SafeAreaView
                style={{
                    flex: 1,
                    backgroundColor: bgColor,
                    paddingTop: edges.includes("top") ? insets.top : 0,
                    paddingBottom: edges.includes("bottom") ? insets.bottom : 0,
                    paddingLeft: edges.includes("left") ? insets.left : 0,
                    paddingRight: edges.includes("right") ? insets.right : 0,
                }}
            >
                {children}
            </SafeAreaView>
        </>
    )
}