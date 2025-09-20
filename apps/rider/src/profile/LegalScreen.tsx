import React from "react";
import { View, Text, ScrollView, Pressable, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";

type LegalNav = NativeStackNavigationProp<RootStackParamList, 'Legal'>;

export default function LegalScreen() {
	const theme = useTheme();
	const navigation = useNavigation<LegalNav>();

	const renderLegalItem = (
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
					Legal
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				{/* Terms & Conditions */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Terms & Conditions
					</Text>

					{renderLegalItem(
						"document-text",
						"Terms of Service",
						"Read our terms and conditions",
						() => Alert.alert("Terms of Service", "Terms coming soon")
					)}

					{renderLegalItem(
						"shield-checkmark",
						"Privacy Policy",
						"How we protect your data",
						() => Alert.alert("Privacy Policy", "Privacy policy coming soon")
					)}

					{renderLegalItem(
						"document",
						"Rider Agreement",
						"Terms specific to riders",
						() => Alert.alert("Rider Agreement", "Rider agreement coming soon")
					)}
				</View>

				{/* Compliance */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Compliance
					</Text>

					{renderLegalItem(
						"checkmark-circle",
						"Code of Conduct",
						"Rider behavior guidelines",
						() => Alert.alert("Code of Conduct", "Code of conduct coming soon")
					)}

					{renderLegalItem(
						"car",
						"Vehicle Requirements",
						"Vehicle safety and compliance",
						() => Alert.alert("Vehicle Requirements", "Vehicle requirements coming soon")
					)}

					{renderLegalItem(
						"id-card",
						"Documentation",
						"Required documents and licenses",
						() => Alert.alert("Documentation", "Documentation requirements coming soon")
					)}
				</View>

				{/* App Info */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						App Information
					</Text>

					{renderLegalItem(
						"information-circle",
						"App Version",
						"1.0.0",
						() => Alert.alert("App Version", "QuickBite Rider v1.0.0")
					)}

					{renderLegalItem(
						"build",
						"Build Number",
						"100",
						() => Alert.alert("Build Number", "Build 100")
					)}

					{renderLegalItem(
						"calendar",
						"Last Updated",
						"December 2024",
						() => Alert.alert("Last Updated", "December 2024")
					)}
				</View>
			</ScrollView>
		</SafeAreaWrapper>
	);
}