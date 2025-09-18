import { useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/auth";
import { Gradient } from "../../ui/Gradient";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { useTheme } from "../../theme/theme";

const schema = z.object({ identifier: z.string().min(3, "Enter email or phone") });
type FormValues = z.infer<typeof schema>;

export default function ForgotPasswordScreen() {
	const [loading, setLoading] = useState(false);

	const theme = useTheme()
	
	const { forgotPassword } = useAuthStore.getState();
	const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
		resolver: zodResolver(schema), defaultValues: { identifier: "" }
	});

	const onSubmit = async (v: FormValues) => {
		try {
			setLoading(true);
			await forgotPassword(v.identifier);
			Alert.alert("Check your inbox", "If this account exists, you’ll receive reset steps.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<Gradient>
			<KeyboardAvoidingView
				style={{ flex: 1 }}
				behavior={Platform.select({ ios: "padding", android: "height" })}
				keyboardVerticalOffset={Platform.select({ ios: 64, android: 0 })}
			>
				<Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
					<ScrollView
						contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, gap: 16 }}
						keyboardShouldPersistTaps="handled"
					>
						<Text style={{ fontSize:28, fontWeight:"800", color: theme.colors.text, }}>Reset password</Text>
						<Input
							label="Email or Phone"
							autoCapitalize="none"
							onChangeText={(t) => setValue("identifier", t)}
							{...register("identifier")}
							error={errors.identifier?.message}
						/>
						<CTAButton title={loading ? "Sending..." : "Send reset link"} onPress={handleSubmit(onSubmit)} />
					</ScrollView>
				</Pressable>
			</KeyboardAvoidingView>
		</Gradient>
	);
}