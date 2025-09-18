import { Image, Pressable, Text, View } from 'react-native'
import { MealGridCardProps } from '../types/vendor'
import { useTheme } from '../theme/theme'
import { Icon } from './Icon'

export default function MealGridCard({ meal, onAddToCart, onRemoveFromCart, quantity }: MealGridCardProps) {
    const theme = useTheme()

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 12,
            marginBottom: 16,
            marginRight: 16,
            width: 200,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.border
        }}>
            {/* Meal Image */}
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

            {/* Meal Info */}
            <View style={{ padding: 12 }}>
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
                                paddingHorizontal: 12,
                                paddingVertical: 6
                            }}
                        >
                            <Text style={{
                                color: "white",
                                fontSize: 12,
                                fontWeight: "600"
                            }}>
                                Add
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
          
        </View>
    )
}