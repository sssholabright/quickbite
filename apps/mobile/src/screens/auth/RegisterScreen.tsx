import { useState, useEffect } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/auth";
import { Gradient } from "../../ui/Gradient";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { Icon } from "../../ui/Icon";
import { useTheme } from "../../theme/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";

const schema = z.object({
	name: z.string().min(2, "Enter your name"),
	email: z.string().email("Enter a valid email"),
	phone: z.string().min(10, "Enter a valid phone number"),
	password: z.string().min(8, "Min 8 characters"),
	confirmPassword: z.string().min(8, "Confirm your password"),
	acceptTerms: z.boolean().refine(v => v === true, { message: "Please accept the terms" })
}).refine((d) => d.password === d.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
});

type FormValues = z.infer<typeof schema>;

// Password validation function matching backend requirements
const validatePasswordStrength = (password: string) => {
	const requirements = [
		{ test: password.length >= 8, text: 'At least 8 characters' },
		{ test: /[A-Z]/.test(password), text: 'One uppercase letter' },
		{ test: /[a-z]/.test(password), text: 'One lowercase letter' },
		{ test: /\d/.test(password), text: 'One number' },
		{ test: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: 'One special character' }
	];
	
	return requirements;
};

export default function RegisterScreen() {
	const [loading, setLoading] = useState(false);
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);

	const theme = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, "Register">>();
	const { register, error, clearError } = useAuthStore();

	// Clear error when component mounts
	useEffect(() => {
		clearError();
	}, [clearError]);

	const { control, handleSubmit, formState: { errors, isValid }, watch } = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onChange",
		defaultValues: { 
			name: "", 
			email: "", 
			phone: "",
			password: "", 
			confirmPassword: "", 
			acceptTerms: false 
		}
	});

	const password = watch("password");
	const passwordRequirements = validatePasswordStrength(password || "");

	const onSubmit: SubmitHandler<FormValues> = async (v) => {
		try {
			setLoading(true);
			clearError();
			await register({
				name: v.name,
				email: v.email,
				phone: v.phone,
				password: v.password,
				role: 'CUSTOMER'
			});
		} catch (e: any) {
			Alert.alert("Registration failed", e.message || "Please try again");
		} finally {
			setLoading(false);
		}
	};

	const termsAccepted = watch("acceptTerms");

	return (
		<SafeAreaWrapper 
			statusBarStyle={theme.mode === 'dark' ? 'light' : 'dark'}
			backgroundColor={theme.colors.background}
		>
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
							<Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text }}>Create account</Text>

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

							<Controller
								control={control}
								name="name"
								render={({ field: { onChange, value } }) => (
									<Input 
										label="Name" 
										placeholder="Enter your name"
										value={value} 
										onChangeText={onChange} 
										error={errors.name?.message} 
									/>
								)}
							/>

							<Controller
								control={control}
								name="email"
								render={({ field: { onChange, value } }) => (
									<Input 
										label="Email" 
										placeholder="Enter your email"
										autoCapitalize="none" 
										keyboardType="email-address" 
										value={value} 
										onChangeText={onChange} 
										error={errors.email?.message} 
									/>
								)}
							/>

							<Controller
								control={control}
								name="phone"
								render={({ field: { onChange, value } }) => (
									<Input 
										label="Phone" 
										placeholder="Enter your phone number"
										keyboardType="phone-pad" 
										value={value} 
										onChangeText={onChange} 
										error={errors.phone?.message} 
									/>
								)}
							/>

							<View style={{ position: 'relative' }}>
								<Controller
									control={control}
									name="password"
									render={({ field: { onChange, value } }) => (
										<Input 
											label="Password" 
											placeholder="Enter your password"
											secureTextEntry={!showPassword} 
											value={value} 
											onChangeText={onChange} 
											error={errors.password?.message} 
										/>
									)}
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

							{/* Password Requirements */}
							{password && (
								<View style={{ 
									backgroundColor: theme.colors.surface, 
									padding: 12, 
									borderRadius: 8, 
									borderWidth: 1, 
									borderColor: theme.colors.border 
								}}>
									<Text style={{ 
										color: theme.colors.text, 
										fontSize: 14, 
										fontWeight: '600', 
										marginBottom: 8 
									}}>
										Password Requirements:
									</Text>
									{passwordRequirements.map((req, index) => (
										<View key={index} style={{ 
											flexDirection: 'row', 
											alignItems: 'center', 
											marginBottom: 4 
										}}>
											<Icon
												name={req.test ? "checkmark" : "close"}
												size={16}
												color={req.test ? theme.colors.primary : theme.colors.danger}
											/>
											<Text style={{ 
												color: req.test ? theme.colors.primary : theme.colors.muted,
												marginLeft: 8,
												fontSize: 12
											}}>
												{req.text}
											</Text>
										</View>
									))}
								</View>
							)}

							<View style={{ position: 'relative' }}>
								<Controller
									control={control}
									name="confirmPassword"
									render={({ field: { onChange, value } }) => (
										<Input 
											label="Confirm Password" 
											placeholder="Confirm your password"
											secureTextEntry={!showConfirmPassword} 
											value={value} 
											onChangeText={onChange} 
											error={errors.confirmPassword?.message} 
										/>
									)}
								/>
								<Pressable
									onPress={() => setShowConfirmPassword(!showConfirmPassword)}
									style={{
										position: 'absolute',
										right: 12,
										top: 32,
										padding: 4,
									}}
								>
									<Icon
										name={showConfirmPassword ? "eye-off" : "eye"}
										size={20}
										color={theme.colors.muted}
									/>
								</Pressable>
							</View>

							<Controller
								control={control}
								name="acceptTerms"
								render={({ field: { onChange, value } }) => (
									<Pressable onPress={() => onChange(!value)} style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
										<View style={{
											width: 20, height: 20, borderRadius: 6,
											borderWidth: 1, borderColor: theme.colors.border,
											alignItems: "center", justifyContent: "center",
											backgroundColor: value ? theme.colors.primary : "transparent"
										}}>
											{value ? <Text style={{ color: theme.colors.background, fontWeight: "800" }}>✓</Text> : null}
										</View>
										<Text style={{ color: theme.colors.muted }}>I agree to the Terms and Privacy</Text>
									</Pressable>
								)}
							/>
							{errors.acceptTerms && <Text style={{ color: theme.colors.danger }}>{errors.acceptTerms.message}</Text>}

							<CTAButton
								title={loading ? "Creating..." : "Create account"}
								onPress={handleSubmit(onSubmit)}
								disabled={loading || !isValid || !termsAccepted}
							/>

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

							<Pressable onPress={() => navigation.navigate("Login")}>
								<Text style={{ color: theme.colors.muted, textAlign: "center" }}>Already have an account? Sign in</Text>
							</Pressable>
						</ScrollView>
					</Pressable>
				</KeyboardAvoidingView>
			</Gradient>
		</SafeAreaWrapper>
	);
}