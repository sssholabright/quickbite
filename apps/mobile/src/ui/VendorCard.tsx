import { View, Text, Image, Pressable } from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "../theme/theme";
import { VendorCardProps } from "../types/vendor";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getNextOpeningTime } from "../utils/timeUtils";

export function VendorCard({ vendor }: VendorCardProps) {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Create a local copy to avoid mutating props
    const vendorData = {
        ...vendor,
        isOpen: vendor.isOpen ?? true
    };

    // Get opening time for closed vendors using the utility function
    const getOpeningTime = () => {
        if (vendorData.isOpen) return null;
        
        // Use the utility function to calculate next opening time
        return getNextOpeningTime({
            openingTime: vendorData.openingTime,
            closingTime: vendorData.closingTime,
            operatingDays: vendorData.operatingDays
        });
    };
    
    const handlePress = () => {
        // Don't navigate if vendor is closed
        if (!vendorData.isOpen) return;
        navigation.navigate("Menu", { vendorId: vendorData.id });
    };
    
    return (
        <Pressable
            onPress={handlePress}
            style={({ pressed }) => ({
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                marginBottom: 8,
                overflow: "hidden",
                width: '48%',
                shadowColor: theme.mode === "dark" ? "#000" : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                opacity: vendorData.isOpen ? (pressed ? 0.8 : 1) : 0.6,
                transform: [{ scale: pressed ? 0.98 : 1 }]
            })}
        >
            {/* 🖼️ TOP: Vendor Image */}
            <View style={{ position: "relative" }}>
                <Image
                    source={{ uri: vendorData.image }}
                    style={{ 
                        width: "100%", 
                        height: 140,
                        opacity: vendorData.isOpen ? 1 : 0.7
                    }}
                    resizeMode="cover"
                />

                {/* Delivery Time Badge */}
                {vendorData.isOpen && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 16
                    }}>
                        <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
                            {vendorData.eta}
                        </Text>
                    </View>
                )}

                {/* Closed Badge */}
                {!vendorData.isOpen && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        backgroundColor: "rgba(0,0,0,0.8)",
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 16
                    }}>
                        <Text style={{ color: "white", fontSize: 11, fontWeight: "600" }}>
                            Closed
                        </Text>
                    </View>
                )}
            </View>

            {/* 📌 BOTTOM: Vendor Info */}
            <View style={{ padding: 12 }}>
                {/* Vendor Name */}
                <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: vendorData.isOpen ? theme.colors.text : theme.colors.muted,
                    marginBottom: 4
                }}>
                    {vendorData.name}
                </Text>

                {/* Rating */}
                {vendorData.rating && vendorData.rating > 0 && (
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 4
                    }}>
                        <Icon name="star" size={14} color="#FFD700" />
                        <Text style={{
                            marginLeft: 4,
                            fontSize: 13,
                            color: theme.colors.muted,
                            fontWeight: "500"
                        }}>
                            {vendorData.rating}
                        </Text>
                    </View>
                )}

                {/* Delivery Fee or Opening Time */}
                <View style={{
                    flexDirection: "row",
                    alignItems: "center"
                }}>
                    {vendorData.isOpen ? (
                        <>
                            <Icon name="bicycle" size={14} color={theme.colors.muted} />
                            <Text style={{
                                marginLeft: 4,
                                fontSize: 10,
                                color: theme.colors.muted,
                                fontWeight: "400"
                            }}>
                                {vendorData.distance}
                            </Text>
                        </>
                    ) : (
                        <>
                            <Icon name="time" size={14} color={theme.colors.muted} />
                            <Text style={{
                                marginLeft: 4,
                                fontSize: 10,
                                color: theme.colors.muted,
                                fontWeight: "500"
                            }}>
                                {getOpeningTime()}
                            </Text>
                        </>
                    )}
                </View>
            </View>
        </Pressable>
    );
}