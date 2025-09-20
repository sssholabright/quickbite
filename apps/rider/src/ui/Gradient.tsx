import { LinearGradient } from "expo-linear-gradient";
import { PropsWithChildren } from "react";
import { ViewStyle } from "react-native";
import { useTheme } from "../theme/theme";

export function Gradient({ children, style }: PropsWithChildren<{ style?: ViewStyle }>) {
	const theme = useTheme();
	return (
		<LinearGradient colors={theme.gradient} start={{x:0,y:0}} end={{x:1,y:1}} style={[{ flex:1 }, style]}>
			{children}
		</LinearGradient>
	);
}