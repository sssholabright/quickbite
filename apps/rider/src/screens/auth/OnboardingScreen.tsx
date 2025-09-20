import React from "react";
import { View, Text, ScrollView, Image } from "react-native";
import { useTheme } from "../../theme/theme";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { CTAButton } from "../../ui/CTAButton";
import { useAuthStore } from "../../stores/auth";

export default function OnboardingScreen() {
	const theme = useTheme();
	const markOnboardingSeen = useAuthStore((s) => s.markOnboardingSeen);

	const handleGetStarted = () => {
		markOnboardingSeen();
	};

	return (
		<SafeAreaWrapper>
			<ScrollView contentContainerStyle={{ flex: 1, padding: 24, justifyContent: "center" }}>
				<View style={{ alignItems: "center", marginBottom: 48 }}>
					<View style={{
						width: 120,
						height: 120,
						borderRadius: 60,
						backgroundColor: theme.colors.primary + '20',
						alignItems: "center",
						justifyContent: "center",
						marginBottom: 24,
					}}>
						<Text style={{ fontSize: 48 }}>🏍️</Text>
					</View>
					
					<Text style={{
						fontSize: 28,
						fontWeight: "700",
						color: theme.colors.text,
						textAlign: "center",
						marginBottom: 16,
					}}>
						Welcome to QuickBite Rider
					</Text>
					
					<Text style={{
						fontSize: 16,
						color: theme.colors.muted,
						textAlign: "center",
						lineHeight: 24,
					}}>
						Start earning by delivering food orders to customers. 
						Flexible hours, competitive pay, and be your own boss.
					</Text>
				</View>

				<View style={{ gap: 16 }}>
					<View style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: theme.colors.surface,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: theme.colors.border,
					}}>
						<Text style={{ fontSize: 24, marginRight: 16 }}>💰</Text>
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>
								Earn Money
							</Text>
							<Text style={{ fontSize: 14, color: theme.colors.muted }}>
								Flexible earnings with each delivery
							</Text>
						</View>
					</View>

					<View style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: theme.colors.surface,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: theme.colors.border,
					}}>
						<Text style={{ fontSize: 24, marginRight: 16 }}>⏰</Text>
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>
								Flexible Hours
							</Text>
							<Text style={{ fontSize: 14, color: theme.colors.muted }}>
								Work when you want, where you want
							</Text>
						</View>
					</View>

					<View style={{
						flexDirection: "row",
						alignItems: "center",
						backgroundColor: theme.colors.surface,
						borderRadius: 12,
						padding: 16,
						borderWidth: 1,
						borderColor: theme.colors.border,
					}}>
						<Text style={{ fontSize: 24, marginRight: 16 }}>🚀</Text>
						<View style={{ flex: 1 }}>
							<Text style={{ fontSize: 16, fontWeight: "600", color: theme.colors.text }}>
								Easy Start
							</Text>
							<Text style={{ fontSize: 14, color: theme.colors.muted }}>
								Simple onboarding and quick approval
							</Text>
						</View>
					</View>
				</View>

				<View style={{ marginTop: 48 }}>
					<CTAButton 
						title="Get Started" 
						onPress={handleGetStarted}
					/>
				</View>
			</ScrollView>
		</SafeAreaWrapper>
	);
}