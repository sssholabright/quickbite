import { Image, Pressable, Text, View } from 'react-native'
import { MealListCardProps } from '../types/vendor'
import { useTheme } from '../theme/theme'
import { Icon } from './Icon'

export default function MealListCard({ meal, onAddToCart, onRemoveFromCart, quantity }: MealListCardProps) {
    const theme = useTheme()

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            marginBottom: 12,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.colors.border
        }}>
            {/* Left: Meal Image */}
            <Image
                source={{ uri: meal.image }}
                style={{ width: 80, height: 80, borderRadius: 8, marginRight: 12 }}
                resizeMode="cover"
            />
            
            {/* Right: Meal Info */}
            <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "flex-start", marginBottom: 4 }}>
                    <View style={{ flex: 1 }}>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: "700",
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
                    </View>
                    {meal.popular && (
                        <View style={{
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 6,
                            paddingVertical: 2,
                            borderRadius: 8,
                            marginLeft: 8
                        }}>
                            <Text style={{ color: "white", fontSize: 10, fontWeight: "600" }}>
                                Popular
                            </Text>
                        </View>
                    )}
                </View>
                
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    <Text style={{
                        fontSize: 18,
                        fontWeight: "700",
                        color: theme.colors.primary
                    }}>
                        ${meal.price.toFixed(2)}
                    </Text>
          
                    {quantity > 0 ? (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.colors.primary,
                            borderRadius: 20,
                            paddingHorizontal: 8,
                            paddingVertical: 4
                        }}>
                            <Pressable onPress={onRemoveFromCart}>
                                <Icon name="remove" size={16} color="white" />
                            </Pressable>
                            <Text style={{
                                color: "white",
                                fontSize: 14,
                                fontWeight: "600",
                                marginHorizontal: 12
                            }}>
                                {quantity}
                            </Text>
                            <Pressable onPress={onAddToCart}>
                                <Icon name="add" size={16} color="white" />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            onPress={onAddToCart}
                            style={{
                                backgroundColor: theme.colors.primary,
                                borderRadius: 20,
                                paddingHorizontal: 16,
                                paddingVertical: 8
                            }}
                        >
                            <Text style={{
                                color: "white",
                                fontSize: 14,
                                fontWeight: "600"
                            }}>
                                Add to Cart
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    )
}