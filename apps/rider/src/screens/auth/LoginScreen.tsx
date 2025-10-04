import React, { useEffect, useState } from "react";
import { View, Text, Alert, Pressable, KeyboardAvoidingView, Platform, ScrollView, Keyboard } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { useAuthStore } from "../../stores/auth";
import type { AuthStackParamList } from "../../navigation/types";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Icon } from "../../ui/Icon";
import { Gradient } from "../../ui/Gradient";

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

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

	const { register, handleSubmit, setValue, formState: { errors }, watch } = useForm<FormValues>({
		resolver: zodResolver(schema), 
		defaultValues: { email: "", password: "" }
	});

	const onSubmit = async (v: FormValues) => {
		try {
			setLoading(true);
			clearError();
			await login({ email: v.email, password: v.password });
		} catch (e: any) {
			console.error("Login failed:", e.message);
			
			// Show specific error message for role-based access
			if (e.message.includes('not authorized for this app')) {
				// You could show a specific UI here or navigate to a different screen
				console.log('User tried to login with non-rider role');
			}
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
							<View style={{ marginBottom: 30 }}>
								<Text style={{
									fontSize: 28,
									fontWeight: "700",
									color: theme.colors.text,
									textAlign: "center",
									marginBottom: 8,
								}}>
									Welcome Back
								</Text>
								<Text style={{
									fontSize: 16,
									color: theme.colors.muted,
									textAlign: "center",
								}}>
									Sign in to your rider account
								</Text>
							</View>

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

							<View style={{ gap: 12, marginBottom: 12 }}>
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
							</View>

							{/* <Pressable
								onPress={() => navigation.navigate("ForgotPassword")}
								style={{ alignSelf: "flex-end", marginBottom: 24 }}
							>
								<Text style={{
									color: theme.colors.primary,
									fontSize: 14,
									fontWeight: "500",
								}}>
									Forgot Password?
								</Text>
							</Pressable> */}

							<CTAButton 
								title="Sign In" 
								onPress={handleSubmit(onSubmit)}
								disabled={loading}
							/>
						</ScrollView>
					</Pressable>
				</KeyboardAvoidingView>
			</Gradient>
		</SafeAreaWrapper>
	);
}