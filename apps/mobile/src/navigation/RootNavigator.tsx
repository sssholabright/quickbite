import { useEffect } from 'react';
import { DefaultTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { linking } from './Linking';
import { useAuthStore } from '../stores/auth';
import LoginScreen from '../screens/auth/LoginScreen';
import HomeScreen from '../screens/home/HomeScreen';
import OrdersScreen from '../screens/order/OrdersScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';
import { theme } from '../theme/theme';
import { Text } from 'react-native';
import { Icon } from '../ui/Icon';


const navTheme: Theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: theme.colors.background }
};

const RootStack = createNativeStackNavigator();
const AuthStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function AuthStackNavigator() {
    return (
        <AuthStack.Navigator>
            <AuthStack.Screen name="Login" component={LoginScreen} options={{ title: "Login" }} />
        </AuthStack.Navigator>
    );
}

function AppTabs() {
    return (
        <Tab.Navigator 
            screenOptions={({ route }) => ({
                headerTitleAlign: "center",
                tabBarActiveTintColor: theme.colors.primary,
                tabBarInactiveTintColor: "#6b7280",
                tabBarIcon: ({ color, size, focused }) => {
                    if (route.name === "Home") {
                        return <Icon set='ion' name={focused ? "home" : "home-outline"} color={color} size={size} />
                    }
                    if (route.name === "Orders") {
						return <Icon set="mi" name={focused ? "receipt-long" : "receipt-long"} color={color} size={size} />
					}
                    // Profile
					return <Icon set="ion" name={focused ? "person" : "person-outline"} color={color} size={size} />;
                } 
            })}>
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Home" }} />
            <Tab.Screen name="Orders" component={OrdersScreen} options={{ title: "Orders" }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: "Profile" }} />
        </Tab.Navigator>
    )
}

export default function RootNavigator() {
    const { token, hydrated, hydrate } = useAuthStore();

    useEffect(() => {
        void hydrate();
    }, [hydrate]);

    if (!hydrated) {
        return <Text style={{ marginTop: 50, textAlign: "center" }}>Loading...</Text>
    }

    return (
        <NavigationContainer linking={linking} theme={navTheme}>
            <RootStack.Navigator screenOptions={{ headerShown: false }}>
                {token ? (
                    <RootStack.Screen name="AppTabs" component={AppTabs} />
                ) : (
                    <RootStack.Screen name="AuthStack" component={AuthStackNavigator} />
                )}
            </RootStack.Navigator>
        </NavigationContainer>
    )
}