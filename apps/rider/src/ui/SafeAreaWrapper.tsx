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

    return (
        <>
            <StatusBar
                barStyle={statusBarStyle === "light" ? "light-content" : "dark-content"}
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