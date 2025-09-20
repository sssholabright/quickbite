import React, { useState } from "react";
import { View, Text, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { Input } from "../../ui/Input";
import { CTAButton } from "../../ui/CTAButton";
import { useAuthStore } from "../../stores/auth";
import type { AuthStackParamList } from "../../navigation/types";

type LoginNav = NativeStackNavigationProp<AuthStackParamList, 'Login'>;

export default function LoginScreen() {
	const theme = useTheme();
	const navigation = useNavigation<LoginNav>();
	const login = useAuthStore((s) => s.login);
	
	const [credentials, setCredentials] = useState({
		email: "",
		password: "",
	});
	const [loading, setLoading] = useState(false);

	const handleLogin = async () => {
		if (!credentials.email || !credentials.password) {
			Alert.alert("Error", "Please fill in all fields");
			return;
		}

		setLoading(true);
		try {
			// TODO: Replace with actual API call
			await new Promise(resolve => setTimeout(resolve, 1000));
			login("mock-token");
		} catch (error) {
			Alert.alert("Error", "Login failed. Please try again.");
		} finally {
			setLoading(false);
		}
	};

	return (
		<SafeAreaWrapper>
			<View style={{ flex: 1, padding: 24, justifyContent: "center" }}>
				<View style={{ marginBottom: 48 }}>
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

				<View style={{ gap: 16, marginBottom: 24 }}>
					<Input
						value={credentials.email}
						onChangeText={(text) => setCredentials(prev => ({ ...prev, email: text }))}
						placeholder="Email address"
						label="Email"
						keyboardType="email-address"
						autoCapitalize="none"
					/>

					<Input
						value={credentials.password}
						onChangeText={(text) => setCredentials(prev => ({ ...prev, password: text }))}
						placeholder="Password"
						label="Password"
						secureTextEntry
					/>
				</View>

				<Pressable
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
				</Pressable>

				<CTAButton 
					title="Sign In" 
					onPress={handleLogin}
					loading={loading}
				/>

				<View style={{ flexDirection: "row", justifyContent: "center", marginTop: 24 }}>
					<Text style={{ color: theme.colors.muted, fontSize: 14 }}>
						Don't have an account?{" "}
					</Text>
					<Pressable onPress={() => navigation.navigate("Register")}>
						<Text style={{
							color: theme.colors.primary,
							fontSize: 14,
							fontWeight: "500",
						}}>
							Sign Up
						</Text>
					</Pressable>
				</View>
			</View>
		</SafeAreaWrapper>
	);
}