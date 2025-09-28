import { Image, Pressable, Text, View } from 'react-native'
import { MealGridCardProps } from '../types/vendor'
import { useTheme } from '../theme/theme'
import { Icon } from './Icon'

export default function MealGridCard({ meal, onAddToCart, onRemoveFromCart, quantity }: MealGridCardProps) {
    const theme = useTheme()

    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginBottom: 16,
            marginHorizontal: 8,
            width: 155,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.mode === "dark" ? "#000" : "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 8,
            elevation: 4,
        }}>
            {/* Meal Image */}
            <View style={{ position: "relative" }}>
                <Image
                    source={{ uri: meal.image }}
                    style={{ 
                        width: "100%", 
                        height: 120,
                        backgroundColor: theme.colors.background
                    }}
                    resizeMode="cover"
                />
                
                {/* Overlay badges */}
                <View style={{
                    position: "absolute",
                    top: 8,
                    left: 8,
                    flexDirection: "row",
                    gap: 4
                }}>
                    {meal.popular && (
                        <View style={{
                            backgroundColor: theme.colors.primary,
                            paddingHorizontal: 8,
                            paddingVertical: 4,
                            borderRadius: 12,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 1 },
                            shadowOpacity: 0.2,
                            shadowRadius: 2,
                            elevation: 2,
                        }}>
                            <Text style={{ 
                                color: "white", 
                                fontSize: 10, 
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                            }}>
                                Popular
                            </Text>
                        </View>
                    )}
                    
                    {/* Availability Status */}
                    <View style={{
                        backgroundColor: meal.isAvailable ? theme.colors.primary : theme.colors.danger,
                        paddingHorizontal: 6,
                        paddingVertical: 4,
                        borderRadius: 12
                    }}>
                        <Text style={{ 
                            color: "white", 
                            fontSize: 9, 
                            fontWeight: "600",
                            textTransform: "uppercase"
                        }}>
                            {meal.isAvailable ? "Available" : "Unavailable"}
                        </Text>
                    </View>
                </View>

                {/* Preparation Time */}
                {meal.preparationTime && (
                    <View style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        paddingHorizontal: 8,
                        paddingVertical: 4,
                        borderRadius: 12,
                        flexDirection: 'row',
                        alignItems: 'center',
                    }}>
                        <Icon name="time" size={10} color="white" />
                        <Text style={{ 
                            color: "white", 
                            fontSize: 10, 
                            fontWeight: "600", 
                            marginLeft: 4 
                        }}>
                            {meal.preparationTime}m
                        </Text>
                    </View>
                )}

                {/* Discount Badge */}
                {meal.discount && (
                    <View style={{
                        position: "absolute",
                        bottom: 8,
                        right: 8,
                        backgroundColor: theme.colors.danger,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8,
                        transform: [{ rotate: '15deg' }]
                    }}>
                        <Text style={{ 
                            color: "white", 
                            fontSize: 9, 
                            fontWeight: "800",
                            textAlign: "center"
                        }}>
                            -{meal.discount}%
                        </Text>
                    </View>
                )}
            </View>

            {/* Meal Info */}
            <View style={{ padding: 12 }}>
                {/* Meal Name */}
                <Text style={{
                    fontSize: 14,
                    fontWeight: "700",
                    color: theme.colors.text,
                    marginBottom: 4,
                    lineHeight: 18,
                }} numberOfLines={2}>
                    {meal.name}
                </Text>

                {/* Description */}
                <Text style={{
                    fontSize: 11,
                    color: theme.colors.muted,
                    marginBottom: 8,
                    lineHeight: 14,
                }} numberOfLines={2}>
                    {meal.description}
                </Text>

                {/* Rating (if available) */}
                {meal.rating && (
                    <View style={{
                        flexDirection: "row",
                        alignItems: "center",
                        marginBottom: 8
                    }}>
                        <Icon name="star" size={12} color="#fbbf24" />
                        <Text style={{
                            fontSize: 10,
                            color: theme.colors.muted,
                            marginLeft: 4,
                            fontWeight: "500"
                        }}>
                            {meal.rating} • {meal.reviewCount || 'No reviews'}
                        </Text>
                    </View>
                )}
                
                {/* Price and Add Button */}
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: "auto"
                }}>
                    <View>
                        {/* Original Price with discount */}
                        {meal.discount && meal.price ? (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: "600",
                                    color: theme.colors.primary,
                                    textDecorationLine: "line-through",
                                    marginRight: 4
                                }}>
                                    {formatNaira(meal.price)}
                                </Text>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: "800",
                                    color: theme.colors.danger
                                }}>
                                    {formatNaira(meal.price)}
                                </Text>
                            </View>
                        ) : (
                            <Text style={{
                                fontSize: 14,
                                fontWeight: "800",
                                color: theme.colors.primary
                            }}>
                                {formatNaira(meal.price)}
                            </Text>
                        )}
                    </View>

                    {/* Add/Remove Button */}
                    {quantity > 0 ? (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.colors.primary,
                            borderRadius: 20,
                            paddingHorizontal: 12,
                            paddingVertical: 6,
                            shadowColor: theme.colors.primary,
                            shadowOffset: { width: 0, height: 2 },
                            shadowOpacity: 0.3,
                            shadowRadius: 4,
                            elevation: 3,
                        }}>
                            <Pressable 
                                onPress={onRemoveFromCart}
                                style={{
                                    padding: 4,
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                }}
                            >
                                <Icon name="remove" size={14} color="white" />
                            </Pressable>
                            <Text style={{
                                color: "white",
                                fontSize: 14,
                                fontWeight: "700",
                                marginHorizontal: 8,
                                minWidth: 20,
                                textAlign: "center"
                            }}>
                                {quantity}
                            </Text>
                            <Pressable 
                                onPress={onAddToCart}
                                style={{
                                    padding: 4,
                                    borderRadius: 12,
                                    backgroundColor: 'rgba(255,255,255,0.2)'
                                }}
                            >
                                <Icon name="add" size={14} color="white" />
                            </Pressable>
                        </View>
                    ) : (
                        <Pressable
                            onPress={onAddToCart}
                            disabled={!meal.isAvailable}
                            style={{
                                backgroundColor: meal.isAvailable ? theme.colors.primary : theme.colors.muted,
                                borderRadius: 20,
                                paddingHorizontal: 16,
                                paddingVertical: 8,
                                shadowColor: meal.isAvailable ? theme.colors.primary : theme.colors.muted,
                                shadowOffset: { width: 0, height: 2 },
                                shadowOpacity: 0.3,
                                shadowRadius: 4,
                                elevation: 3,
                                opacity: meal.isAvailable ? 1 : 0.6
                            }}
                        >
                            <Text style={{
                                color: "white",
                                fontSize: 11,
                                fontWeight: "700",
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                            }}>
                                {meal.isAvailable ? "Add" : "Out of Stock"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    )
}