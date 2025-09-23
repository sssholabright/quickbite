import { useEffect } from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuthStore } from '../stores/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import { Text } from 'react-native';
import { Icon } from '../ui/Icon';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { useTheme } from '../theme/theme';
import type { AuthStackParamList } from "../navigation/types";
import { SafeAreaWrapper } from '../ui/SafeAreaWrapper';
import type { RootStackParamList } from "./types";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import EarningsScreen from '../screens/earnings/EarningsScreen';
import ProfileScreen from '../profile/ProfileScreen';
import EditProfileScreen from '../profile/EditProfileScreen';
import ChangePasswordScreen from '../profile/ChangePassword';
import SettingsScreen from '../profile/SettingsScreen';
import SupportScreen from '../profile/SupportScreen';
import LegalScreen from '../profile/LegalScreen';
import HistoryScreen from '../screens/history/HistoryScreen';
import OrderHistoryDetailScreen from '../screens/history/OrderHistoryDetailScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

function AuthStackNavigator() {
	const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
	const theme = useTheme();

	return (
		<AuthStack.Navigator
			id={undefined}
			key={hasSeenOnboarding ? "seen" : "new"}
			initialRouteName={hasSeenOnboarding ? "Login" : "Onboarding"}
			screenOptions={{
				headerStyle: { backgroundColor: theme.colors.surface },
				headerTintColor: theme.colors.text,
				headerTitleStyle: { fontWeight: "700" },
				headerTitleAlign: "center",
				headerShadowVisible: false
			}}
		>
			<AuthStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
			<AuthStack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
			<AuthStack.Screen name="Register" component={RegisterScreen} options={{ title: "Register" }} />
			<AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ title: "Forgot Password" }} />
		</AuthStack.Navigator>
	);
}

function AppTabs() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<>
			<StatusBar style={theme.mode === 'dark' ? 'light' : 'dark'} />
			<Tab.Navigator
				id={undefined}
				screenOptions={({ route }) => ({
					headerShown: route.name !== "Home",
					headerStyle: { 
						backgroundColor: theme.colors.surface,
						height: 80,
						borderBottomWidth: 0,
						elevation: 0,
						shadowOpacity: 0,
					},
					headerTintColor: theme.colors.text,
					headerTitleStyle: { 
						fontWeight: "700",
						fontSize: 18,
					},
					headerTitleAlign: "center",
					headerShadowVisible: false,
					tabBarActiveTintColor: theme.colors.primary,
					tabBarInactiveTintColor: theme.colors.muted,
					tabBarStyle: {
						backgroundColor: theme.colors.surface,
						borderTopColor: theme.colors.border,
						height: 56 + insets.bottom,
						paddingTop: 0,
						paddingBottom: 8,
					},
					tabBarSafeAreaInsets: { bottom: insets.bottom },
					tabBarIcon: ({ color, size, focused }) => {
						if (route.name === "Home") return <Icon set='ion' name={focused ? "home" : "home-outline"} color={color} size={size} />
						if (route.name === "Earnings") return <Icon set="ion" name={focused ? "cash" : "cash-outline"} color={color} size={size} />
						if (route.name === "History") return <Icon set="ion" name={focused ? "time" : "time-outline"} color={color} size={size} />
						if (route.name === "Profile") return <Icon set="ion" name={focused ? "person" : "person-outline"} color={color} size={size} />
						return <Icon set="ion" name="home" color={color} size={size} />
					}
				})}
			>
				<Tab.Screen name="Home" component={HomeScreen} />
				<Tab.Screen name="Earnings" component={EarningsScreen} />
				<Tab.Screen name="History" component={HistoryScreen} />
				<Tab.Screen name="Profile" component={ProfileScreen} />
			</Tab.Navigator>
		</>
	);
}

export default function RootNavigator() {
	const { token, hydrated, hydrate } = useAuthStore();
	const appTheme = useTheme();

	useEffect(() => { void hydrate(); }, [hydrate]);

	if (!hydrated) {
		return (
			<SafeAreaWrapper>
				<Text style={{ marginTop: 50, textAlign: "center", color: appTheme.colors.text }}>Loading...</Text>
			</SafeAreaWrapper>
		);
	}

	const navTheme: Theme = appTheme.mode === "dark"
		? { ...DarkTheme, colors: { ...DarkTheme.colors, background: appTheme.colors.background, card: appTheme.colors.surface, text: appTheme.colors.text, border: appTheme.colors.border, primary: appTheme.colors.primary } }
		: { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: appTheme.colors.background, card: appTheme.colors.surface, text: appTheme.colors.text, border: appTheme.colors.border, primary: appTheme.colors.primary } };

	return (
		<NavigationContainer theme={navTheme}>
			<RootStack.Navigator id={undefined} screenOptions={{ headerShown: false }}>
				{token ? (
					<RootStack.Screen name="AppTabs" component={AppTabs} />
				) : (
					<RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
				)}
				
				{/* Order Screens */}
				<RootStack.Screen 
					name="OrderDetail" 
					component={OrderDetailScreen} 
					options={{ headerShown: false }} 
				/>
				
				{/* Profile Screens */}
				<RootStack.Screen 
					name="EditProfile" 
					component={EditProfileScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="ChangePassword" 
					component={ChangePasswordScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="Settings" 
					component={SettingsScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="Support" 
					component={SupportScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="Legal" 
					component={LegalScreen} 
					options={{ headerShown: false }} 
				/>

				{/* History Screens */}
				<RootStack.Screen 
					name="OrderHistoryDetail" 
					component={OrderHistoryDetailScreen} 
					options={{ headerShown: false }} 
				/>
			</RootStack.Navigator>
		</NavigationContainer>
	)
}