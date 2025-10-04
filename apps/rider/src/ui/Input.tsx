import { forwardRef } from "react";
import { TextInput, TextInputProps, View, Text } from "react-native";
import { useTheme } from "../theme/theme";

export const Input = forwardRef<TextInput, TextInputProps & { label?: string; error?: string }>(
	({ label, error, style, ...p }, ref) => {
		const theme = useTheme();
		return (
			<View style={{ gap:6 }}>
				{label && <Text style={{ color: theme.colors.muted, fontWeight: "500" }}>{label}</Text>}
				<TextInput
					ref={ref}
					placeholderTextColor={theme.mode === "dark" ? "#64748b" : "#94a3b8"}
					style={[{
						marginBottom: 15,
						backgroundColor: theme.colors.surface,
						color: theme.colors.text,
						paddingVertical: 14, paddingHorizontal: 14,
						borderRadius: 12, borderWidth: 1, borderColor: theme.colors.border
					}, style]}
					{...p}
				/>
				{!!error && <Text style={{ color: theme.colors.danger, fontSize: 12 }}>{error}</Text>}
			</View>
		);
	}
);