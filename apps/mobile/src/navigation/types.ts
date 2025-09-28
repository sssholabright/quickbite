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
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
    AppTabs: NavigatorScreenParams<AppTabParamList>;
    LocationPermission: undefined;
    Menu: { vendorId: string };
    Checkout: { vendorId: string; items: any[]; total: number };
    OrderConfirmation: { 
        orderId: string; 
        pickupCode: string; 
        vendor: any; 
        items: any[]; 
        total: number; 
    };
    OrderDetail: { orderId: string };
    // Profile screens
    AddressManagement: undefined;
    PaymentMethods: undefined;
    Settings: undefined;
    AddAddress: undefined;
    EditAddress: { addressId: string };
    EditProfile: undefined;
    ChangePassword: undefined;
    Support: undefined;
    Legal: undefined;
    Notifications: undefined;
};