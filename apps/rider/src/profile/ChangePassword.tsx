import React, { useState } from "react";
import { View, Text, ScrollView, Alert, Pressable } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/types";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";
import { SafeAreaWrapper } from "../ui/SafeAreaWrapper";
import { CTAButton } from "../ui/CTAButton";
import { Input } from "../ui/Input";

type ChangePasswordNav = NativeStackNavigationProp<RootStackParamList, 'ChangePassword'>;

export default function ChangePasswordScreen() {
	const theme = useTheme();
	const navigation = useNavigation<ChangePasswordNav>();
	
	const [passwords, setPasswords] = useState({
		current: "",
		new: "",
		confirm: "",
	});

	const [errors, setErrors] = useState({
		current: "",
		new: "",
		confirm: "",
	});

	const validatePasswords = () => {
		const newErrors = { current: "", new: "", confirm: "" };
		let isValid = true;

		if (!passwords.current) {
			newErrors.current = "Current password is required";
			isValid = false;
		}

		if (!passwords.new) {
			newErrors.new = "New password is required";
			isValid = false;
		} else if (passwords.new.length < 6) {
			newErrors.new = "Password must be at least 6 characters";
			isValid = false;
		}

		if (!passwords.confirm) {
			newErrors.confirm = "Please confirm your new password";
			isValid = false;
		} else if (passwords.new !== passwords.confirm) {
			newErrors.confirm = "Passwords do not match";
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	const changePassword = () => {
		if (!validatePasswords()) return;

		// TODO: Call API to change password
		Alert.alert("Success", "Password changed successfully", [
			{ text: "OK", onPress: () => navigation.goBack() }
		]);
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
					Change Password
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				<View style={{
					backgroundColor: theme.colors.surface,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: theme.colors.border,
					padding: 16,
				}}>
					<Input
						value={passwords.current}
						onChangeText={(text) => setPasswords(prev => ({ ...prev, current: text }))}
						placeholder="Enter current password"
						label="Current Password"
						secureTextEntry
						error={errors.current}
					/>

					<Input
						value={passwords.new}
						onChangeText={(text) => setPasswords(prev => ({ ...prev, new: text }))}
						placeholder="Enter new password"
						label="New Password"
						secureTextEntry
						error={errors.new}
					/>

					<Input
						value={passwords.confirm}
						onChangeText={(text) => setPasswords(prev => ({ ...prev, confirm: text }))}
						placeholder="Confirm new password"
						label="Confirm New Password"
						secureTextEntry
						error={errors.confirm}
					/>

					<CTAButton 
						title="Change Password" 
						onPress={changePassword}
					/>
				</View>
			</ScrollView>
		</SafeAreaWrapper>
	);
}