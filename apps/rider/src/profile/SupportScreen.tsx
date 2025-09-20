import React from "react";
import { View, Text, ScrollView, Pressable, Alert, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";

type SupportNav = NativeStackNavigationProp<RootStackParamList, 'Support'>;

export default function SupportScreen() {
	const theme = useTheme();
	const navigation = useNavigation<SupportNav>();

	const renderSupportItem = (
		icon: string,
		title: string,
		subtitle?: string,
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
			<Icon name="chevron-forward" size={20} color={theme.colors.muted} />
		</Pressable>
	);

	const handleCallSupport = () => {
		Alert.alert(
			"Call Support",
			"Call admin dispatch?",
			[
				{ text: "Cancel", style: "cancel" },
				{ text: "Call", onPress: () => Linking.openURL("tel:+2348012345678") }
			]
		);
	};

	const handleWhatsApp = () => {
		Linking.openURL("https://wa.me/2348012345678");
	};

	const handleEmail = () => {
		Linking.openURL("mailto:support@quickbite.com");
	};

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
					Help & Support
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				{/* Quick Contact */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Quick Contact
					</Text>

					{renderSupportItem(
						"call",
						"Call Admin Dispatch",
						"Direct line to admin support",
						handleCallSupport
					)}

					{renderSupportItem(
						"chatbubble-ellipses",
						"WhatsApp Support",
						"Chat with us on WhatsApp",
						handleWhatsApp
					)}

					{renderSupportItem(
						"mail",
						"Email Support",
						"Send us an email",
						handleEmail
					)}
				</View>

				{/* Help Resources */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Help Resources
					</Text>

					{renderSupportItem(
						"help-circle",
						"FAQ",
						"Frequently asked questions",
						() => Alert.alert("FAQ", "FAQ coming soon")
					)}

					{renderSupportItem(
						"book",
						"Rider Guide",
						"Complete guide for riders",
						() => Alert.alert("Rider Guide", "Guide coming soon")
					)}

					{renderSupportItem(
						"information-circle",
						"App Tutorial",
						"Learn how to use the app",
						() => Alert.alert("Tutorial", "Tutorial coming soon")
					)}
				</View>

				{/* Emergency */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Emergency
					</Text>

					{renderSupportItem(
						"warning",
						"Emergency Contact",
						"Call in case of emergency",
						() => Alert.alert(
							"Emergency",
							"Call emergency services?",
							[
								{ text: "Cancel", style: "cancel" },
								{ text: "Call", onPress: () => Linking.openURL("tel:911") }
							]
						)
					)}
				</View>
			</ScrollView>
		</SafeAreaWrapper>
	);
}