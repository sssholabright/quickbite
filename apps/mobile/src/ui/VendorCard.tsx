import { View, Text, Image, Pressable } from "react-native";
import { Icon } from "./Icon";
import { useTheme } from "../theme/theme";
import { VendorCardProps } from "../types/vendor";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

export function VendorCard({ vendor }: VendorCardProps) {
    const theme = useTheme();
    const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

    // Get price indicator based on average meal price (mock logic)
    const getPriceIndicator = (rating: number) => {
        if (rating >= 4.8) return "₦₦₦";
        if (rating >= 4.5) return "₦₦";
        return "₦";
    };    

    // Create a local copy to avoid mutating props
    const vendorData = {
        ...vendor,
        isOpen: vendor.isOpen ?? true // Use nullish coalescing to provide default
    };

    const priceIndicator = getPriceIndicator(vendorData.rating);
    
    const handlePress = () => {
        // Don't navigate if vendor is closed
        if (!vendorData.isOpen) return;
        navigation.navigate("Menu", { vendorId: vendorData.id });
    };
    
    return (
        <View
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                marginHorizontal: 16,
                marginBottom: 16,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: theme.mode === "dark" ? "#000" : "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
                // Add opacity when closed
                opacity: vendorData.isOpen ? 1 : 0.6
            }}
        >
            {/* 🖼️ TOP: Vendor Image / Banner */}
            <View style={{ position: "relative" }}>
                <Image
                    source={{ uri: vendorData.image }}
                    style={{ 
                        width: "100%", 
                        height: 160,
                        // Add grayscale filter when closed
                        opacity: vendorData.isOpen ? 1 : 0.7
                    }}
                    resizeMode="cover"
                />

                {/* Badge / Status */}
                <View style={{
                    position: "absolute",
                    top: 8,
                    left: 12,
                    flexDirection: "row",
                    gap: 6
                }}>
                    {vendorData.featured && (
                        <View style={{
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 6,
                            paddingVertical: 4,
                            borderRadius: 12
                        }}>
                            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                                Popular
                            </Text>
                        </View>
                    )}
                    <View style={{
                        backgroundColor: vendorData.isOpen ? theme.colors.primary : theme.colors.danger,
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 12
                    }}>
                        <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                            {vendorData.isOpen ? "Open" : "Closed"}
                        </Text>
                    </View>
                </View>

                {/* Price Indicator */}
                <View style={{
                    position: "absolute",
                    top: 8,
                    right: 12,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    paddingHorizontal: 6,
                    paddingVertical: 4,
                    borderRadius: 12
                }}>
                    <Text style={{ color: "white", fontSize: 12, fontWeight: "700" }}>
                        {priceIndicator}
                    </Text>
                </View>
            </View>

            {/* 📌 MIDDLE: Text & Info */}
            <View style={{ padding: 16 }}>
                {/* Vendor Name */}
                <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: vendorData.isOpen ? theme.colors.text : theme.colors.muted,
                    marginBottom: 5
                }}>
                    {vendorData.name}
                </Text>

                {/* Real Categories from API */}
                {vendorData.categories && vendorData.categories.length > 0 && (
                    <View style={{
                        flexDirection: "row",
                        flexWrap: "wrap",
                        marginBottom: 5,
                        gap: 6
                    }}>
                        {vendorData.categories.slice(0, 3).map((category, index) => (
                            <View
                                key={category.id}
                                style={{
                                    backgroundColor: theme.colors.background,
                                    paddingVertical: 2,
                                    borderRadius: 8,
                                    borderWidth: 1,
                                    borderColor: theme.colors.border
                                }}
                            >
                                <Text style={{
                                    fontSize: 10,
                                    paddingHorizontal: 6,
                                    textTransform: "capitalize",
                                    color: theme.colors.muted,
                                    fontWeight: "500"
                                }}>
                                    {category.name}
                                </Text>
                            </View>
                        ))}
                        {vendorData.categories.length > 3 && (
                            <View style={{
                                backgroundColor: theme.colors.background,
                                paddingVertical: 2,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}>
                                <Text style={{
                                    fontSize: 10,
                                    paddingHorizontal: 6,
                                    color: theme.colors.muted,
                                    fontWeight: "500"
                                }}>
                                    +{vendorData.categories.length - 3} more
                                </Text>
                            </View>
                        )}
                    </View>
                )}

                {/* Pickup Time / ETA */}
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 5
                }}>
                    <Icon name="time" size={16} color={vendorData.isOpen ? theme.colors.primary : theme.colors.muted} />
                    <Text style={{
                        marginLeft: 6,
                        fontSize: 12,
                        color: vendorData.isOpen ? theme.colors.text : theme.colors.muted,
                        fontWeight: "600"
                    }}>
                        {vendorData.isOpen ? `Ready in ${vendorData.eta}` : "Currently Closed"}
                    </Text>
                    {vendorData.isOpen && (
                        <Text style={{
                            marginLeft: 8,
                            fontSize: 10,
                            color: theme.colors.muted
                        }}>
                            • {vendorData.distance}
                        </Text>
                    )}
                </View>
            </View>
            
            {/* 🔽 BOTTOM: Call-to-action */}
            <View style={{
                borderTopColor: theme.colors.border,
                padding: 12,
                backgroundColor: theme.colors.background
            }}>
                <Pressable
                    onPress={handlePress}
                    disabled={!vendorData.isOpen}
                    style={{
                        backgroundColor: vendorData.isOpen ? theme.colors.primary : theme.colors.muted,
                        paddingVertical: 10,
                        paddingHorizontal: 24,
                        borderRadius: 8,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center",
                        opacity: vendorData.isOpen ? 1 : 0.6
                    }}
                >
                    <Text style={{
                        color: "white",
                        fontSize: 14,
                        fontWeight: "600",
                        marginRight: 8
                    }}>
                        {vendorData.isOpen ? "View Menu" : "Currently Closed"}
                    </Text>
                    {vendorData.isOpen && (
                        <Icon name="arrow-forward" size={14} color="white" />
                    )}
                </Pressable>
            </View>
        </View>
    );
}