import { useEffect } from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { linking } from './Linking';
import { useAuthStore } from '../stores/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/order/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Text } from 'react-native';
import { Icon } from '../ui/Icon';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';
import { useTheme } from '../theme/theme';
import type { AuthStackParamList } from "../navigation/types";
import MenuScreen from '../screens/menu/MenuScreen';
import { SafeAreaWrapper } from '../ui/SafeAreaWrapper';
import CheckoutScreen from '../screens/checkout/CheckoutScreen';
import type { RootStackParamList } from "./types";
import OrderConfirmationScreen from '../screens/order/OrderConfirmationScreen';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

function AuthStackNavigator() {
	const hasSeenOnboarding = useAuthStore((s) => s.hasSeenOnboarding);
	const theme = useTheme();

	return (
		<SafeAreaWrapper statusBarStyle="light">
			<AuthStack.Navigator
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
		</SafeAreaWrapper>
	);
}

function AppTabs() {
	const theme = useTheme();
	return (
		<SafeAreaWrapper>
			<Tab.Navigator 
				screenOptions={({ route }) => ({
					headerTitleAlign: "center",
					headerStyle: { backgroundColor: theme.colors.surface },
					headerTintColor: theme.colors.text,
					headerTitleStyle: { fontWeight: "700" },
					headerShadowVisible: false,
					tabBarActiveTintColor: theme.colors.primary,
					tabBarInactiveTintColor: theme.colors.muted,
					tabBarStyle: { 
						backgroundColor: theme.colors.surface, 
						borderTopColor: theme.colors.border,
						paddingBottom: 8,
						paddingTop: 8,
						height: 60
					},
					tabBarIcon: ({ color, size, focused }) => {
						if (route.name === "Home") return <Icon set='ion' name={focused ? "home" : "home-outline"} color={color} size={size} />
						if (route.name === "Orders") return <Icon set="mi" name={"receipt-long"} color={color} size={size} />
						return <Icon set="ion" name={focused ? "person" : "person-outline"} color={color} size={size} />;
					}
				})}>
				<Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
				<Tab.Screen name="Orders" component={OrdersScreen} options={{ title: "Orders" }} />
				<Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
			</Tab.Navigator>
		</SafeAreaWrapper>
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
		<NavigationContainer linking={linking} theme={navTheme}>
			<RootStack.Navigator screenOptions={{ headerShown: false }}>
				{token ? (
					<RootStack.Screen name="AppTabs" component={AppTabs} />
				) : (
					<RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
				)}
                <RootStack.Screen name="Menu" component={MenuScreen} options={{ headerShown: false }} />
				<RootStack.Screen 
					name="Checkout" 
					component={CheckoutScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="OrderConfirmation" 
					component={OrderConfirmationScreen} 
					options={{ headerShown: false }} 
				/>
			</RootStack.Navigator>
		</NavigationContainer>
	)
}