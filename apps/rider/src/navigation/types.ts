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
    History: undefined; // Move this here
    Profile: undefined;
}

export type RootStackParamList = {
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
    AppTabs: NavigatorScreenParams<AppTabParamList>;
    Home: undefined;
    OrderDetail: {
        order: RiderAvailableOrder;
        orderStatus: 'going_to_pickup' | 'picked_up' | 'delivering' | 'delivered';
        onStatusChange?: (status: 'picked_up' | 'delivered' | 'cancelled') => void;
    };
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