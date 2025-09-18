import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
	Splash: undefined;
	Onboarding: undefined;
	Login: undefined;
	Register: undefined;
	ForgotPassword: undefined;
}

export type AppTabParamList = {
    Home: undefined;
    Orders: undefined;
    Profile: undefined;
}

export type RootStackParamList = {
    AppTabs: NavigatorScreenParams<AppTabParamList>;
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
    Menu: { vendorId: string };
    Checkout: { 
        cartItems: Record<string, number>; 
        vendorId: string; 
    };
    OrderConfirmation: {
        orderId: string;
        pickupCode: string;
        vendor: any;
        items: any[];
        total: number;
    };
};