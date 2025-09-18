import type { NavigatorScreenParams } from "@react-navigation/native";

export type AuthStackParamList = {
    Login: undefined;
    Register: undefined;
    ForgotPassword: undefined;
    ResetPassword: undefined;
    VerifyEmail: undefined;
    VerifyPhone: undefined;
}

export type AppTabParamList = {
    Home: undefined;
    Orders: undefined;
    Profile: undefined;
}

export type RootStackParamList = {
    AppTabs: NavigatorScreenParams<AppTabParamList>;
    AuthStack: NavigatorScreenParams<AuthStackParamList>;
}