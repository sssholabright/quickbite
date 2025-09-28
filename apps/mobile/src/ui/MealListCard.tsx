import { Image, Pressable, Text, View } from 'react-native'
import { MealListCardProps } from '../types/vendor'
import { useTheme } from '../theme/theme'
import { Icon } from './Icon'

export default function MealListCard({ meal, onAddToCart, onRemoveFromCart, quantity }: MealListCardProps) {
    const theme = useTheme()

    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }

    return (
        <View style={{
            backgroundColor: theme.colors.surface,
            borderRadius: 16,
            marginBottom: 12,
            // marginHorizontal: 10,
            padding: 12,
            flexDirection: "row",
            alignItems: "center",
            borderWidth: 1,
            borderColor: theme.colors.border,
            shadowColor: theme.mode === "dark" ? "#000" : "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 1,
        }}>
            {/* Left: Meal Image */}
            <View style={{ position: "relative", marginRight: 12 }}>
                <Image
                    source={{ uri: meal.image }}
                    style={{ 
                        width: 90, 
                        height: 90, 
                        borderRadius: 12,
                        backgroundColor: theme.colors.background
                    }}
                    resizeMode="cover"
                />
                
                {/* Preparation Time */}
                {meal.preparationTime && (
                    <View style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8,
                        flexDirection: 'row',
                        alignItems: 'center'
                    }}>
                        <Icon name="time" size={9} color="white" />
                        <Text style={{ 
                            color: "white", 
                            fontSize: 9, 
                            fontWeight: "600", 
                            marginLeft: 3 
                        }}>
                            {meal.preparationTime}m
                        </Text>
                    </View>
                )}

                {/* Popular Badge */}
                {meal.popular && (
                    <View style={{
                        position: "absolute",
                        top: 6,
                        left: 6,
                        backgroundColor: theme.colors.primary,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8
                    }}>
                        <Text style={{ 
                            color: "white", 
                            fontSize: 9, 
                            fontWeight: "700",
                            textTransform: "uppercase"
                        }}>
                            Popular
                        </Text>
                    </View>
                )}

                {/* Availability Status */}
                {!meal.isAvailable && (
                    <View style={{
                        position: "absolute",
                        bottom: 6,
                        left: 6,
                        right: 6,
                        backgroundColor: theme.colors.danger,
                        paddingHorizontal: 6,
                        paddingVertical: 3,
                        borderRadius: 8
                    }}>
                        <Text style={{ 
                            color: "white", 
                            fontSize: 9, 
                            fontWeight: "600",
                            textAlign: "center",
                            textTransform: "uppercase"
                        }}>
                            Out of Stock
                        </Text>
                    </View>
                )}
            </View>
            
            {/* Right: Meal Info */}
            <View style={{ flex: 1 }}>
                {/* Meal Name and Rating */}
                <View style={{ 
                    flexDirection: "row", 
                    justifyContent: "space-between", 
                    alignItems: "flex-start",
                    marginBottom: 6 
                }}>
                    <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={{
                            fontSize: 14,
                            fontWeight: "700",
                            color: meal.isAvailable ? theme.colors.text : theme.colors.muted,
                            marginBottom: 4,
                            lineHeight: 20
                        }} numberOfLines={2}>
                            {meal.name}
                        </Text>
                    </View>
                    
                    {/* Rating (if available) */}
                    {meal.rating && (
                        <View style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: theme.colors.background,
                            paddingHorizontal: 6,
                            paddingVertical: 3,
                            borderRadius: 8,
                            borderWidth: 1,
                            borderColor: theme.colors.border
                        }}>
                            <Icon name="star" size={10} color="#fbbf24" />
                            <Text style={{
                                fontSize: 10,
                                color: theme.colors.muted,
                                marginLeft: 3,
                                fontWeight: "600"
                            }}>
                                {meal.rating}
                            </Text>
                        </View>
                    )}
                </View>

                {/* Description */}
                <Text style={{
                    fontSize: 12,
                    color: theme.colors.muted,
                    marginBottom: 8,
                    lineHeight: 16
                }} numberOfLines={2}>
                    {meal.description}
                </Text>
                
                {/* Price and Add Button */}
                <View style={{
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center"
                }}>
                    {/* Price Section */}
                    <View>
                        {/* Original Price with discount */}
                        {meal.discount && meal.price ? (
                            <View style={{ flexDirection: "row", alignItems: "center" }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: "600",
                                    color: theme.colors.primary,
                                    textDecorationLine: "line-through",
                                    marginRight: 6
                                }}>
                                    {formatNaira(meal.price)}
                                </Text>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: "800",
                                    color: theme.colors.danger
                                }}>
                                    {formatNaira(meal.price - (meal.price * meal.discount / 100))}
                                </Text>
                            </View>
                        ) : (
                            <Text style={{
                                fontSize: 16,
                                fontWeight: "800",
                                color: theme.colors.primary
                            }}>
                                {formatNaira(meal.price)}
                            </Text>
                        )}
                        
                        {/* Review count */}
                        {meal.reviewCount && (
                            <Text style={{
                                fontSize: 10,
                                color: theme.colors.muted,
                                marginTop: 2
                            }}>
                                {meal.reviewCount} reviews
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
                            paddingHorizontal: 10,
                            paddingVertical: 4,
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
                                fontSize: 10,
                                fontWeight: "600",
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
                                paddingHorizontal: 12,
                                paddingVertical: 6,
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
                                fontSize: 10,
                                fontWeight: "600",
                                textTransform: "uppercase",
                                letterSpacing: 0.5
                            }}>
                                {meal.isAvailable ? "Add to Cart" : "Out of Stock"}
                            </Text>
                        </Pressable>
                    )}
                </View>
            </View>
        </View>
    )
}