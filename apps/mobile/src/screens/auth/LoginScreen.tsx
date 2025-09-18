import { useState } from "react";
import { Alert, Keyboard, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuthStore } from "../../stores/auth";
import { mockLogin } from "../../lib/mockAuth";
import { useTheme } from "../../theme/theme";
import { Gradient } from "../../ui/Gradient";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

const schema = z.object({
	identifier: z.string().min(3, "Enter email or phone"),
	password: z.string().min(6, "Min 6 characters")
});

type FormValues = z.infer<typeof schema>;

export default function LoginScreen() {
	const [loading, setLoading] = useState(false);
	const login = useAuthStore((s) => s.login);
	const theme = useTheme();
	const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, "Login">>();

	const { register, handleSubmit, setValue, formState: { errors } } = useForm<FormValues>({
		resolver: zodResolver(schema), defaultValues: { identifier: "", password: "" }
	});

	const onSubmit = async (v: FormValues) => {
		try {
			setLoading(true);
			const token = await mockLogin(v.identifier, v.password);
			await login(token);
		} catch (e: any) {
			Alert.alert("Login failed", e.message ?? "Try again");
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
						contentContainerStyle={{ flexGrow: 1, justifyContent: "center", padding: 20, gap: 18 }}
						keyboardShouldPersistTaps="handled"
					>
						<Text style={{ color: theme.colors.text, fontSize:28, fontWeight: "800" }}>Welcome back</Text>
						<Input
							label="Email or Phone"
							autoCapitalize="none"
							onChangeText={(t) => setValue("identifier", t)}
							{...register("identifier")}
							error={errors.identifier?.message}
						/>
						<Input
							label="Password"
							secureTextEntry
							onChangeText={(t) => setValue("password", t)}
							{...register("password")}
							error={errors.password?.message}
						/>
						<CTAButton title={loading ? "Signing in..." : "Sign In"} onPress={handleSubmit(onSubmit)} />
						<Pressable onPress={() => navigation.navigate("ForgotPassword")}>
							<Text style={{ color: theme.colors.muted, textAlign:"center" }}>Forgot password?</Text>
						</Pressable>

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

						<Pressable onPress={() => navigation.navigate("Register")}>
							<Text style={{ color: theme.colors.muted, textAlign:"center" }}>New here? Create account</Text>
						</Pressable>
					</ScrollView>
				</Pressable>
			</KeyboardAvoidingView>
		</Gradient>
	);
}