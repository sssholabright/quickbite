import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text, ViewStyle } from "react-native";
import { useTheme } from "../theme/theme";

interface CTAButtonProps {
	title: string;
	onPress: () => void;
	disabled?: boolean;
	style?: ViewStyle;
	loading?: boolean;
}

export function CTAButton({ title, onPress, disabled, style, loading }: CTAButtonProps) {
	const theme = useTheme();
	return (
		<Pressable onPress={onPress} disabled={disabled || loading} style={{ opacity: disabled || loading ? 0.7 : 1 }}>
			<LinearGradient colors={theme.cta} start={{x:0,y:0}} end={{x:1,y:1}}
				style={[{ paddingVertical: 14, borderRadius: 14, alignItems: "center" }, style]}>
				<Text style={{ color: "white", fontWeight: "700" }}>
					{loading ? "Loading..." : title}
				</Text>
			</LinearGradient>
		</Pressable>
	);
}