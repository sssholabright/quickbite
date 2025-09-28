import React, { useMemo } from 'react';
import { View, Text, Pressable, Modal, FlatList, Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '../../theme/theme';
import { Icon } from '../../ui/Icon';
import { CTAButton } from '../../ui/CTAButton';
import { useVendors } from '../../hooks/useMenu';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../../navigation/types';
import { useCartStore } from '../../stores/cart';
import { LinearGradient } from 'expo-linear-gradient';

type CartScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Checkout'>;

interface CartScreenProps {
    visible: boolean;
    onClose: () => void;
}

export default function CartScreen({ visible, onClose }: CartScreenProps) {
    const theme = useTheme();
    const insets = useSafeAreaInsets();
    const navigation = useNavigation<CartScreenNavigationProp>();

    const formatNaira = (amount: number): string => {
        return `₦${amount.toLocaleString('en-NG')}`
    }

    // Cart store
    const { 
        items: cartItems, 
        updateQuantity, 
        removeItem, 
        getItemsList, 
        getSubtotal,
        getItemTotal
    } = useCartStore();

    // Get vendors to resolve cart items
    const { data: vendors = [] } = useVendors()

    const cartItemsList = useMemo(() => {
        return getItemsList().map(cartItem => {
            const vendor = vendors.find(v => v.id === cartItem.vendorId);
            return {
                ...cartItem,
                vendorName: vendor?.businessName || 'Vendor',
            };
        });
    }, [cartItems, vendors, getItemsList]);

    const subtotal = useMemo(() => {
        return getSubtotal();
    }, [cartItems, getSubtotal]);

    const deliveryFee = 200;
    const serviceFee = 50;
    const total = subtotal + deliveryFee + serviceFee;

    const handleProceedToCheckout = () => {
        onClose();
        const items = cartItemsList.map(item => ({
            id: item.id,
            name: item.name,
            price: item.price || 0,
            quantity: item.quantity
        }));
        
        navigation.navigate('Checkout', {
            vendorId: cartItemsList[0]?.vendorId || 'vendor1',
            items: items,
            total: total
        } as any);
    };

    const renderCartItem = ({ item }: { item: typeof cartItemsList[0] }) => {
        const hasAddOns = Object.values(item.addOns || {}).some(qty => qty > 0)
        
        return (
            <Pressable style={{
                backgroundColor: theme.colors.background,
                borderRadius: 16,
                padding: 8,
                marginBottom: 12,
                borderWidth: 1,
                borderColor: theme.colors.border,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.1,
                shadowRadius: 8,
                elevation: 3, // 🚀 FIX: Increased elevation for better shadow
            }}>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                    {/* Image Container */}
                    <View style={{ position: 'relative', marginRight: 12 }}>
                        <Image
                            source={{ uri: item.image || 'https://via.placeholder.com/120' }}
                            style={{
                                width: 70,
                                height: 70,
                                borderRadius: 12,
                            }}
                            resizeMode="cover"
                            onError={() => {
                                // 🚀 FIX: Handle image loading errors gracefully
                                console.log('Image failed to load:', item.image);
                            }}
                        />
                        {/* Preparation Time Badge */}
                        {item.preparationTime && (
                            <View style={{
                                position: 'absolute',
                                bottom: -4,
                                right: -4,
                                backgroundColor: theme.colors.primary,
                                paddingHorizontal: 6,
                                paddingVertical: 2,
                                borderRadius: 8,
                                flexDirection: 'row',
                                alignItems: 'center'
                            }}>
                                <Icon name="time" size={10} color="white" />
                                <Text style={{ color: "white", fontSize: 10, fontWeight: "600", marginLeft: 2 }}>
                                    {item.preparationTime}m
                                </Text>
                            </View>
                        )}
                    </View>

                    {/* Content */}
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <View style={{ flex: 1, marginRight: 8 }}>
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '700',
                                    color: theme.colors.text,
                                    marginBottom: 2,
                                }} numberOfLines={2}> {/* 🚀 FIX: Prevent text overflow */}
                                    {item.name} <Text style={{ fontSize: 8, color: theme.colors.muted }}>x{formatNaira(item.price * item.quantity)}</Text>
                                </Text>
                                <Text style={{
                                    fontSize: 10,
                                    color: theme.colors.muted,
                                    marginBottom: 4,
                                }} numberOfLines={1}> {/* 🚀 FIX: Prevent text overflow */}
                                    {item.vendorName}
                                </Text>

                                {/* Add-ons */}
                                {hasAddOns && (
                                    <View style={{ marginBottom: 8 }}>
                                        {Object.entries(item.addOns || {})
                                            .filter(([_, qty]) => qty > 0)
                                            .map(([addOnId, qty]) => {
                                                const addOnDetail = item.addOnDetails?.[addOnId]
                                                return (
                                                    <View key={addOnId} style={{ 
                                                        flexDirection: 'row', 
                                                        alignItems: 'center',
                                                        marginBottom: 2
                                                    }}>
                                                        <View style={{
                                                            width: 4,
                                                            height: 4,
                                                            borderRadius: 2,
                                                            backgroundColor: theme.colors.primary,
                                                            marginRight: 6
                                                        }} />
                                                        <Text style={{ fontSize: 10, color: theme.colors.muted }} numberOfLines={1}>
                                                            {qty}x {addOnDetail?.name || `Add-on #${addOnId.slice(-4)}`} +{formatNaira(addOnDetail?.price * qty || 0)}
                                                        </Text>
                                                    </View>
                                                )
                                        })}
                                    </View>
                                )}

                                {/* Price */}
                                <Text style={{
                                    fontSize: 14,
                                    fontWeight: '700',
                                    color: theme.colors.primary,
                                }}>
                                    {formatNaira(getItemTotal(item.id))}
                                </Text>
                            </View>

                            {/* Quantity Controls */}
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                backgroundColor: theme.colors.surface,
                                borderRadius: 12,
                                padding: 2,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                            }}>
                                <Pressable
                                    onPress={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))} // 🚀 FIX: Prevent quantity below 1
                                    style={({ pressed }) => ({
                                        width: 20, // 🚀 FIX: Larger touch target
                                        height: 20,
                                        borderRadius: 12,
                                        backgroundColor: pressed ? theme.colors.border : theme.colors.background,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    })}
                                >
                                    <Icon name="minus" size={12} color={theme.colors.muted} />
                                </Pressable>
                                
                                <Text style={{
                                    fontSize: 10, // 🚀 FIX: Slightly larger text
                                    fontWeight: '600',
                                    color: theme.colors.text,
                                    marginHorizontal: 8, // 🚀 FIX: More spacing
                                    minWidth: 24,
                                    textAlign: 'center',
                                }}>
                                    {item.quantity}
                                </Text>
                                
                                <Pressable
                                    onPress={() => updateQuantity(item.id, item.quantity + 1)}
                                    style={({ pressed }) => ({
                                        width: 20, // 🚀 FIX: Larger touch target
                                        height: 20,
                                        borderRadius: 12,
                                        backgroundColor: pressed ? theme.colors.primary + 'DD' : theme.colors.primary,
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    })}
                                >
                                    <Icon name="plus" size={12} color="white" />
                                </Pressable>
                            </View>
                        </View>

                        {/* Remove Button */}
                        <Pressable
                            onPress={() => removeItem(item.id)}
                            style={({ pressed }) => ({
                                flexDirection: 'row',
                                alignItems: 'center',
                                marginTop: 8,
                                paddingVertical: 6, // 🚀 FIX: Larger touch target
                                paddingHorizontal: 10,
                                borderRadius: 6,
                                backgroundColor: pressed ? theme.colors.danger + '20' : theme.colors.danger + '10',
                                alignSelf: 'flex-start'
                            })}
                        >
                            <Icon name="trash" size={12} color={theme.colors.danger} /> {/* 🚀 FIX: Slightly larger icon */}
                            <Text style={{
                                fontSize: 11, // 🚀 FIX: Slightly larger text
                                color: theme.colors.danger,
                                marginLeft: 4,
                                fontWeight: '500'
                            }}>
                                Remove
                            </Text>
                        </Pressable>
                    </View>
                </View>
            </Pressable>
        );
    };
    
    const renderEmptyState = () => (
        <View style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 32,
        }}>
            <View style={{
                width: 100,
                height: 100,
                borderRadius: 60,
                backgroundColor: theme.colors.surface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.1,
                shadowRadius: 12,
                elevation: 4,
            }}>
                <Icon name="shopping-cart" size={40} color={theme.colors.muted} />
            </View>
            <Text style={{
                fontSize: 16,
                fontWeight: '700',
                color: theme.colors.text,
                marginBottom: 8,
                textAlign: 'center',
            }}>
                Your cart is empty
            </Text>
            <Text style={{
                fontSize: 12,
                color: theme.colors.muted,
                textAlign: 'center',
                lineHeight: 24,
            }}>
                Add some delicious meals to get started
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="overFullScreen"
            onRequestClose={onClose}
            transparent={true}
        >
            <Pressable 
                style={{
                    flex: 1,
                    backgroundColor: 'rgba(0,0,0,0.5)',
                    justifyContent: 'flex-end',
                }}
                onPress={onClose}
            >
                <Pressable 
                    style={{ 
                        flex: 1, 
                        backgroundColor: theme.colors.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        marginTop: 120,
                    }}
                    onPress={(e) => e.stopPropagation()} // 🚀 FIX: Prevent closing when tapping inside
                >
                    {/* Header with Gradient */}
                    <LinearGradient
                        colors={[theme.colors.primary, theme.colors.primary + 'DD']}
                        style={{
                            paddingTop: 20,
                            paddingBottom: 20,
                            paddingHorizontal: 20,
                            borderTopLeftRadius: 20,
                            borderTopRightRadius: 20,
                        }}
                    >
                        <View style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            marginBottom: 16,
                        }}>
                            <View>
                                <Text style={{
                                    fontSize: 16,
                                    fontWeight: '800',
                                    color: 'white',
                                    marginBottom: 4,
                                }}>
                                    Your Cart
                                </Text>
                                <Text style={{
                                    fontSize: 10,
                                    color: 'rgba(255,255,255,0.8)',
                                }}>
                                    {cartItemsList.length} {cartItemsList.length === 1 ? 'item' : 'items'}
                                </Text>
                            </View>
                            <Pressable
                                onPress={onClose}
                                style={{
                                    width: 28,
                                    height: 28,
                                    borderRadius: 18,
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                <Icon name="close" size={16} color="white" />
                            </Pressable>
                        </View>

                        {/* Cart Summary Card */}
                        <View style={{
                            backgroundColor: 'rgba(255,255,255,0.2)',
                            borderRadius: 12,
                            paddingHorizontal: 12,
                            paddingVertical: 8,
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}>
                                <View>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '600',
                                        color: 'rgba(255,255,255,0.8)',
                                        marginBottom: 2,
                                    }}>
                                        Total Amount
                                    </Text>
                                    <Text style={{
                                        fontSize: 12,
                                        fontWeight: '700',
                                        color: 'white',
                                    }}>
                                        {formatNaira(total)}
                                    </Text>
                                </View>
                                <View style={{
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    paddingHorizontal: 12,
                                    paddingVertical: 6,
                                    borderRadius: 20,
                                }}>
                                    <Text style={{
                                        fontSize: 10,
                                        color: 'white',
                                        fontWeight: '600',
                                    }}>
                                        Ready in ~15 mins
                                    </Text>
                                </View>
                            </View>
                        </View>
                    </LinearGradient>

                    {cartItemsList.length > 0 ? (
                        <>
                            {/* Cart Items */}
                            <FlatList
                                data={cartItemsList}
                                renderItem={renderCartItem}
                                keyExtractor={(item) => item.id}
                                style={{ flex: 1 }}
                                contentContainerStyle={{ 
                                    padding: 20,
                                    paddingBottom: 220 // 🚀 FIX: Increased padding to account for fixed bottom
                                }}
                                showsVerticalScrollIndicator={false}
                                nestedScrollEnabled={true} // 🚀 FIX: Enable nested scrolling
                            />

                            {/* Fixed Bottom Summary */}
                            <View style={{
                                position: 'absolute',
                                bottom: 0,
                                left: 0,
                                right: 0,
                                backgroundColor: theme.colors.background,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.border,
                                paddingTop: 10,
                                paddingBottom: insets.bottom,
                                paddingHorizontal: 20,
                            }}>
                                {/* Price Breakdown */}
                                <View style={{ marginBottom: 20 }}>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginBottom: 4,
                                    }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.muted, fontWeight: '600' }}>
                                            Subtotal
                                        </Text>
                                        <Text style={{ fontSize: 12, color: theme.colors.text, fontWeight: '700' }}>
                                            {formatNaira(subtotal)}
                                        </Text>
                                    </View>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginBottom: 4,
                                    }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.muted, fontWeight: '600' }}>
                                            Delivery Fee
                                        </Text>
                                        <Text style={{ fontSize: 12, color: theme.colors.text, fontWeight: '700' }}>
                                            {formatNaira(deliveryFee)}
                                        </Text>
                                    </View>
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                        marginBottom: 12,
                                    }}>
                                        <Text style={{ fontSize: 12, color: theme.colors.muted, fontWeight: '600' }}>
                                            Service Fee
                                        </Text>
                                        <Text style={{ fontSize: 12, color: theme.colors.text, fontWeight: '700' }}>
                                            {formatNaira(serviceFee)}
                                        </Text>
                                    </View>
                                    <View style={{
                                        height: 1,
                                        backgroundColor: theme.colors.border,
                                        marginBottom: 12,
                                    }} />
                                    <View style={{
                                        flexDirection: 'row',
                                        justifyContent: 'space-between',
                                    }}>
                                        <Text style={{
                                            fontSize: 12,
                                            fontWeight: '700',
                                            color: theme.colors.text,
                                        }}>
                                            Total 
                                        </Text>
                                        <Text style={{
                                            fontSize: 16,
                                            fontWeight: '700',
                                            color: theme.colors.primary,
                                        }}>
                                            {formatNaira(total)}
                                        </Text>
                                    </View>
                                </View>

                                {/* Checkout Button */}
                                <CTAButton
                                    title="Proceed to Checkout"
                                    onPress={handleProceedToCheckout}
                                    style={{
                                        borderRadius: 12,
                                        paddingVertical: 10,
                                        marginBottom: 10
                                    }}
                                />
                            </View>
                        </>
                    ) : (
                        renderEmptyState()
                    )}
                </Pressable>
            </Pressable>
        </Modal>
    );
}