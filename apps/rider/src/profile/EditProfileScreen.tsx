import React, { useState, useEffect, useCallback } from "react";
import { View, Text, ScrollView, Pressable, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";
import { CTAButton } from "../ui/CTAButton";
import { Input } from "../ui/Input";
// import AlertModal from "../ui/AlertModal";
import { useAuthStore } from "../stores/auth";

type EditProfileNav = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
	const theme = useTheme();
	const navigation = useNavigation<EditProfileNav>();
	const { user, updateProfile, isUpdatingProfile, error, clearError } = useAuthStore();
	
	const [profile, setProfile] = useState({
		name: "",
		phone: "",
		email: "",
	});

	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [showSuccessModal, setShowSuccessModal] = useState(false);
	const [showErrorModal, setShowErrorModal] = useState(false);
	const [errorMessage, setErrorMessage] = useState("");
	const [isInitialized, setIsInitialized] = useState(false);

	// Load user data only once when component mounts
	useEffect(() => {
		if (user && !isInitialized) {
			setProfile({
				name: user.name || "",
				phone: user.phone || "",
				email: user.email || "",
			});
			setIsInitialized(true);
		}
	}, [user, isInitialized]);

	// Clear error when component unmounts
	useEffect(() => {
		return () => {
			clearError();
		};
	}, [clearError]);

	// Show error modal when there's an error
	useEffect(() => {
		if (error) {
			setErrorMessage(error);
			setShowErrorModal(true);
		}
	}, [error]);

	// Validate form
	const validateForm = useCallback(() => {
		if (!profile.name.trim()) {
			setErrorMessage("Name is required");
			setShowErrorModal(true);
			return false;
		}

		if (!profile.phone.trim()) {
			setErrorMessage("Phone number is required");
			setShowErrorModal(true);
			return false;
		}

		return true;
	}, [profile.name, profile.phone]);

	// Show confirmation modal
	const handleSavePress = useCallback(() => {
		if (validateForm()) {
			setShowConfirmModal(true);
		}
	}, [validateForm]);

	// Confirm and save profile
	const confirmSaveProfile = useCallback(async () => {
		try {
			setShowConfirmModal(false);
			
			// Call API to update profile
			await updateProfile({
				name: profile.name.trim(),
				phone: profile.phone.trim(),
			});

			setShowSuccessModal(true);
		} catch (error: any) {
			setErrorMessage(error.message || "Failed to update profile");
			setShowErrorModal(true);
		}
	}, [profile.name, profile.phone, updateProfile]);

	// Memoized handlers to prevent unnecessary re-renders
	const handleSuccessConfirm = useCallback(() => {
		setShowSuccessModal(false);
		navigation.goBack();
	}, [navigation]);

	const handleErrorConfirm = useCallback(() => {
		setShowErrorModal(false);
		clearError();
	}, [clearError]);

	const handleCancelConfirm = useCallback(() => {
		setShowConfirmModal(false);
	}, []);

	// Memoized profile update handlers
	const handleNameChange = useCallback((text: string) => {
		setProfile(prev => ({ ...prev, name: text }));
	}, []);

	const handlePhoneChange = useCallback((text: string) => {
		setProfile(prev => ({ ...prev, phone: text }));
	}, []);

	const handleEmailChange = useCallback((text: string) => {
		setProfile(prev => ({ ...prev, email: text }));
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
						Edit Profile
					</Text>
				</View>

				{/* Profile Picture Section */}
				<View style={{
					alignItems: 'center',
					paddingVertical: 32,
					backgroundColor: theme.colors.surface,
					marginBottom: 24,
				}}>
					<View style={{
						width: 100,
						height: 100,
						borderRadius: 50,
						backgroundColor: theme.colors.primary,
						alignItems: 'center',
						justifyContent: 'center',
						marginBottom: 16,
					}}>
						<Icon name="person" size={40} color="#fff" />
					</View>
					<Pressable style={{
						flexDirection: 'row',
						alignItems: 'center',
						paddingHorizontal: 16,
						paddingVertical: 8,
						borderRadius: 20,
						backgroundColor: theme.colors.background,
						borderWidth: 1,
						borderColor: theme.colors.border,
					}}>
						<Icon name="camera" size={16} color={theme.colors.primary} />
						<Text style={{
							marginLeft: 8,
							fontSize: 14,
							fontWeight: '600',
							color: theme.colors.primary,
						}}>
							Change Photo
						</Text>
					</Pressable>
				</View>

				{/* Form Fields */}
				<View style={{ paddingHorizontal: 20 }}>
					<Input
						value={profile.name}
						onChangeText={handleNameChange}
						placeholder="Full name"
						label="Full Name"
						editable={!isUpdatingProfile}
					/>

					<Input
						value={profile.phone}
						onChangeText={handlePhoneChange}
						placeholder="Phone number"
						label="Phone Number"
						keyboardType="phone-pad"
						editable={!isUpdatingProfile}
					/>

					<Input
						value={profile.email}
						onChangeText={handleEmailChange}
						placeholder="Email address"
						label="Email Address"
						keyboardType="email-address"
						editable={false}
						style={{ opacity: 0.6 }}
					/>
				</View>

				{/* Save Button with Loading Indicator */}
				<View style={{ paddingHorizontal: 20, paddingTop: 32, paddingBottom: 40 }}>
					<View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
						{isUpdatingProfile && (
							<View style={{ marginRight: 12 }}>
								<ActivityIndicator size={20} color={theme.colors.primary} />
							</View>
						)}
						<CTAButton 
							title={isUpdatingProfile ? "Saving..." : "Save Changes"} 
							onPress={handleSavePress}
							disabled={isUpdatingProfile}
							style={{ paddingHorizontal: 20, paddingVertical: 10, borderRadius: 8 }}
						/>
					</View>
				</View>
			</ScrollView>

			{/* Confirmation Modal */}
			{/* <AlertModal
				visible={showConfirmModal}
				title="Confirm Changes"
				message="Are you sure you want to update your profile information?"
				type="info"
				onConfirm={confirmSaveProfile}
				onCancel={handleCancelConfirm}
				confirmText="Yes, Update"
				cancelText="Cancel"
				showCancel={true}
			/> */}

			{/* Success Modal */}
			{/* <AlertModal
				visible={showSuccessModal}
				title="Profile Updated! 🎉"
				message="Your profile has been updated successfully."
				type="success"
				onConfirm={handleSuccessConfirm}
			/> */}

			{/* Error Modal */}
			{/* <AlertModal
				visible={showErrorModal}
				title="Update Failed"
				message={errorMessage}
				type="error"
				onConfirm={handleErrorConfirm}
			/> */}
		</SafeAreaWrapper>
	);
}