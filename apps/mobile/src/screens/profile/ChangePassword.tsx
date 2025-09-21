import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../../navigation/types";
import { useTheme } from "../../theme/theme";
import { Icon } from "../../ui/Icon";
import { SafeAreaWrapper } from "../../ui/SafeAreaWrapper";
import { CTAButton } from "../../ui/CTAButton";
import { Input } from "../../ui/Input";
import AlertModal from "../../ui/AlertModal";
import { useAuthStore } from "../../stores/auth";

type ChangePasswordNav = NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;

export default function ChangePassword() {
	const theme = useTheme();
	const navigation = useNavigation<ChangePasswordNav>();
	const { changePassword, isChangingPassword, error, clearError, logout } = useAuthStore();
	
	const [passwords, setPasswords] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});

	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false,
	});

	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");

	// Show error modal when there's an error
	React.useEffect(() => {
		if (error) {
			setErrorMessage(error);
			setShowErrorModal(true);
		}
	}, [error]);

	// Validate form
	const validateForm = useCallback(() => {
		if (!passwords.currentPassword.trim()) {
			setErrorMessage("Current password is required");
			setShowErrorModal(true);
			return false;
		}

		if (!passwords.newPassword.trim()) {
			setErrorMessage("New password is required");
			setShowErrorModal(true);
			return false;
		}

		if (passwords.newPassword.length < 8) {
			setErrorMessage("New password must be at least 8 characters long");
			setShowErrorModal(true);
			return false;
		}

		if (passwords.newPassword !== passwords.confirmPassword) {
			setErrorMessage("New passwords don't match");
			setShowErrorModal(true);
			return false;
		}

		if (passwords.currentPassword === passwords.newPassword) {
			setErrorMessage("New password must be different from current password");
			setShowErrorModal(true);
			return false;
		}

		return true;
	}, [passwords]);

	// Show confirmation modal
	const handleChangePress = useCallback(() => {
		if (validateForm()) {
			setShowConfirmModal(true);
		}
	}, [validateForm]);

	// Confirm and change password
	const confirmChangePassword = useCallback(async () => {
		try {
			setShowConfirmModal(false);
			
			await changePassword({
				currentPassword: passwords.currentPassword.trim(),
				newPassword: passwords.newPassword.trim(),
				confirmPassword: passwords.confirmPassword.trim(),
			});

			setShowSuccessModal(true);

			// Log out user after successful password change
			await logout();
		} catch (error: any) {
			console.error("Change password error: ", error);
			setErrorMessage(error.message || "Failed to change password");
			setShowErrorModal(true);
		}
	}, [passwords, changePassword, logout]);

	// Memoized handlers
	const handleSuccessConfirm = useCallback(() => {
		setShowSuccessModal(false);
		// Navigate to login screen instead of going back
		navigation.reset({
			index: 0,
			routes: [{ name: 'AuthStack' }],
		});
	}, [navigation]);

	const handleErrorConfirm = useCallback(() => {
		setShowErrorModal(false);
		clearError();
	}, [clearError]);

	const handleCancelConfirm = useCallback(() => {
		setShowConfirmModal(false);
	}, []);

	// Password input handlers
	const handleCurrentPasswordChange = useCallback((text: string) => {
		setPasswords(prev => ({ ...prev, currentPassword: text }));
	}, []);

	const handleNewPasswordChange = useCallback((text: string) => {
		setPasswords(prev => ({ ...prev, newPassword: text }));
	}, []);

	const handleConfirmPasswordChange = useCallback((text: string) => {
		setPasswords(prev => ({ ...prev, confirmPassword: text }));
	}, []);

	// Toggle password visibility
	const togglePasswordVisibility = useCallback((field: 'current' | 'new' | 'confirm') => {
		setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
	}, []);

	return (
		<SafeAreaWrapper>
			<ScrollView style={{ flex: 1, backgroundColor: theme.colors.background }}>
				{/* Header */}
				<View style={{
					flexDirection: 'row',
					alignItems: 'center',
					paddingHorizontal: 20,
					paddingVertical: 16,
					borderBottomWidth: 1,
					borderBottomColor: theme.colors.border,
				}}>
					<Pressable
						onPress={() => navigation.goBack()}
						style={{
							width: 40,
							height: 40,
							borderRadius: 20,
							backgroundColor: theme.colors.surface,
							alignItems: 'center',
							justifyContent: 'center',
							marginRight: 12,
						}}
					>
						<Icon name="arrow-back" size={20} color={theme.colors.text} />
					</Pressable>
					<Text style={{
						fontSize: 18,
						fontWeight: '700',
						color: theme.colors.text,
					}}>
						Change Password
					</Text>
				</View>

				{/* Form Fields */}
				<View style={{ paddingHorizontal: 20, paddingTop: 24 }}>
					{/* Current Password */}
					<View style={{ marginBottom: 0 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: '600',
							color: theme.colors.text,
							marginBottom: 8,
						}}>
							Current Password
						</Text>
						<View style={{ position: 'relative' }}>
							<Input
								value={passwords.currentPassword}
								onChangeText={handleCurrentPasswordChange}
								placeholder="Enter current password"
								secureTextEntry={!showPasswords.current}
								editable={!isChangingPassword}
							/>
							<Pressable
								onPress={() => togglePasswordVisibility('current')}
								style={{
									position: 'absolute',
									right: 12,
									top: 12,
									padding: 4,
								}}
							>
								<Icon 
									name={showPasswords.current ? "eye-off" : "eye"} 
									size={20} 
									color={theme.colors.muted} 
								/>
							</Pressable>
						</View>
					</View>

					{/* New Password */}
					<View style={{ marginBottom: 20 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: '600',
							color: theme.colors.text,
							marginBottom: 8,
						}}>
							New Password
						</Text>
						<View style={{ position: 'relative' }}>
							<Input
								value={passwords.newPassword}
								onChangeText={handleNewPasswordChange}
								placeholder="Enter new password"
								secureTextEntry={!showPasswords.new}
								editable={!isChangingPassword}
							/>
							<Pressable
								onPress={() => togglePasswordVisibility('new')}
								style={{
									position: 'absolute',
									right: 12,
									top: 12,
									padding: 4,
								}}
							>
								<Icon 
									name={showPasswords.new ? "eye-off" : "eye"} 
									size={20} 
									color={theme.colors.muted} 
								/>
							</Pressable>
						</View>
						<Text style={{
							fontSize: 12,
							color: theme.colors.muted,
						}}>
							Must be at least 8 characters with uppercase, lowercase, number, and special character
						</Text>
					</View>

					{/* Confirm Password */}
					<View style={{ marginBottom: 20 }}>
						<Text style={{
							fontSize: 16,
							fontWeight: '600',
							color: theme.colors.text,
							marginBottom: 8,
						}}>
							Confirm New Password
						</Text>
						<View style={{ position: 'relative' }}>
							<Input
								value={passwords.confirmPassword}
								onChangeText={handleConfirmPasswordChange}
								placeholder="Confirm new password"
								secureTextEntry={!showPasswords.confirm}
								editable={!isChangingPassword}
							/>
							<Pressable
								onPress={() => togglePasswordVisibility('confirm')}
								style={{
									position: 'absolute',
									right: 12,
									top: 12,
									padding: 4,
								}}
							>
								<Icon 
									name={showPasswords.confirm ? "eye-off" : "eye"} 
									size={20} 
									color={theme.colors.muted} 
								/>
							</Pressable>
						</View>
					</View>
				</View>

				{/* Change Password Button */}
				<View style={{ paddingHorizontal: 20, paddingBottom: 40 }}>
					<CTAButton 
						title={isChangingPassword ? "Changing..." : "Change Password"} 
						onPress={handleChangePress}
						disabled={isChangingPassword}
					/>
				</View>
			</ScrollView>

			{/* Confirmation Modal */}
			<AlertModal
				visible={showConfirmModal}
				title="Change Password"
				message="Are you sure you want to change your password? You will need to log in again with your new password."
				type="warning"
				onConfirm={confirmChangePassword}
				onCancel={handleCancelConfirm}
				confirmText="Yes, Change"
				cancelText="Cancel"
				showCancel={true}
			/>

			{/* Success Modal */}
			<AlertModal
				visible={showSuccessModal}
				title="Password Changed! 🔒"
				message="Your password has been changed successfully. You have been logged out for security reasons."
				type="success"
				onConfirm={handleSuccessConfirm}
			/>

			{/* Error Modal */}
			<AlertModal
				visible={showErrorModal}
				title="Change Failed"
				message={errorMessage}
				type="error"
				onConfirm={handleErrorConfirm}
			/>
		</SafeAreaWrapper>
	);
}