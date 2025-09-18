import { View, Text, Image, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { PromoBannerProps } from "../types/vendor";
import { useTheme } from "../theme/theme";
import { Icon } from "./Icon";

export function PromoBanner({ title, subtitle, onPress }: PromoBannerProps) {
  const theme = useTheme();
  
    return (
        <Pressable onPress={onPress} style={{ marginHorizontal: 16, marginBottom: 16 }}>
            <LinearGradient
                colors={[theme.colors.primary, theme.colors.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={{
                    borderRadius: 16,
                    padding: 20,
                    flexDirection: "row",
                    alignItems: "center"
                }}
            >
                <View style={{ flex: 1 }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: "white",
                        marginBottom: 4
                    }}>
                        {title}
                    </Text>
                    <Text style={{
                        fontSize: 14,
                        color: "rgba(255,255,255,0.9)"
                    }}>
                        {subtitle}
                    </Text>
                </View>
                <Icon name="arrow-forward" size={24} color="white" />
            </LinearGradient>
        </Pressable>
    );
}