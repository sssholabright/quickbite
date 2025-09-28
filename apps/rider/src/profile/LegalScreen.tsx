import React, { useState } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";
import AlertModal from "../ui/AlertModal";

type LegalNav = NativeStackNavigationProp<RootStackParamList, 'Legal'>;

export default function LegalScreen() {
	const theme = useTheme();
	const navigation = useNavigation<LegalNav>();

	// AlertModal state
	const [alertModal, setAlertModal] = useState({
		visible: false,
		title: '',
		message: '',
		type: 'info' as 'success' | 'error' | 'warning' | 'info',
		onConfirm: () => {},
		onCancel: undefined as (() => void) | undefined,
		confirmText: 'OK',
		cancelText: 'Cancel',
		showCancel: false,
	});

	const showAlert = (
		title: string,
		message: string,
		type: 'success' | 'error' | 'warning' | 'info' = 'info',
		onConfirm?: () => void,
		onCancel?: () => void,
		confirmText: string = 'OK',
		cancelText: string = 'Cancel',
		showCancel: boolean = false
	) => {
		setAlertModal({
			visible: true,
			title,
			message,
			type,
			onConfirm: onConfirm || (() => setAlertModal(prev => ({ ...prev, visible: false }))),
			onCancel: onCancel || (() => setAlertModal(prev => ({ ...prev, visible: false }))),
			confirmText,
			cancelText,
			showCancel,
		});
	};

	const renderLegalItem = (
		icon: string,
		title: string,
		subtitle?: string,
		onPress?: () => void,
		disabled?: boolean
	) => (
		<Pressable
			onPress={disabled ? () => showAlert('Coming Soon', `${title} will be available in a future update.`, 'info') : onPress}
			style={{
				flexDirection: "row",
				alignItems: "center",
				backgroundColor: theme.colors.surface,
				borderRadius: 12,
				padding: 16,
				marginBottom: 12,
				borderWidth: 1,
				borderColor: theme.colors.border,
				opacity: disabled ? 0.5 : 1,
			}}
		>
			<View style={{
				width: 35,
				height: 35,
				borderRadius: 17.5,
				backgroundColor: theme.colors.primary + '20',
				alignItems: "center",
				justifyContent: "center",
				marginRight: 16,
			}}>
				<Icon name={icon} size={18} color={disabled ? theme.colors.muted : theme.colors.primary} />
			</View>
			<View style={{ flex: 1 }}>
				<Text style={{
					fontSize: 14,
					fontWeight: "600",
					color: disabled ? theme.colors.muted : theme.colors.text,
					marginBottom: subtitle ? 2 : 0,
				}}>
					{title}
				</Text>
				{subtitle && (
					<Text style={{
						fontSize: 12,
						color: disabled ? theme.colors.muted : theme.colors.text,
					}}>
						{subtitle}
					</Text>
				)}
			</View>
			<Icon name="chevron-forward" size={18} color={disabled ? theme.colors.muted : theme.colors.text} />
		</Pressable>
	);

	const handleTermsOfService = () => {
		showAlert(
			"Terms of Service",
			"Terms of Service document will be available soon. Please contact our support team for more information.",
			'info'
		);
	};

	const handlePrivacyPolicy = () => {
		showAlert(
			"Privacy Policy",
			"Privacy Policy document will be available soon. Please contact our support team for more information.",
			'info'
		);
	};

	const handleRiderAgreement = () => {
		showAlert(
			"Rider Agreement",
			"Rider Agreement document will be available soon. Please contact our support team for more information.",
			'info'
		);
	};

	const handleAppVersion = () => {
		showAlert(
			"App Version",
			"QuickBite Rider v1.0.0\n\nBuilt with React Native and Expo\n\nFor support, please contact our team.",
			'info'
		);
	};

	const handleLastUpdated = () => {
		showAlert(
			"Last Updated",
			"Last updated: September 2025\n\nThis version includes:\n• Push notifications\n• Real-time order tracking\n• Theme customization\n• Enhanced security",
			'info'
		);
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
					<Icon name="arrow-back" size={20} color={theme.colors.text} />
				</Pressable>
				<Text style={{
					fontSize: 16,
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
						fontSize: 16,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Terms & Conditions
					</Text>

					{renderLegalItem(
						"document-text",
						"Terms of Service",
						"Coming Soon",
						handleTermsOfService,
						true
					)}

					{renderLegalItem(
						"shield-checkmark",
						"Privacy Policy",
						"Coming Soon",
						handlePrivacyPolicy,
						true
					)}

					{renderLegalItem(
						"document",
						"Rider Agreement",
						"Coming Soon",
						handleRiderAgreement,
						true
					)}
				</View>

				{/* App Info */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 16,
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
						handleAppVersion,
						false
					)}

					{renderLegalItem(
						"calendar",
						"Last Updated",
						"September 2025",
						handleLastUpdated,
						false
					)}
				</View>
			</ScrollView>

			{/* AlertModal */}
			<AlertModal
				visible={alertModal.visible}
				title={alertModal.title}
				message={alertModal.message}
				type={alertModal.type}
				onConfirm={alertModal.onConfirm}
				onCancel={alertModal.onCancel}
				confirmText={alertModal.confirmText}
				cancelText={alertModal.cancelText}
				showCancel={alertModal.showCancel}
			/>
		</SafeAreaWrapper>
	);
}