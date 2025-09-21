import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { useAuthStore } from "../../stores/auth";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import type { RootStackParamList } from "../../navigation/types";

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
	const theme = useTheme();
	const navigation = useNavigation<ProfileNav>();
	const logout = useAuthStore((s) => s.logout);
	const { user } = useAuthStore()

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
		<View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 5 }}>
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
							textTransform: 'capitalize'
						}}>
							{user?.name}
						</Text>
						<Text style={{
							fontSize: 14,
							color: theme.colors.muted,
						}}>
							Phone: {user?.phone}
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
								backgroundColor: user?.isActive ? "#10B981" : "#EF4444",
								marginRight: 6,
							}} />
							<Text style={{
								fontSize: 12,
								color: user?.isActive ? "#10B981" : "#EF4444",
								fontWeight: "600",
							}}>
								{user?.isActive ? "Active" : "Inactive"}
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

				{/* Account */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Account
					</Text>

					{renderProfileItem(
						"location",
						"Addresses",
						"Manage your delivery addresses",
						() => navigation.navigate("AddressManagement")
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

				{/* App Info */}
				<View style={{
					backgroundColor: theme.colors.surface,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: theme.colors.border,
					padding: 16,
					marginBottom: 16,
				}}>
					<Text style={{
						fontSize: 16,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 8,
					}}>
						QuickBite
					</Text>
					<Text style={{
						fontSize: 14,
						color: theme.colors.muted,
						marginBottom: 4,
					}}>
						Version 1.0.0
					</Text>
					<Text style={{
						fontSize: 14,
						color: theme.colors.muted,
					}}>
						Made with ❤️ for students
					</Text>
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