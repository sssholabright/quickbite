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

type EditProfileNav = NativeStackNavigationProp<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen() {
	const theme = useTheme();
	const navigation = useNavigation<EditProfileNav>();
	
	const [profile, setProfile] = useState({
		name: "John Rider",
		phone: "+2348012345678",
		email: "rider@example.com",
	});

	const saveProfile = () => {
		// TODO: Call API to save profile
		Alert.alert("Success", "Profile updated successfully", [
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
					Edit Profile
				</Text>
			</View>

			<ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
				{/* Profile Photo */}
				<View style={{
					alignItems: "center",
					marginBottom: 32,
				}}>
					<View style={{
						width: 100,
						height: 100,
						borderRadius: 50,
						backgroundColor: theme.colors.primary + '20',
						alignItems: "center",
						justifyContent: "center",
						marginBottom: 16,
					}}>
						<Icon name="person" size={50} color={theme.colors.primary} />
					</View>
					<CTAButton 
						title="Change Photo" 
						onPress={() => Alert.alert("Change Photo", "Photo upload coming soon")}
						style={{ paddingHorizontal: 20, paddingVertical: 8 }}
					/>
				</View>

				{/* Basic Info */}
				<View style={{
					backgroundColor: theme.colors.surface,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: theme.colors.border,
					padding: 16,
					marginBottom: 16,
				}}>
					<Text style={{
						fontSize: 18,
						fontWeight: "600",
						color: theme.colors.text,
						marginBottom: 16,
					}}>
						Basic Information
					</Text>

					<Input
						value={profile.name}
						onChangeText={(text) => setProfile(prev => ({ ...prev, name: text }))}
						placeholder="Full name"
						label="Full Name"
					/>

					<Input
						value={profile.phone}
						onChangeText={(text) => setProfile(prev => ({ ...prev, phone: text }))}
						placeholder="Phone number"
						label="Phone Number"
						keyboardType="phone-pad"
					/>

					<Input
						value={profile.email}
						onChangeText={(text) => setProfile(prev => ({ ...prev, email: text }))}
						placeholder="Email address"
						label="Email Address"
						keyboardType="email-address"
					/>
				</View>

				{/* Save Button */}
				<CTAButton 
					title="Save Changes" 
					onPress={saveProfile}
				/>
			</ScrollView>
		</SafeAreaWrapper>
	);
}