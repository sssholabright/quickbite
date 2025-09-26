import React, { useState } from "react";
import { View, Text, ScrollView, Pressable, Linking } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";
import AlertModal from "../ui/AlertModal";

type SupportNav = NativeStackNavigationProp<RootStackParamList, 'Support'>;

export default function SupportScreen() {
	const theme = useTheme();
	const navigation = useNavigation<SupportNav>();

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

	const renderSupportItem = (
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

	const handleWhatsApp = () => {
		showAlert(
			"WhatsApp Support",
			"Open WhatsApp to chat with our support team?",
			'info',
			() => {
				setAlertModal(prev => ({ ...prev, visible: false }));
				Linking.openURL("https://wa.me/2348012345678");
			},
			() => setAlertModal(prev => ({ ...prev, visible: false })),
			"Open WhatsApp",
			"Cancel",
			true
		);
	};

	const handleEmail = () => {
		showAlert(
			"Email Support",
			"Open your email app to send us a message?",
			'info',
			() => {
				setAlertModal(prev => ({ ...prev, visible: false }));
				Linking.openURL("mailto:support@quickbite.com");
			},
			() => setAlertModal(prev => ({ ...prev, visible: false })),
			"Open Email",
			"Cancel",
			true
		);
	};

	const handleFAQ = () => {
		showAlert(
			"FAQ",
			"Frequently Asked Questions will be available soon. For now, please contact our support team for assistance.",
			'info',
			() => handleWhatsApp(),
			() => setAlertModal(prev => ({ ...prev, visible: false })),
			"Contact Support",
			"Close",
			true
		);
	};

	const handleRiderGuide = () => {
		showAlert(
			"Rider Guide",
			"The complete rider guide will be available soon. For now, please contact our support team for guidance.",
			'info',
			() => handleWhatsApp(),
			() => setAlertModal(prev => ({ ...prev, visible: false })),
			"Contact Support",
			"Close",
			true
		);
	};

	const handleAppTutorial = () => {
		showAlert(
			"App Tutorial",
			"The app tutorial will be available soon. For now, please contact our support team for help using the app.",
			'info',
			() => handleWhatsApp(),
			() => setAlertModal(prev => ({ ...prev, visible: false })),
			"Contact Support",
			"Close",
			true
		);
	};

	const handleEmergency = () => {
		showAlert(
			"Emergency Contact",
			"Call emergency services?",
			'warning',
			() => {
				setAlertModal(prev => ({ ...prev, visible: false }));
				Linking.openURL("tel:911");
			},
			() => setAlertModal(prev => ({ ...prev, visible: false })),
			"Call 911",
			"Cancel",
			true
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
					Help & Support
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				{/* Quick Contact */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 16,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Quick Contact
					</Text>

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
						fontSize: 16,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Help Resources
					</Text>

					{renderSupportItem(
						"help-circle",
						"FAQ",
						"Frequently Asked Questions",
						// "Coming Soon",
						handleFAQ,
						false
					)}

					{renderSupportItem(
						"book",
						"Rider Guide",
						"Coming Soon",
						handleRiderGuide,
						true
					)}

					{renderSupportItem(
						"information-circle",
						"App Tutorial",
						"Coming Soon",
						handleAppTutorial,
						true
					)}
				</View>

				{/* Emergency */}
				<View style={{ marginBottom: 24 }}>
					<Text style={{
						fontSize: 16,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Emergency
					</Text>

					{renderSupportItem(
						"warning",
						"Emergency Contact",
						"Coming Soon",
						handleEmergency,
						true
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