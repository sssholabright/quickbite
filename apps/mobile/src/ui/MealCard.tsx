import { View, Text, Image, Pressable } from "react-native";
import { MealCardProps } from "../types/vendor";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";

export function MealCard({ meal, onPress }: MealCardProps) {
    const theme = useTheme();
    
    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }

    return (
        <Pressable
            onPress={onPress}
            style={{
                backgroundColor: theme.colors.surface,
                borderRadius: 12,
                marginRight: 12,
                width: 200,
                overflow: "hidden",
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 4,
                elevation: 3,
            }}
        >
            <View style={{ position: "relative" }}>
                <Image
                    source={{ uri: meal.image }}
                    style={{ width: "100%", height: 120 }}
                    resizeMode="cover"
                />
                {meal.popular && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        left: 8,
                        backgroundColor: theme.colors.primary,
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8
                    }}>
                        <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                            Popular
                        </Text>
                    </View>
                )}
                
                {/* Preparation Time Badge */}
                {meal.preparationTime && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: "rgba(0,0,0,0.7)",
                        paddingHorizontal: 6,
                        paddingVertical: 2,
                        borderRadius: 8
                    }}>
                        <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                            {meal.preparationTime}min
                        </Text>
                    </View>
                )}
            </View>
            
            <View style={{ padding: 12 }}>
                <Text style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: theme.colors.text,
                    marginBottom: 4
                }}>
                    {meal.name}
                </Text>
                <Text 
                    style={{
                        fontSize: 12,
                        color: theme.colors.muted,
                        marginBottom: 8
                    }}
                    numberOfLines={2}
                >
                    {meal.description}
                </Text>
                
                {/* Vendor Info */}
                {meal.vendorName && (
                    <Text style={{
                        fontSize: 10,
                        color: theme.colors.muted,
                        marginBottom: 4
                    }}>
                        by {meal.vendorName}
                    </Text>
                )}
                
                <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: theme.colors.primary
                }}>
                    {formatNaira(meal.price)}
                </Text>
            </View>
        
            {/* View Menu Button */}
            <View style={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: theme.colors.primary,
                borderRadius: 16,
                paddingHorizontal: 12,
                paddingVertical: 6
            }}>
                <Text style={{
                    color: "white",
                    fontSize: 12,
                    fontWeight: "600"
                }}>
                    View Menu
                </Text>
            </View>
        </Pressable>
    );
}