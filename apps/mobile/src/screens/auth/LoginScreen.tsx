import { useState, useEffect } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/auth";
import { useTheme } from "../../theme/theme";
import { Gradient } from "../../ui/Gradient";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { Icon } from "../../ui/Icon";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";

const schema = z.object({
	email: z.string().email("Enter a valid email"),
	password: z.string().min(6, "Min 6 characters")
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const { login, error, clearError } = useAuthStore();
	const theme = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, "Login">>();

	// Clear error when component mounts
	useEffect(() => {
		clearError();
	}, [clearError]);

	const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
		resolver: zodResolver(schema), 
		defaultValues: { email: "", password: "" }
	});

	const onSubmit = async (v: FormValues) => {
		try {
			setLoading(true);
			clearError();
			await login({ email: v.email, password: v.password });
		} catch (e: any) {
			console.error("Login failed, Please try again")
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaWrapper 
			statusBarStyle={theme.mode === 'dark' ? 'light' : 'dark'}
			backgroundColor={theme.colors.background}
		>
			<Gradient>
				<KeyboardAvoidingView
					style={{ flex: 1 }}
					behavior={Platform.select({ ios: "padding", android: "height" })}
					keyboardVerticalOffset={Platform.select({ ios: 0, android: 0 })}
				>
					<Pressable onPress={Keyboard.dismiss} style={{ flex: 1 }}>
						<ScrollView
							contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, gap: 18 }}
							keyboardShouldPersistTaps="handled"
						>
							<Text style={{ color: theme.colors.text, fontSize: 28, fontWeight: "800" }}>Welcome back</Text>
							
							{error && (
								<View style={{ 
									backgroundColor: theme.colors.danger + '20', 
									padding: 12, 
									borderRadius: 8, 
									borderWidth: 1, 
									borderColor: theme.colors.danger + '40' 
								}}>
									<Text style={{ color: theme.colors.danger, textAlign: 'center' }}>{error}</Text>
								</View>
							)}

							<Input
								label="Email"
								placeholder="Enter your email"
								autoCapitalize="none"
								keyboardType="email-address"
								onChangeText={(t) => setValue("email", t)}
								{...register("email")}
								error={errors.email?.message}
							/>
							
							<View style={{ position: 'relative' }}>
								<Input
									label="Password"
									placeholder="Enter your password"
									secureTextEntry={!showPassword}
									onChangeText={(t) => setValue("password", t)}
									{...register("password")}
									error={errors.password?.message}
								/>
								<Pressable
									onPress={() => setShowPassword(!showPassword)}
									style={{
										position: 'absolute',
										right: 12,
										top: 32,
										padding: 4,
									}}
								>
									<Icon
										name={showPassword ? "eye-off" : "eye"}
										size={20}
										color={theme.colors.muted}
									/>
								</Pressable>
							</View>

							<CTAButton 
								title={loading ? "Signing in..." : "Sign In"} 
								onPress={handleSubmit(onSubmit)}
								disabled={loading}
							/>
							<Pressable onPress={() => navigation.navigate("ForgotPassword")}>
								<Text style={{ color: theme.colors.muted, textAlign: "center" }}>Forgot password?</Text>
							</Pressable>

							<View style={{ height: 1, backgroundColor: theme.colors.border, marginVertical: 6 }} />
							<Text style={{ color: theme.colors.muted, textAlign: "center" }}>Or continue with</Text>
							<View style={{ flexDirection: "row", gap: 12, justifyContent: "center" }}>
								<Pressable style={{ 
									padding: 12, 
									borderRadius: 12, 
									backgroundColor: theme.colors.surface,
									borderWidth: 1,
									borderColor: theme.colors.border
								}}>
									<Text style={{ color: theme.colors.text }}>Google</Text>
								</Pressable>
								<Pressable style={{ 
									padding: 12, 
									borderRadius: 12, 
									backgroundColor: theme.colors.surface,
									borderWidth: 1,
									borderColor: theme.colors.border
								}}>
									<Text style={{ color: theme.colors.text }}>Apple</Text>
								</Pressable>
							</View>

							<Pressable onPress={() => navigation.navigate("Register")}>
								<Text style={{ color: theme.colors.muted, textAlign: "center" }}>New here? Create account</Text>
							</Pressable>
						</ScrollView>
					</Pressable>
				</KeyboardAvoidingView>
			</Gradient>
		</SafeAreaWrapper>
	);
}