import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Animated, Dimensions, Image, Pressable, ScrollView, Text, View } from 'react-native'
import { CartBottomSheetProps } from '../types/vendor';
import { useTheme } from '../theme/theme';
import { mockMeals } from '../lib/mockData';
import { Icon } from './Icon';
import { Modal } from 'react-native';
import { CTAButton } from './CTAButton';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_HEIGHT = SCREEN_HEIGHT * 0.85;
const MIN_HEIGHT = 300; // Minimum height for header + empty state

export default function CartBottomSheet({ visible, onClose, cartItems, onUpdateQuantity, onRemoveItem, onProceedToCheckout}: CartBottomSheetProps) {
    const theme = useTheme();
    const translateY = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
    const [sheetHeight, setSheetHeight] = useState(MIN_HEIGHT);

    const cartItemsList = useMemo(() => {
        const items = Object.entries(cartItems).map(([mealId, quantity]) => {
            const meal = mockMeals.find(m => m.id === mealId);
            return meal ? { ...meal, quantity } : null;
        }).filter(Boolean);
        return items;
    }, [cartItems]);

    // Calculate dynamic height based on content - moved after cartItemsList
    const calculateHeight = useMemo(() => {
        if (cartItemsList.length === 0) {
            return MIN_HEIGHT; // Just header + empty state
        }
        
        // Calculate height based on number of items
        const headerHeight = 60; // Approximate header height
        const footerHeight = 120; // Approximate footer height
        const itemHeight = 150; // Approximate height per item
        const padding = 40; // Top and bottom padding
        
        const calculatedHeight = headerHeight + (cartItemsList.length * itemHeight) + footerHeight + padding;
        
        // Return the smaller of calculated height or max height
        return Math.min(calculatedHeight, MAX_HEIGHT);
    }, [cartItemsList.length]);

    useEffect(() => {
        setSheetHeight(calculateHeight);
    }, [calculateHeight]);

    useEffect(() => {
        if (visible) {
            Animated.spring(translateY, {
                toValue: 0,
                useNativeDriver: true,
                tension: 100,
                friction: 8,
            }).start();
        } else {
            Animated.timing(translateY, {
                toValue: SCREEN_HEIGHT,
                duration: 300,
                useNativeDriver: true,
            }).start();
        }
    }, [visible]);
    
    const subtotal = useMemo(() => {
        return cartItemsList.reduce((total, item) => {
            return total + (item ? item.price * item.quantity : 0);
        }, 0);
    }, [cartItemsList]);
    
    const totalItems = useMemo(() => {
        return cartItemsList.reduce((total, item) => total + (item?.quantity || 0), 0);
    }, [cartItemsList]);
    
    const handleClose = () => {
        Animated.timing(translateY, {
            toValue: SCREEN_HEIGHT,
            duration: 300,
            useNativeDriver: true,
        }).start(() => onClose());
    };

    const renderCartItem = (item: any) => {
        return (
            <View
                key={item.id}
                style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingVertical: 16,
                    borderBottomWidth: 1,
                    borderBottomColor: theme.colors.border,
                }}
            >   
                {/* Meal Thumbnail */}
                <Image
                    source={{ uri: item.image }}
                    style={{
                        width: 60,
                        height: 60,
                        borderRadius: 8,
                        marginRight: 12,
                    }}
                />

                {/* Meal Info */}
                <View style={{ flex: 1, marginRight: 12 }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '600',
                            color: theme.colors.text,
                            marginBottom: 4,
                        }}
                    >
                        {item.name}
                    </Text>
                    <Text
                        style={{
                            fontSize: 14,
                            color: theme.colors.muted,
                            marginBottom: 8,
                        }}
                    >
                        ${item.price.toFixed(2)} each
                    </Text>

                    {/* Quantity Controls */}
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        <Pressable
                            onPress={() => onUpdateQuantity(item.id, Math.max(0, item.quantity - 1))}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: theme.colors.surface,
                                borderWidth: 1,
                                borderColor: theme.colors.border,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="minus" size={16} color={theme.colors.muted} />
                        </Pressable>

                        <Text
                            style={{
                                fontSize: 16,
                                fontWeight: '600',
                                color: theme.colors.text,
                                marginHorizontal: 16,
                                minWidth: 20,
                                textAlign: 'center',
                            }}
                        >
                            {item.quantity}
                        </Text>

                        <Pressable
                            onPress={() => onUpdateQuantity(item.id, item.quantity + 1)}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: theme.colors.primary,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="plus" size={16} color="white" />
                        </Pressable>
                    </View>
                </View>

                {/* Subtotal */}
                <View style={{ alignItems: 'flex-end' }}>
                    <Text
                        style={{
                            fontSize: 16,
                            fontWeight: '700',
                            color: theme.colors.text,
                            marginBottom: 4,
                        }}
                    >
                        ${(item.price * item.quantity).toFixed(2)}
                    </Text>
                    <Pressable
                        onPress={() => onRemoveItem(item.id)}
                        style={{
                            padding: 4,
                        }}
                    >
                        <Icon name="trash" size={16} color={theme.colors.danger} />
                    </Pressable>
                </View>
            </View>
        );
    };
    
    const renderEmptyCart = () => (
        <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <Icon name="shopping-cart" size={64} color={theme.colors.muted} />
            <Text
                style={{
                    fontSize: 18,
                    fontWeight: '600',
                    color: theme.colors.text,
                    marginTop: 16,
                    marginBottom: 8,
                }}
            >
                Your cart is empty
            </Text>
            <Text
                style={{
                    fontSize: 14,
                    color: theme.colors.muted,
                    textAlign: 'center',
                    paddingHorizontal: 32,
                }}
            >
                Add meals to order from the menu
            </Text>
        </View>
    );

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={handleClose}
        >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
                <Pressable
                    style={{ flex: 1 }}
                    onPress={handleClose}
                />
                <Animated.View
                    style={{
                        backgroundColor: theme.colors.background,
                        borderTopLeftRadius: 20,
                        borderTopRightRadius: 20,
                        height: sheetHeight, // Dynamic height
                        transform: [{ translateY }],
                    }}
                >
                    {/* Header */}
                    <View
                        style={{
                            flexDirection: 'row',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            paddingHorizontal: 20,
                            paddingVertical: 16,
                            borderBottomWidth: 1,
                            borderBottomColor: theme.colors.border,
                        }}
                    >
                        <Text
                            style={{
                                fontSize: 20,
                                fontWeight: '700',
                                color: theme.colors.text,
                            }}
                        >
                            Your Cart
                        </Text>
                        <Pressable
                            onPress={handleClose}
                            style={{
                                width: 32,
                                height: 32,
                                borderRadius: 16,
                                backgroundColor: theme.colors.surface,
                                alignItems: 'center',
                                justifyContent: 'center',
                            }}
                        >
                            <Icon name="close" size={20} color={theme.colors.muted} />
                        </Pressable>
                    </View>

                    {/* Cart Items - Dynamic Layout */}
                    <View style={{ flex: 1 }}>
                        {cartItemsList.length > 0 ? (
                            <ScrollView
                                style={{ flex: 1 }}
                                showsVerticalScrollIndicator={false}
                                contentContainerStyle={{ 
                                    paddingHorizontal: 20,
                                    paddingVertical: 16,
                                }}
                            >
                                {cartItemsList.map(renderCartItem)}
                            </ScrollView>
                        ) : (
                            <View style={{ flex: 1, justifyContent: 'center' }}>
                                {renderEmptyCart()}
                            </View>
                        )}
                    </View>

                    {/* Summary + Actions */}
                    {cartItemsList.length > 0 && (
                        <View
                            style={{
                                padding: 20,
                                borderTopWidth: 1,
                                borderTopColor: theme.colors.border,
                                backgroundColor: theme.colors.surface,
                            }}
                        >
                            {/* Pickup Time Info */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    marginBottom: 16,
                                    paddingHorizontal: 12,
                                    paddingVertical: 8,
                                    backgroundColor: theme.colors.background,
                                    borderRadius: 8,
                                }}
                            >
                                <Icon name="time" size={16} color={theme.colors.primary} />
                                <Text
                                    style={{
                                        marginLeft: 8,
                                        fontSize: 14,
                                        color: theme.colors.text,
                                        fontWeight: '500',
                                    }}
                                >
                                    Ready in ~15 mins
                                </Text>
                            </View>

                            {/* Subtotal */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    marginBottom: 16,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 18,
                                        fontWeight: '600',
                                        color: theme.colors.text,
                                    }}
                                >
                                    Subtotal ({totalItems} items)
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 20,
                                        fontWeight: '700',
                                        color: theme.colors.primary,
                                    }}
                                >
                                    ${subtotal.toFixed(2)}
                                </Text>
                            </View>

                            {/* Proceed Button */}
                            <CTAButton
                                title="Proceed to Checkout"
                                onPress={onProceedToCheckout}
                            />
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
}