import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Switch, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";

type SettingsNav = NativeStackNavigationProp<RootStackParamList, 'Settings'>;

export default function SettingsScreen() {
	const theme = useTheme();
	const navigation = useNavigation<SettingsNav>();
	
	const [settings, setSettings] = useState({
		notifications: {
			newOrders: true,
			orderUpdates: true,
			sound: true,
			vibration: true,
		},
		app: {
			darkMode: false,
			language: "English",
		},
	});

	const renderSettingItem = (
		icon: string,
		title: string,
		subtitle?: string,
		rightComponent?: React.ReactNode,
		onPress?: () => void
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
			{rightComponent || (onPress && (
				<Icon name="chevron-forward" size={20} color={theme.colors.muted} />
			))}
		</Pressable>
	);

	return (
		<SafeAreaWrapper>
			{/* Header */}
			<View style={{
				flexDirection: "row",
				alignItems: "center",
				paddingHorizontal: 16,
				paddingVertical: 12,
				borderBottomWidth: 1,
				borderBottomColor: theme.colors.border,
			}}>
				<Pressable onPress={() => navigation.goBack()} style={{ marginRight: 16 }}>
					<Icon name="arrow-back" size={24} color={theme.colors.text} />
				</Pressable>
				<Text style={{
					fontSize: 18,
					fontWeight: "600",
					color: theme.colors.text,
				}}>
					Settings
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				{/* Notifications */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Notifications
					</Text>

					{renderSettingItem(
						"notifications",
						"New Order Alerts",
						"Get notified about new orders",
						<Switch
							value={settings.notifications.newOrders}
							onValueChange={(value) => setSettings(prev => ({
								...prev,
								notifications: { ...prev.notifications, newOrders: value }
							}))}
							trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
							thumbColor={settings.notifications.newOrders ? theme.colors.primary : theme.colors.muted}
						/>
					)}

					{renderSettingItem(
						"refresh",
						"Order Updates",
						"Get notified about order status changes",
						<Switch
							value={settings.notifications.orderUpdates}
							onValueChange={(value) => setSettings(prev => ({
								...prev,
								notifications: { ...prev.notifications, orderUpdates: value }
							}))}
							trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
							thumbColor={settings.notifications.orderUpdates ? theme.colors.primary : theme.colors.muted}
						/>
					)}

					{renderSettingItem(
						"volume-high",
						"Sound",
						"Play sound for notifications",
						<Switch
							value={settings.notifications.sound}
							onValueChange={(value) => setSettings(prev => ({
								...prev,
								notifications: { ...prev.notifications, sound: value }
							}))}
							trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
							thumbColor={settings.notifications.sound ? theme.colors.primary : theme.colors.muted}
						/>
					)}

					{renderSettingItem(
						"phone-portrait",
						"Vibration",
						"Vibrate for notifications",
						<Switch
							value={settings.notifications.vibration}
							onValueChange={(value) => setSettings(prev => ({
								...prev,
								notifications: { ...prev.notifications, vibration: value }
							}))}
							trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
							thumbColor={settings.notifications.vibration ? theme.colors.primary : theme.colors.muted}
						/>
					)}
				</View>

				{/* App Preferences */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						App Preferences
					</Text>

					{renderSettingItem(
						"moon",
						"Dark Mode",
						"Use dark theme",
						<Switch
							value={settings.app.darkMode}
							onValueChange={(value) => setSettings(prev => ({
								...prev,
								app: { ...prev.app, darkMode: value }
							}))}
							trackColor={{ false: theme.colors.border, true: theme.colors.primary + '40' }}
							thumbColor={settings.app.darkMode ? theme.colors.primary : theme.colors.muted}
						/>
					)}

					{renderSettingItem(
						"language",
						"Language",
						settings.app.language,
						undefined,
						() => Alert.alert("Language", "Language selection coming soon")
					)}
				</View>

				{/* System Actions */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						System Actions
					</Text>

					{renderSettingItem(
						"trash",
						"Clear Cache",
						"Free up storage space",
						undefined,
						() => Alert.alert("Clear Cache", "Cache cleared successfully")
					)}

					{renderSettingItem(
						"refresh-circle",
						"Reset App",
						"Reset all settings to default",
						undefined,
						() => Alert.alert(
							"Reset App",
							"Are you sure you want to reset all settings?",
							[
								{ text: "Cancel", style: "cancel" },
								{ text: "Reset", style: "destructive", onPress: () => console.log("Reset app") }
							]
						)
					)}
				</View>
			</ScrollView>
		</SafeAreaWrapper>
	);
}