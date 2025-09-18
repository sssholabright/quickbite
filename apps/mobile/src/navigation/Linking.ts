import * as Linking from "expo-linking";
import type { LinkingOptions } from "@react-navigation/native";
import type { RootStackParamList } from "./types";

const prefix = Linking.createURL("/");

export const linking: LinkingOptions<RootStackParamList> = {
    prefixes: [prefix],
    config: {
        screens: {
            AppTabs: {
                screens: {
                    Home: "home",
                    Orders: "orders",
                    Profile: "profile"
                }
            },
            AuthStack: {
                screens: {
                    Login: "login",
                    Register: "register"
                }
            }
        }
    }
};