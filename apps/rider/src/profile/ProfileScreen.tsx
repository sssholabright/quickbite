import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { useAuthStore } from "../stores/auth";
import { Icon } from "../ui/Icon";
import { CTAButton } from "../ui/CTAButton";

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
	const theme = useTheme();
	const navigation = useNavigation<ProfileNav>();
	const logout = useAuthStore((s) => s.logout);

	// Mock rider data
	const [riderData] = useState({
		name: "John Rider",
		phone: "+2348012345678",
		email: "rider@example.com",
		riderId: "RID-001",
		status: "Active" as "Active" | "Suspended",
		photo: null,
	});

	const renderProfileItem = (
		icon: string,
		title: string,
		subtitle?: string,
		onPress?: () => void,
		showArrow = true
	) => (
		<Pressable
			onPress={onPress}
			style={{
				flexDirection: "row",
				alignItems: "center",
				backgroundColor: theme.colors.surface,
				borderRadius: 12,
				padding: 16,
				marginBottom: 12,
				borderWidth: 1,
				borderColor: theme.colors.border,
			}}
		>
			<View style={{
				width: 40,
				height: 40,
				borderRadius: 20,
				backgroundColor: theme.colors.primary + '20',
				alignItems: "center",
				justifyContent: "center",
				marginRight: 16,
			}}>
				<Icon name={icon} size={20} color={theme.colors.primary} />
			</View>
			<View style={{ flex: 1 }}>
				<Text style={{
					fontSize: 16,
					fontWeight: "600",
					color: theme.colors.text,
					marginBottom: subtitle ? 2 : 0,
				}}>
					{title}
				</Text>
				{subtitle && (
					<Text style={{
						fontSize: 14,
						color: theme.colors.muted,
					}}>
						{subtitle}
					</Text>
				)}
			</View>
			{showArrow && onPress && (
				<Icon name="chevron-forward" size={20} color={theme.colors.muted} />
			)}
		</Pressable>
	);

	return (
        <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				{/* Header */}
				<View style={{
					flexDirection: "row",
					alignItems: "center",
					marginBottom: 24,
				}}>
					<View style={{
						width: 60,
						height: 60,
						borderRadius: 30,
						backgroundColor: theme.colors.primary + '20',
						alignItems: "center",
						justifyContent: "center",
						marginRight: 16,
					}}>
						<Icon name="person" size={30} color={theme.colors.primary} />
					</View>
					<View style={{ flex: 1 }}>
						<Text style={{
							fontSize: 20,
							fontWeight: "700",
							color: theme.colors.text,
							marginBottom: 4,
						}}>
							{riderData.name}
						</Text>
						<Text style={{
							fontSize: 14,
							color: theme.colors.muted,
						}}>
							Rider ID: {riderData.riderId}
						</Text>
						<View style={{
							flexDirection: "row",
							alignItems: "center",
							marginTop: 4,
						}}>
							<View style={{
								width: 8,
								height: 8,
								borderRadius: 4,
								backgroundColor: riderData.status === "Active" ? "#10B981" : "#EF4444",
								marginRight: 6,
							}} />
							<Text style={{
								fontSize: 12,
								color: riderData.status === "Active" ? "#10B981" : "#EF4444",
								fontWeight: "600",
							}}>
								{riderData.status}
							</Text>
						</View>
					</View>
				</View>

				{/* Profile Actions */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Profile
					</Text>

					{renderProfileItem(
						"person-circle",
						"Edit Profile",
						"Update your basic information",
						() => navigation.navigate("EditProfile")
					)}

					{renderProfileItem(
						"lock-closed",
						"Change Password",
						"Update your password",
						() => navigation.navigate("ChangePassword")
					)}
				</View>

				{/* Settings */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Settings
					</Text>

					{renderProfileItem(
						"settings",
						"App Settings",
						"Notifications, preferences & more",
						() => navigation.navigate("Settings")
					)}
				</View>

				{/* Support */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Support
					</Text>

					{renderProfileItem(
						"help-circle",
						"Help & Support",
						"Get help and contact support",
						() => navigation.navigate("Support")
					)}

					{renderProfileItem(
						"document-text",
						"Legal",
						"Terms, Privacy Policy & more",
						() => navigation.navigate("Legal")
					)}
				</View>

				{/* Logout */}
				<CTAButton 
					title="Logout" 
					onPress={() => {
						Alert.alert(
							"Logout",
							"Are you sure you want to logout?",
							[
								{ text: "Cancel", style: "cancel" },
								{ text: "Logout", style: "destructive", onPress: logout }
							]
						);
					}}
					style={{ backgroundColor: "#EF4444" }}
				/>
			</ScrollView>
		</View>
	);
}