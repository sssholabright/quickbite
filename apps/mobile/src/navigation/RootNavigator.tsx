import { useEffect, useRef, useState } from 'react';
import { DefaultTheme, DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { linking } from './Linking';
import { useAuthStore } from '../stores/auth';
import { useLocationStore, useIsLocationReady } from '../stores/location';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/order/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { Text, View, ActivityIndicator, StatusBar } from 'react-native';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import OrderDetailScreen from '../screens/order/OrderDetailScreen';
import AddressManagementScreen from '../screens/profile/AddressManagementScreen';
import SettingsScreen from '../screens/profile/SettingsScreen';
import AddAddressScreen from '../screens/profile/AddAddressScreen';
import EditAddressScreen from '../screens/profile/EditAddressScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ChangePasswordScreen from '../screens/profile/ChangePassword';
import SupportScreen from '../screens/profile/SupportScreen';
import LegalScreen from '../screens/profile/LegalScreen';
import { useThemeStore } from '../stores/theme';
import LocationPermissionScreen from '../screens/auth/LocationPermissionScreen';
import notificationService from '../services/notificationService';

const RootStack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator();

function AuthStackNavigator() {
	const theme = useTheme();
	const { hasSeenOnboarding } = useAuthStore();

	return (
		<>
			<StatusBar backgroundColor={theme.mode === 'dark' ? 'light' : 'dark'} barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
			<AuthStack.Navigator
				initialRouteName={hasSeenOnboarding ? "Login" : "Onboarding"}
				screenOptions={{
					headerShown: false,
					headerStyle: { backgroundColor: theme.colors.surface },
					headerTintColor: theme.colors.text,
					headerTitleStyle: { fontWeight: "700" },
					headerTitleAlign: "center",
					headerShadowVisible: false
				}}
			>
				<AuthStack.Screen name="Onboarding" component={OnboardingScreen} options={{ headerShown: false }} />
				<AuthStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
				<AuthStack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
				<AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} options={{ headerShown: false }} />
			</AuthStack.Navigator>
		</>
	);
}

function AppTabs() {
	const theme = useTheme();
	const insets = useSafeAreaInsets();

	return (
		<>
			<StatusBar backgroundColor={theme.mode === 'dark' ? 'light' : 'dark'} barStyle={theme.mode === 'dark' ? 'light-content' : 'dark-content'} />
			<Tab.Navigator
				id={undefined}
				screenOptions={({ route }) => ({
					headerShown: route.name === "Profile",
					headerStyle: route.name === "Profile" ? { 
						backgroundColor: theme.colors.surface,
						height: 85,
						borderBottomWidth: 0,
						elevation: 0,
						shadowOpacity: 0,
					} : {
						height: 0,
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
						height: 60 + insets.bottom,
						paddingTop: 8,
						paddingBottom: insets.bottom,
					},
					tabBarIcon: ({ color, size, focused }) => {
						if (route.name === "Home") return <Icon set='ion' name={focused ? "home" : "home-outline"} color={color} size={size} />
						if (route.name === "Orders") return <Icon set="mi" name={"receipt-long"} color={color} size={size} />
						return <Icon set="ion" name={focused ? "person" : "person-outline"} color={color} size={size} />
					}
				})}
			>
				<Tab.Screen name="Home" component={HomeScreen} />
				<Tab.Screen name="Orders" component={OrdersScreen} />
				<Tab.Screen name="Profile" component={ProfileScreen} />
			</Tab.Navigator>
		</>
	);
}

function LoadingScreen() {
	const theme = useTheme();
	
	return (
		<SafeAreaWrapper>
			<View style={{ 
				flex: 1, 
				justifyContent: 'center', 
				alignItems: 'center',
				backgroundColor: theme.colors.background 
			}}>
				<ActivityIndicator size="large" color={theme.colors.primary} />
				<Text style={{ 
					marginTop: 16, 
					color: theme.colors.text,
					fontSize: 16 
				}}>
					Loading...
				</Text>
			</View>
		</SafeAreaWrapper>
	);
}

export default function RootNavigator() {
	const { isAuthenticated, isLoading, hydrated, hydrate } = useAuthStore();
	const { 
		checkLocationStatus, 
		isLocationEnabled, 
		isLocationPermissionGranted, 
		currentLocation
	} = useLocationStore();
	const appTheme = useTheme();
	const navigationRef = useRef<any>(null);
	
	// 🚀 NEW: State to track location checking
	const [isCheckingLocation, setIsCheckingLocation] = useState(true);
	const [locationCheckTimeout, setLocationCheckTimeout] = useState(false);
	const [hasNavigatedToApp, setHasNavigatedToApp] = useState(false);

	useEffect(() => { 
		void hydrate();
	}, [hydrate]);

	// 🚀 ENHANCED: Background location check with timeout
	useEffect(() => {
		if (isAuthenticated && hydrated) {
			checkLocationInBackground();
		}
	}, [isAuthenticated, hydrated]);

	// 🚀 ENHANCED: Auto-navigate when location becomes ready (using individual states)
	useEffect(() => {
		const isLocationReady = isLocationEnabled && isLocationPermissionGranted && currentLocation;
		
		if (isAuthenticated && hydrated && isLocationReady && !hasNavigatedToApp) {
			console.log('📍 Location ready, auto-navigating to app...');
			console.log('📍 Location states:', { isLocationEnabled, isLocationPermissionGranted, currentLocation });
			setHasNavigatedToApp(true);
			setIsCheckingLocation(false);
			setLocationCheckTimeout(false);
		}
	}, [isAuthenticated, hydrated, isLocationEnabled, isLocationPermissionGranted, currentLocation, hasNavigatedToApp]);

	// 🚀 NEW: Background location check with timeout
	const checkLocationInBackground = async () => {
		try {
			setIsCheckingLocation(true);
			setLocationCheckTimeout(false);
			setHasNavigatedToApp(false);
			
			console.log('📍 Checking location in background...');
			
			// Check location status
			await checkLocationStatus();
			
			// Set a timeout to show permission screen if location takes too long
			const timeoutId = setTimeout(() => {
				console.log('📍 Location check timeout, showing permission screen');
				setLocationCheckTimeout(true);
				setIsCheckingLocation(false);
			}, 3000); // 3 second timeout
			
			// Clear timeout if location is ready quickly
			const checkLocationReady = () => {
				const { isLocationEnabled, isLocationPermissionGranted, currentLocation } = useLocationStore.getState();
				if (isLocationEnabled && isLocationPermissionGranted && currentLocation) {
					console.log('📍 Location ready quickly, clearing timeout');
					clearTimeout(timeoutId);
					setIsCheckingLocation(false);
					setLocationCheckTimeout(false);
				}
			};
			
			// Check immediately and then every 500ms for 3 seconds
			checkLocationReady();
			const intervalId = setInterval(() => {
				checkLocationReady();
			}, 500);
			
			// Clean up interval after 3 seconds
			setTimeout(() => {
				clearInterval(intervalId);
			}, 3000);
			
		} catch (error) {
			console.error('❌ Background location check failed:', error);
			setIsCheckingLocation(false);
			setLocationCheckTimeout(true);
		}
	};

	// 🚀 NEW: Set navigation reference for notifications
	useEffect(() => {
		if (navigationRef.current) {
			notificationService.setNavigationRef(navigationRef);
		}
	}, []);

	// Wait for auth to be hydrated
	if (!hydrated || isLoading) {
		return <LoadingScreen />;
	}

	const navTheme: Theme = appTheme.mode === "dark"
		? { ...DarkTheme, colors: { ...DarkTheme.colors, background: appTheme.colors.background, card: appTheme.colors.surface, text: appTheme.colors.text, border: appTheme.colors.border, primary: appTheme.colors.primary } }
		: { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: appTheme.colors.background, card: appTheme.colors.surface, text: appTheme.colors.text, border: appTheme.colors.border, primary: appTheme.colors.primary } };

	// 🚀 ENHANCED: Show loading while checking location, then decide
	const shouldShowLocationPermission = isAuthenticated && 
		(isCheckingLocation ? false : (!isLocationEnabled || !isLocationPermissionGranted || !currentLocation || locationCheckTimeout));

	return (
		<NavigationContainer linking={linking} theme={navTheme} ref={navigationRef}>
			<RootStack.Navigator screenOptions={{ headerShown: false }}>
				{isAuthenticated ? (
					shouldShowLocationPermission ? (
						<RootStack.Screen name="LocationPermission" component={LocationPermissionScreen} />
					) : (
						<RootStack.Screen name="AppTabs" component={AppTabs} />
					)
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
				<RootStack.Screen 
					name="OrderDetail" 
					component={OrderDetailScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="AddressManagement" 
					component={AddressManagementScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="Settings" 
					component={SettingsScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="AddAddress" 
					component={AddAddressScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="EditAddress" 
					component={EditAddressScreen} 
					options={{ headerShown: false }} 
				/>
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
					name="Support" 
					component={SupportScreen} 
					options={{ headerShown: false }} 
				/>
				<RootStack.Screen 
					name="Legal" 
					component={LegalScreen} 
					options={{ headerShown: false }} 
				/>
			</RootStack.Navigator>
		</NavigationContainer>
	);
}