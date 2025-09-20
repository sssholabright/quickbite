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
    Orders: undefined;
    Profile: undefined;
}

export type RootStackParamList = {
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
    AppTabs: NavigatorScreenParams<AppTabParamList>;
    OrderDetail: { order: RiderAvailableOrder };
    // Profile screens
    EditProfile: undefined;
    ChangePassword: undefined;
    Settings: undefined;
    Support: undefined;
    Legal: undefined;
    Notifications: undefined;
    AppPreferences: undefined;
};