import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTheme } from "../../theme/theme";
import { useAuthStore } from "../../stores/auth";
import { Icon } from "../../ui/Icon";
import { CTAButton } from "../../ui/CTAButton";
import AlertModal from "../../ui/AlertModal";
import type { RootStackParamList } from "../../navigation/types";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";

type ProfileNav = NativeStackNavigationProp<RootStackParamList>;

interface AlertState {
    visible: boolean;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    showCancel?: boolean;
    confirmText?: string;
    cancelText?: string;
}

export default function ProfileScreen() {
	const theme = useTheme();
	const navigation = useNavigation<ProfileNav>();
	const logout = useAuthStore((s) => s.logout);
	const { user } = useAuthStore();

	// Alert modal state
	const [alert, setAlert] = useState<AlertState>({
		visible: false,
		title: '',
		message: '',
		type: 'info'
	});

	// Helper function to show alert
	const showAlert = (alertData: Omit<AlertState, 'visible'>) => {
		setAlert({
			...alertData,
			visible: true
		});
	};

	// Helper function to hide alert
	const hideAlert = () => {
		setAlert(prev => ({ ...prev, visible: false }));
	};

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
				width: 35,
				height: 35,
				borderRadius: 20,
				backgroundColor: theme.colors.primary + '20',
				alignItems: "center",
				justifyContent: "center",
				marginRight: 16,
			}}>
				<Icon name={icon} size={16} color={theme.colors.primary} />
			</View>
			<View style={{ flex: 1 }}>
				<Text style={{
					fontSize: 14,
					fontWeight: "600",
					color: theme.colors.text,
					marginBottom: subtitle ? 2 : 0,
				}}>
					{title}
				</Text>
				{subtitle && (
					<Text style={{
						fontSize: 12,
						color: theme.colors.muted,
					}}>
						{subtitle}
					</Text>
				)}
			</View>
			{showArrow && onPress && (
				<Icon name="chevron-forward" size={16} color={theme.colors.muted} />
			)}
		</Pressable>
	);

	const handleLogout = () => {
		showAlert({
			title: 'Logout',
			message: 'Are you sure you want to logout?',
			type: 'warning',
			confirmText: 'Logout',
			cancelText: 'Cancel',
			showCancel: true,
			onConfirm: () => {
				hideAlert();
				logout();
			},
			onCancel: hideAlert
		});
	};

	return (
		<SafeAreaWrapper statusBarStyle='light'>
			<View style={{ flex: 1, backgroundColor: theme.colors.background, paddingHorizontal: 5 }}>
				<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
					{/* Header */}
					<View style={{
						flexDirection: "row",
						alignItems: "center",
						marginBottom: 24,
					}}>
						<View style={{
							width: 50,
							height: 50,
							borderRadius: 30,
							backgroundColor: theme.colors.primary + '20',
							alignItems: "center",
							justifyContent: "center",
							marginRight: 16,
						}}>
							<Icon name="person" size={25} color={theme.colors.primary} />
						</View>
						<View style={{ flex: 1 }}>
							<Text style={{
								fontSize: 18,
								fontWeight: "700",
								color: theme.colors.text,
								marginBottom: 4,
								textTransform: 'capitalize'
							}}>
								{user?.name}
							</Text>
							<Text style={{
								fontSize: 12,
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
					<View style={{ marginBottom: 5 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: "600",
							color: theme.colors.text,
							marginBottom: 10,
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
					{/* <View style={{ marginBottom: 5 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: "600",
							color: theme.colors.text,
							marginBottom: 10,
						}}>
							Account
						</Text>

						{renderProfileItem(
							"location",
							"Addresses",
							"Manage your delivery addresses",
							() => navigation.navigate("AddressManagement")
						)}
					</View> */}

					{/* Settings */}
					<View style={{ marginBottom: 5 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: "600",
							color: theme.colors.text,
							marginBottom: 10,
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
					<View style={{ marginBottom: 5 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: "600",
							color: theme.colors.text,
							marginBottom: 10,
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
						onPress={handleLogout}
						style={{ backgroundColor: theme.colors.danger }}
					/>
				</ScrollView>

				{/* Alert Modal */}
				<AlertModal
					visible={alert.visible}
					title={alert.title}
					message={alert.message}
					type={alert.type}
					onConfirm={alert.onConfirm || hideAlert}
					onCancel={alert.onCancel}
					confirmText={alert.confirmText}
					cancelText={alert.cancelText}
					showCancel={alert.showCancel}
				/>
			</View>
		</SafeAreaWrapper>
	);
}