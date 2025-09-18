import { useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useForm, Controller, SubmitHandler } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/auth";
import { mockRegister } from "../../lib/mockAuth";
import { Gradient } from "../../ui/Gradient";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { useTheme } from "../../theme/theme";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

const schema = z.object({
	name: z.string().min(2, "Enter your name"),
	email: z.string().email("Enter a valid email"),
	password: z.string().min(6, "Min 6 characters"),
	confirmPassword: z.string().min(6, "Confirm your password"),
	acceptTerms: z.boolean().refine(v => v === true, { message: "Please accept the terms" })
}).refine((d) => d.password === d.confirmPassword, {
	message: "Passwords do not match",
	path: ["confirmPassword"]
});

type FormValues = z.infer<typeof schema>;

export default function RegisterScreen() {
	const [loading, setLoading] = useState(false);
	const [secure, setSecure] = useState(true);

	const theme = useTheme()

	const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, "Register">>();
	const registerLogin = useAuthStore((s) => s.register);

	const { control, handleSubmit, formState: { errors, isValid }, watch } = useForm<FormValues>({
		resolver: zodResolver(schema),
		mode: "onChange",
		defaultValues: { name: "", email: "", password: "", confirmPassword: "", acceptTerms: false }
	});

	const onSubmit: SubmitHandler<FormValues> = async (v) => {
		try {
			setLoading(true);
			const token = await mockRegister({ name: v.name, email: v.email, password: v.password });
			await registerLogin(token);
		} catch (e: any) {
			Alert.alert("Register failed", e?.message ?? "Try again");
		} finally {
			setLoading(false);
		}
	};

	const termsAccepted = watch("acceptTerms");

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
						<Text style={{ fontSize: 28, fontWeight: "800", color: theme.colors.text, }}>Create account</Text>

						<Controller
							control={control}
							name="name"
							render={({ field: { onChange, value } }) => (
								<Input label="Name" value={value} onChangeText={onChange} error={errors.name?.message} />
							)}
						/>

						<Controller
							control={control}
							name="email"
							render={({ field: { onChange, value } }) => (
								<Input label="Email" autoCapitalize="none" keyboardType="email-address" value={value} onChangeText={onChange} error={errors.email?.message} />
							)}
						/>

						<Controller
							control={control}
							name="password"
							render={({ field: { onChange, value } }) => (
								<View style={{ gap:6 }}>
									<Input label="Password" secureTextEntry={secure} value={value} onChangeText={onChange} error={errors.password?.message} />
									<Pressable onPress={() => setSecure((s) => !s)} style={{ alignSelf:"flex-end" }}>
										<Text style={{ color: theme.colors.muted }}>{secure ? "Show" : "Hide"} password</Text>
									</Pressable>
								</View>
							)}
						/>

						<Controller
							control={control}
							name="confirmPassword"
							render={({ field: { onChange, value } }) => (
								<Input label="Confirm Password" secureTextEntry={secure} value={value} onChangeText={onChange} error={errors.confirmPassword?.message} />
							)}
						/>

						<Controller
							control={control}
							name="acceptTerms"
							render={({ field: { onChange, value } }) => (
								<Pressable onPress={() => onChange(!value)} style={{ flexDirection:"row", alignItems:"center", gap:10 }}>
									<View style={{
										width: 20, height: 20, borderRadius: 6,
										borderWidth: 1, borderColor: "#334155",
										alignItems: "center", justifyContent: "center",
										backgroundColor: value ? theme.colors.primary : "transparent"
									}}>
										{value ? <Text style={{ color: "#0b1116", fontWeight: "800" }}>✓</Text> : null}
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

						<View style={{ height:1, backgroundColor:"#1f2937", marginVertical:6 }} />
						<Text style={{ color: theme.colors.muted, textAlign:"center" }}>Or continue with</Text>
						<View style={{ flexDirection:"row", gap:12, justifyContent:"center" }}>
							<Pressable style={{ padding:12, borderRadius:12, backgroundColor:"#0f172a" }}>
								<Text style={{ color:"white" }}>Google</Text>
							</Pressable>
							<Pressable style={{ padding:12, borderRadius:12, backgroundColor:"#0f172a" }}>
								<Text style={{ color:"white" }}>Apple</Text>
							</Pressable>
						</View>

						<Pressable onPress={() => navigation.navigate("Login")}>
							<Text style={{ color: theme.colors.muted, textAlign:"center" }}>Already have an account? Sign in</Text>
						</Pressable>
					</ScrollView>
				</Pressable>
			</KeyboardAvoidingView>
		</Gradient>
	);
}