import { View, Text, Image, Pressable } from "react-native";
import { MealCardProps } from "../types/vendor";
import { useTheme } from "../theme/theme";
import { Icon } from "../ui/Icon";

export function MealCard({ meal, onPress, onAddToCart }: MealCardProps) {
    const theme = useTheme();
  
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
                borderColor: theme.colors.border
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
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.muted,
                    marginBottom: 8
                }}>
                    {meal.description}
                </Text>
                <Text style={{
                    fontSize: 16,
                    fontWeight: "700",
                    color: theme.colors.primary
                }}>
                    ${meal.price.toFixed(2)}
                </Text>
            </View>
        
            {onAddToCart && (
                <Pressable
                    onPress={(e) => {
                        e.stopPropagation();
                        onAddToCart();
                    }}
                    style={{
                        position: 'absolute',
                        bottom: 8,
                        right: 8,
                        backgroundColor: theme.colors.primary,
                        borderRadius: 16,
                        padding: 8,
                    }}
                >
                    <Icon name="add" size={16} color="white" />
                </Pressable>
            )}
        </Pressable>
    );
}