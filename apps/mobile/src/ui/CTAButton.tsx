import { LinearGradient } from "expo-linear-gradient";
import { Pressable, Text } from "react-native";
import { useTheme } from "../theme/theme";

export function CTAButton({ title, onPress, disabled }: { title: string; onPress: () => void; disabled?: boolean }) {
	const theme = useTheme();
	return (
		<Pressable onPress={onPress} disabled={disabled} style={{ opacity: disabled ? 0.7 : 1 }}>
			<LinearGradient colors={theme.cta} start={{x:0,y:0}} end={{x:1,y:1}}
				style={{ paddingVertical: 14, borderRadius: 14, alignItems: "center" }}>
				<Text style={{ color: "white", fontWeight: "700" }}>{title}</Text>
			</LinearGradient>
		</Pressable>
	);
}