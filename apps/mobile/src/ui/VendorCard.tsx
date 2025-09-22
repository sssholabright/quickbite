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

      // Get cuisine tags based on category
    const getCuisineTags = (category: string) => {
        const tagMap: Record<string, string[]> = {
            lunch: ["Rice", "Main Course", "Healthy"],
            breakfast: ["Pastries", "Coffee", "Fresh"],
            snacks: ["Quick Bites", "Fast Food", "Snacks"],
            drinks: ["Coffee", "Tea", "Beverages"],
            dinner: ["Dinner", "Evening", "Comfort"]
        };
        return tagMap[category] || [category];
    };

    const priceIndicator = getPriceIndicator(vendor.rating);
    const cuisineTags = getCuisineTags(vendor.category);
    
    const handlePress = () => {
        navigation.navigate("Menu", { vendorId: vendor.id });
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
                elevation: 3
            }}
        >
            {/* �� TOP: Vendor Image / Banner */}
            <View style={{ position: "relative" }}>
                <Image
                    source={{ uri: vendor.image }}
                    style={{ width: "100%", height: 180 }}
                    resizeMode="cover"
                />

                {/* Badge / Status */}
                <View style={{
                    position: "absolute",
                    top: 12,
                    left: 12,
                    flexDirection: "row",
                    gap: 8
                }}>
                    {vendor.featured && (
                        <View style={{
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12
                        }}>
                            <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                                Popular
                            </Text>
                        </View>
                    )}
                    <View style={{
                        backgroundColor: vendor.isOpen ? theme.colors.primary : theme.colors.danger,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12
                    }}>
                        <Text style={{ color: "white", fontSize: 12, fontWeight: "600" }}>
                            {vendor.isOpen ? "Open" : "Closed"}
                        </Text>
                    </View>
                </View>

                {/* Price Indicator */}
                <View style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    backgroundColor: "rgba(0,0,0,0.8)",
                    paddingHorizontal: 8,
                    paddingVertical: 4,
                    borderRadius: 12
                }}>
                    <Text style={{ color: "white", fontSize: 14, fontWeight: "700" }}>
                        {priceIndicator}
                    </Text>
                </View>
            </View>

            {/* 📌 MIDDLE: Text & Info */}
            <View style={{ padding: 16 }}>
                {/* Vendor Name */}
                <Text style={{
                    fontSize: 20,
                    fontWeight: "700",
                    color: theme.colors.text,
                    marginBottom: 8
                }}>
                    {vendor.name}
                </Text>

                {/* Cuisine / Category Tags */}
                <View style={{
                    flexDirection: "row",
                    flexWrap: "wrap",
                    marginBottom: 12,
                    gap: 6
                }}>
                    {cuisineTags.map((tag, index) => (
                        <View
                            key={index}
                            style={{
                                backgroundColor: theme.colors.background,
                                paddingHorizontal: 8,
                                paddingVertical: 4,
                                borderRadius: 8,
                                borderWidth: 1,
                                borderColor: theme.colors.border
                            }}
                        >
                            <Text style={{
                                fontSize: 12,
                                color: theme.colors.muted,
                                fontWeight: "500"
                            }}>
                                {tag}
                            </Text>
                        </View>
                    ))}
                </View>

                {/* Pickup Time / ETA */}
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 12
                }}>
                    <Icon name="time" size={16} color={theme.colors.primary} />
                    <Text style={{
                        marginLeft: 6,
                        fontSize: 14,
                        color: theme.colors.text,
                        fontWeight: "600"
                    }}>
                        Ready in {vendor.eta}
                    </Text>
                    <Text style={{
                        marginLeft: 8,
                        fontSize: 12,
                        color: theme.colors.muted
                    }}>
                        • {vendor.distance}
                    </Text>
                </View>

                {/* ⭐ Rating + Reviews */}
                <View style={{
                    flexDirection: "row",
                    alignItems: "center",
                }}>
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.colors.background,
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 8,
                        marginRight: 8
                    }}>
                        <Icon name="star" size={14} color="#fbbf24" />
                        <Text style={{
                            marginLeft: 4,
                            fontSize: 14,
                            fontWeight: "600",
                            color: theme.colors.text
                        }}>
                            {vendor.rating}
                        </Text>
                        <Text style={{
                            marginLeft: 4,
                            fontSize: 12,
                            color: theme.colors.muted
                        }}>
                            (200+)
                        </Text>
                    </View>
                </View>
            </View>
            
            {/* 🔽 BOTTOM: Call-to-action */}
            <View style={{
                // borderTopWidth: 1,
                borderTopColor: theme.colors.border,
                padding: 16,
                backgroundColor: theme.colors.background
            }}>
                <Pressable
                    onPress={handlePress}
                    style={{
                        backgroundColor: theme.colors.primary,
                        paddingVertical: 12,
                        paddingHorizontal: 24,
                        borderRadius: 8,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "center"
                    }}
                >
                    <Text style={{
                        color: "white",
                        fontSize: 16,
                        fontWeight: "600",
                        marginRight: 8
                    }}>
                        View Menu
                    </Text>
                    <Icon name="arrow-forward" size={16} color="white" />
                </Pressable>
            </View>
        </View>
    );
}