import type { NavigatorScreenParams } from "@react-navigation/native";
import { RiderAvailableOrder } from "../types/order";

export type AuthStackParamList = {
	Splash: undefined;
	Onboarding: undefined;
	Login: undefined;
	Register: undefined;
	ForgotPassword: undefined;
}

export type AppTabParamList = {
    Home: undefined;
    Earnings: undefined;
    History: undefined;
    Profile: undefined;
}

export type RootStackParamList = {
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
    AppTabs: NavigatorScreenParams<AppTabParamList>;
    LocationPermission: undefined;
    Home: undefined;
    OrderDetail: {
        order: RiderAvailableOrder;
        orderStatus: 'going_to_pickup' | 'picked_up' | 'delivering' | 'delivered';
        onStatusChange?: (status: 'picked_up' | 'delivered' | 'cancelled') => void;
    };
    History: undefined;
    OrderHistoryDetail: { orderId: string };
    // Profile screens
    EditProfile: undefined;
    ChangePassword: undefined;
    Settings: undefined;
    Support: undefined;
    Legal: undefined;
    Notifications: undefined;
    AppPreferences: undefined;
};